import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@backend/admin/auth";
import { getSiteAssets, saveSiteAssets } from "@backend/db/siteSettings";
import type { SiteAssets } from "@/types/catalog";
import { assertSameOrigin } from "@backend/admin/csrf";
import { triggerStorefrontRevalidate } from "@backend/revalidateStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/meraki_the_brand/";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const assets = (await getSiteAssets()) || {};
  return NextResponse.json({ assets });
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Partial<SiteAssets>;
  const placeholdersInput = body.placeholders;
  const sectionImagesInput = body.sectionImages;
  const productByCategory =
    placeholdersInput && typeof placeholdersInput === "object" && placeholdersInput.productByCategory
      ? Object.fromEntries(
        Object.entries(placeholdersInput.productByCategory || {}).filter(
          ([key, val]) => typeof key === "string" && key.trim().length > 0 && typeof val === "string" && val.trim().length > 0,
        ),
      )
      : undefined;
  const normalizeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const sanitizeString = (value: unknown) => {
    const parsed = normalizeString(value);
    return parsed.length ? parsed : undefined;
  };
  const sanitizeBoolean = (value: unknown): boolean | undefined => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return undefined;
  };
  const sanitizeNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };
  const sanitizeStringArray = (maybeArray: unknown): string[] | undefined => {
    if (!Array.isArray(maybeArray)) return undefined;
    const list = maybeArray
      .map((val) => sanitizeString(val))
      .filter((val): val is string => typeof val === "string" && val.length > 0);
    return list.length ? list : undefined;
  };
  const sanitizeMediaList = (input: unknown): string[] | undefined => {
    const rawList = Array.isArray(input) ? input : input ? [input] : [];
    const list = rawList
      .map((item) => {
        if (typeof item === "string") return sanitizeString(item);
        if (item && typeof item === "object" && "src" in item) {
          return sanitizeString((item as { src?: unknown }).src);
        }
        return undefined;
      })
      .filter((val): val is string => typeof val === "string" && val.length > 0);
    return list.length ? list : undefined;
  };
  const sanitizeSignatureCuts = (input: unknown) => {
    if (!input || typeof input !== "object") return undefined;
    const allowed = ["relaxedFit", "tropicalUrban", "campShirt", "linenSets"] as const;
    const output: Partial<Record<(typeof allowed)[number], string[]>> = {};
    allowed.forEach((key) => {
      const val = sanitizeMediaList((input as Record<string, unknown>)[key]);
      if (val) output[key] = val;
    });
    return Object.keys(output).length ? output : undefined;
  };
  const sanitizeLengthGuide = (input: unknown) => {
    if (!input || typeof input !== "object") return undefined;
    const entries = Object.entries(input as Record<string, unknown>).reduce<
      Record<string, { front?: string[]; back?: string[] }>
    >((acc, [id, pair]) => {
      if (!id.trim()) return acc;
      if (!pair || typeof pair !== "object") return acc;
      const front = sanitizeMediaList((pair as Record<string, unknown>).front);
      const back = sanitizeMediaList((pair as Record<string, unknown>).back);
      if (front || back) acc[id] = { ...(front ? { front } : {}), ...(back ? { back } : {}) };
      return acc;
    }, {});
    return Object.keys(entries).length ? entries : undefined;
  };
  const sanitizeSectionImages = (): SiteAssets["sectionImages"] | undefined => {
    if (!sectionImagesInput || typeof sectionImagesInput !== "object") return undefined;
    const sectionImages: NonNullable<SiteAssets["sectionImages"]> = {};
    const singleKeys: Array<"heroMain" | "heroFullscreen" | "aboutMubah" | "materialTexture" | "productEditorial" | "contactHero" | "contactStudio"> = [
      "heroMain",
      "heroFullscreen",
      "aboutMubah",
      "materialTexture",
      "productEditorial",
      "contactHero",
      "contactStudio",
    ];
    singleKeys.forEach((key) => {
      const val = sanitizeMediaList((sectionImagesInput as Record<string, unknown>)[key as string]);
      if (val) sectionImages[key] = val;
    });

    const signatureCuts = sanitizeSignatureCuts((sectionImagesInput as Record<string, unknown>).signatureCuts);
    if (signatureCuts) sectionImages.signatureCuts = signatureCuts;

    const instagramStrip = sanitizeStringArray((sectionImagesInput as Record<string, unknown>).instagramStrip);
    if (instagramStrip) sectionImages.instagramStrip = instagramStrip;

    const editorialCustomers = sanitizeStringArray((sectionImagesInput as Record<string, unknown>).editorialCustomers);
    if (editorialCustomers) sectionImages.editorialCustomers = editorialCustomers;

    const lengthGuide = sanitizeLengthGuide((sectionImagesInput as Record<string, unknown>).lengthGuide);
    if (lengthGuide) sectionImages.lengthGuide = lengthGuide;

    return Object.keys(sectionImages).length ? sectionImages : undefined;
  };

  const sanitizeGlobalSale = (): SiteAssets["globalSale"] | undefined => {
    if (!body.globalSale || typeof body.globalSale !== "object") return undefined;
    const input = body.globalSale as Record<string, unknown>;
    const typeRaw = sanitizeString(input.type);
    const allowedTypes = new Set(["clearance", "blackfriday", "holiday", "flash", "seasonal", ""]);
    const type = typeRaw && allowedTypes.has(typeRaw) ? (typeRaw as NonNullable<SiteAssets["globalSale"]>["type"]) : undefined;
    return {
      active: sanitizeBoolean(input.active),
      type,
      label: sanitizeString(input.label),
      discountPercent: sanitizeNumber(input.discountPercent),
      showBanner: sanitizeBoolean(input.showBanner),
      showNavbar: sanitizeBoolean(input.showNavbar),
      endsAt: sanitizeString(input.endsAt),
    };
  };

  const sanitizeContact = (): SiteAssets["contact"] | undefined => {
    if (!body.contact || typeof body.contact !== "object") return undefined;
    const input = body.contact as Record<string, unknown>;
    return {
      whatsappNumber: sanitizeString(input.whatsappNumber),
      phone: sanitizeString(input.phone),
      email: sanitizeString(input.email),
      studio: sanitizeString(input.studio),
      enableCustomCutsForm: sanitizeBoolean(input.enableCustomCutsForm),
    };
  };

  const sanitizeSectionVisibility = (): SiteAssets["sectionVisibility"] | undefined => {
    if (!body.sectionVisibility || typeof body.sectionVisibility !== "object") return undefined;
    const output: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(body.sectionVisibility as Record<string, unknown>)) {
      const parsed = sanitizeBoolean(val);
      if (typeof parsed === "boolean") output[key] = parsed;
    }
    return Object.keys(output).length ? (output as SiteAssets["sectionVisibility"]) : undefined;
  };

  const sanitizeQuickShop = (): SiteAssets["quickShop"] | undefined => {
    if (!body.quickShop || typeof body.quickShop !== "object") return undefined;
    const input = body.quickShop as Record<string, unknown>;
    const productIds = sanitizeStringArray(input.productIds);
    return {
      productIds,
      enabled: sanitizeBoolean(input.enabled),
    };
  };

  const sanitizeImageDisplaySettings = (): SiteAssets["imageDisplaySettings"] | undefined => {
    if (!body.imageDisplaySettings || typeof body.imageDisplaySettings !== "object") return undefined;
    const output: NonNullable<SiteAssets["imageDisplaySettings"]> = {};
    for (const [key, raw] of Object.entries(body.imageDisplaySettings as Record<string, unknown>)) {
      if (!raw || typeof raw !== "object") continue;
      const setting = raw as Record<string, unknown>;
      const fit = sanitizeString(setting.fit);
      output[key] = {
        scale: sanitizeNumber(setting.scale),
        positionX: sanitizeNumber(setting.positionX),
        positionY: sanitizeNumber(setting.positionY),
        fit: fit === "cover" || fit === "contain" || fit === "fill" ? fit : undefined,
      };
    }
    return Object.keys(output).length ? output : undefined;
  };

  const sanitizeSignatureCutsList = (): SiteAssets["signatureCuts"] | undefined => {
    if (!Array.isArray(body.signatureCuts)) return undefined;
    const items = body.signatureCuts
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => ({
        id: sanitizeString(item.id) || "",
        title: sanitizeString(item.title) || "",
        copy: sanitizeString(item.copy) || "",
        image: sanitizeString(item.image) || "",
        slug: sanitizeString(item.slug) || "",
        order: sanitizeNumber(item.order),
      }))
      .filter((item) => item.id && item.title && item.image && item.slug);
    return items.length ? items : undefined;
  };

  const sanitizeInstagramPhotos = (): SiteAssets["instagramPhotos"] | undefined => {
    if (!Array.isArray(body.instagramPhotos)) return undefined;
    const items = body.instagramPhotos
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => ({
        id: sanitizeString(item.id) || "",
        imageUrl: sanitizeString(item.imageUrl) || "",
        caption: sanitizeString(item.caption),
        link: INSTAGRAM_PROFILE_URL,
        order: sanitizeNumber(item.order),
      }))
      .filter((item) => item.id && item.imageUrl);
    return items.length ? items : undefined;
  };

  const sanitizeEditorialPhotos = (): SiteAssets["editorialPhotos"] | undefined => {
    if (!Array.isArray(body.editorialPhotos)) return undefined;
    const items = body.editorialPhotos
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : null))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => ({
        id: sanitizeString(item.id) || "",
        imageUrl: sanitizeString(item.imageUrl) || "",
        caption: sanitizeString(item.caption),
        span: sanitizeString(item.span),
        height: sanitizeNumber(item.height),
        offset: sanitizeString(item.offset),
        order: sanitizeNumber(item.order),
      }))
      .filter((item) => item.id && item.imageUrl);
    return items.length ? items : undefined;
  };

  // Helper to remove undefined values recursively
  const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
    const result = {} as T;
    for (const key in obj) {
      const value = obj[key];
      if (value === undefined) continue;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const cleaned = removeUndefined(value as Record<string, unknown>);
        if (Object.keys(cleaned).length > 0) {
          (result as Record<string, unknown>)[key] = cleaned;
        }
      } else {
        (result as Record<string, unknown>)[key] = value;
      }
    }
    return result;
  };

  const placeholdersRaw = placeholdersInput && typeof placeholdersInput === "object"
    ? {
      productDefault: sanitizeString(placeholdersInput.productDefault),
      socialFallback: sanitizeString(placeholdersInput.socialFallback),
      orderItemFallback: sanitizeString(placeholdersInput.orderItemFallback),
      productByCategory,
    }
    : undefined;

  const assetsRaw: SiteAssets = {
    productDescriptionImage: sanitizeString(body.productDescriptionImage),
    pdfSlides: Array.isArray(body.pdfSlides)
      ? body.pdfSlides.filter((x) => typeof x === "string" && x.trim().length > 0)
      : undefined,
    placeholders: placeholdersRaw,
    sectionImages: sanitizeSectionImages(),
    // Handle partners array
    partners: Array.isArray(body.partners)
      ? (body.partners as Array<{ name?: unknown; logo?: unknown; website?: unknown; size?: unknown }>)
        .filter((p) => p && typeof p === "object" && typeof p.name === "string" && p.name.trim().length > 0)
        .map((p) => ({
          name: String(p.name).trim(),
          logo: typeof p.logo === "string" ? p.logo.trim() : "",
          ...(typeof p.website === "string" && p.website.trim() ? { website: p.website.trim() } : {}),
          ...(typeof p.size === "string" && ['small', 'medium', 'large', 'xlarge'].includes(p.size) ? { size: p.size as "small" | "medium" | "large" | "xlarge" } : {}),
        }))
      : undefined,
    globalSale: sanitizeGlobalSale(),
    contact: sanitizeContact(),
    sectionVisibility: sanitizeSectionVisibility(),
    quickShop: sanitizeQuickShop(),
    imageDisplaySettings: sanitizeImageDisplaySettings(),
    signatureCuts: sanitizeSignatureCutsList(),
    instagramPhotos: sanitizeInstagramPhotos(),
    editorialPhotos: sanitizeEditorialPhotos(),
  };

  // Remove all undefined values before saving to Firestore
  const assets = removeUndefined(assetsRaw as Record<string, unknown>) as SiteAssets;

  const saved = await saveSiteAssets(assets);
  await triggerStorefrontRevalidate({
    reason: "settings-update",
    paths: ["/", "/contact", "/shop", "/collections", "/about", "/events", "/blogs"],
  });
  return NextResponse.json({ assets: saved });
}
