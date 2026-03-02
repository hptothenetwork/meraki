import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@backend/admin/csrf";
import { requireAdmin } from "@backend/admin/auth";
import {
  createDiscountCode,
  createGiftCard,
  listGiftCardRequests,
  listGiftCards,
  normalizeGiftCardCode,
  updateGiftCard,
  updateGiftCardRequest,
} from "@backend/db/giftCards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function generateGiftCardCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  const part = () => Array.from({ length: 4 }, pick).join("");
  return `MERAKI-${part()}-${part()}`;
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [cards, requests] = await Promise.all([listGiftCards(), listGiftCardRequests()]);
    return NextResponse.json({ cards, requests });
  } catch (error) {
    console.error("[admin/gift-cards] Failed to load gift cards:", error);
    return NextResponse.json({ error: "Failed to load gift cards" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      kind?: "gift_card" | "discount_code";
      code?: string;
      amount?: number;
      discountType?: "amount" | "percent";
      discountByCurrency?: Record<string, unknown>;
      expiryDate?: string;
      recipientEmail?: string;
      recipientUserId?: string;
      recipientName?: string;
      senderName?: string;
      note?: string;
      requestId?: string;
    };

    const kind = body.kind === "discount_code" ? "discount_code" : "gift_card";
    if (kind === "gift_card") {
      const amount = Number(body.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) {
        return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
      }
    }
    const code = normalizeGiftCardCode(body.code?.trim() || generateGiftCardCode());
    const card =
      kind === "discount_code"
        ? await createDiscountCode({
            code,
            discountType: body.discountType === "percent" ? "percent" : "amount",
            discountByCurrency: body.discountByCurrency || {},
            expiryDate: body.expiryDate || undefined,
            note: body.note?.trim() || undefined,
            issuedBy: "admin",
          })
        : await createGiftCard({
            code,
            originalAmount: Number(body.amount || 0),
            balance: Number(body.amount || 0),
            expiryDate: body.expiryDate || undefined,
            recipientEmail: body.recipientEmail?.trim().toLowerCase() || undefined,
            recipientUserId: body.recipientUserId?.trim() || undefined,
            recipientName: body.recipientName?.trim() || undefined,
            senderName: body.senderName?.trim() || undefined,
            note: body.note?.trim() || undefined,
            issuedBy: "admin",
          });

    if (body.requestId) {
      try {
        await updateGiftCardRequest(body.requestId, {
          status: "approved",
          issuedGiftCardCode: card.code,
          processedBy: "admin",
          processedAt: new Date().toISOString(),
        });
      } catch (requestError) {
        console.error("[admin/gift-cards] Failed to update gift request after issuing card:", requestError);
      }
    }

    return NextResponse.json({ ok: true, card });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create gift card";
    const status = message === "Gift card code already exists" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      code?: string;
      status?: "active" | "disabled" | "redeemed";
      expiryDate?: string | null;
      note?: string | null;
      recipientEmail?: string | null;
      recipientName?: string | null;
      senderName?: string | null;
      requestId?: string;
      requestStatus?: "pending" | "approved" | "cancelled";
      discountType?: "amount" | "percent";
      discountByCurrency?: Record<string, unknown>;
    };
    if (body.requestId && body.requestStatus) {
      const request = await updateGiftCardRequest(body.requestId, {
        status: body.requestStatus,
        processedBy: "admin",
        processedAt: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, request });
    }

    if (!body.code) {
      return NextResponse.json({ error: "Gift card code is required" }, { status: 400 });
    }

    const updated = await updateGiftCard(body.code, {
      status: body.status,
      expiryDate: body.expiryDate || undefined,
      note: body.note || undefined,
      recipientEmail: body.recipientEmail?.toLowerCase() || undefined,
      recipientName: body.recipientName || undefined,
      senderName: body.senderName || undefined,
      discountType: body.discountType,
      discountByCurrency: body.discountByCurrency,
    });
    return NextResponse.json({ ok: true, card: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update gift card";
    const status = message === "Gift card not found" || message === "Gift card request not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
