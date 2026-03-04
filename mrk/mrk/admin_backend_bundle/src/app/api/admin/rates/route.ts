import { NextResponse } from "next/server";
import type { CurrencyRate } from "@/types/catalog";
import { deleteRate, listRates, upsertRate, getRatesConfig, setRatesConfig } from "@backend/db/rates";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidCurrency(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const v = code.trim().toUpperCase();
  if (v.length !== 3) return false;
  return /^[A-Z]{3}$/.test(v);
}

function isValidRate(value: number): boolean {
  if (typeof value !== "number") return false;
  if (!Number.isFinite(value)) return false;
  return value > 0;
}

export async function GET(req: Request) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rates = await listRates();
    const config = await getRatesConfig();
    if (rates.length > 0) {
      const primary =
        rates.find((r) => r.pairId === "usd-tzs") ||
        rates.find((r) => r.base.toUpperCase() === "USD") ||
        rates[0];
      const defaultCurrency =
        config?.defaultCurrency && rates.some((r) => r.target === config.defaultCurrency || r.base === config.defaultCurrency)
          ? config.defaultCurrency
          : primary?.base || "USD";
      return NextResponse.json({ rates, rate: primary, defaultCurrency });
    }
  } catch (error) {
    console.error("[admin/rates] db fetch failed", error);
  }

  const fallbackRate: CurrencyRate = {
    base: "USD",
    target: "TZS",
    rate: 2600,
    source: "fallback",
    updatedAt: new Date().toISOString(),
    pairId: "usd-tzs",
  };
  return NextResponse.json({
    rates: [fallbackRate],
    rate: fallbackRate,
    defaultCurrency: "USD",
    warning: "Using fallback rate. Save rates in admin to replace this value.",
  });
}

export async function POST(req: Request) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as Partial<CurrencyRate> & { defaultCurrency?: string; makeDefault?: boolean };

  if (body.defaultCurrency && !body.base && !body.target && !body.rate) {
    const defaultCurrency = body.defaultCurrency.trim().toUpperCase();
    if (!isValidCurrency(defaultCurrency)) {
      return NextResponse.json({ error: "Invalid defaultCurrency" }, { status: 400 });
    }
    await setRatesConfig({ defaultCurrency });
    const rates = await listRates();
    return NextResponse.json({ ok: true, defaultCurrency, rates });
  }

  if (body.rate === undefined || !body.base || !body.target) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const base = body.base.trim().toUpperCase();
  const target = body.target.trim().toUpperCase();
  const rateValue = Number(body.rate);

  if (!isValidCurrency(base) || !isValidCurrency(target)) {
    return NextResponse.json({ error: "Invalid currency code" }, { status: 400 });
  }
  if (base === target) {
    return NextResponse.json({ error: "Base and target must differ" }, { status: 400 });
  }
  if (!isValidRate(rateValue)) {
    return NextResponse.json({ error: "Invalid rate" }, { status: 400 });
  }

  const rate: CurrencyRate = {
    base,
    target,
    rate: rateValue,
    source: body.source ?? "manual",
    updatedAt: new Date().toISOString(),
  };
  try {
    const saved = await upsertRate(rate);
    if (body.makeDefault) {
      await setRatesConfig({ defaultCurrency: rate.target });
    }
    const rates = await listRates();
    const config = await getRatesConfig();
    return NextResponse.json({ rate: saved, rates, defaultCurrency: config?.defaultCurrency });
  } catch {
    return NextResponse.json({ error: "Failed to save rate" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await deleteRate(id);
  const rates = await listRates();
  const primary = rates.find((r) => r.pairId === "usd-tzs") || rates[0] || null;
  const config = await getRatesConfig();
  let defaultCurrency = config?.defaultCurrency;
  if (!primary) {
    defaultCurrency = defaultCurrency || "USD";
  } else if (defaultCurrency && !rates.some((r) => r.target === defaultCurrency || r.base === defaultCurrency)) {
    defaultCurrency = primary.base;
    await setRatesConfig({ defaultCurrency });
  }
  return NextResponse.json({ ok: true, rates, rate: primary, defaultCurrency });
}
