import "server-only";
import { db } from "../firebase.server";

export type GiftCardStatus = "active" | "disabled" | "redeemed";
export type GiftCardRequestStatus = "pending" | "approved" | "cancelled";
export type GiftCodeKind = "gift_card" | "discount_code";
export type DiscountType = "amount" | "percent";

export type GiftCard = {
  code: string;
  kind?: GiftCodeKind;
  balance: number;
  originalAmount: number;
  discountType?: DiscountType;
  discountByCurrency?: Record<string, number>;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  status: GiftCardStatus;
  recipientEmail?: string;
  recipientUserId?: string;
  recipientName?: string;
  senderName?: string;
  note?: string;
  issuedBy?: string;
  redeemedAt?: string;
};

const collectionName = "gift_cards";
const requestCollectionName = "gift_card_requests";

export type GiftCardRequest = {
  id: string;
  amount: number;
  currency: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
  message?: string;
  deliveryDate?: string;
  sessionId: string;
  purchaserUserId?: string;
  status: GiftCardRequestStatus;
  issuedGiftCardCode?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  processedBy?: string;
};

export function normalizeGiftCardCode(code: string) {
  return code.trim().toUpperCase();
}

function docRefFromCode(code: string) {
  return db.collection(collectionName).doc(normalizeGiftCardCode(code));
}

function toTwoDecimals(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function withoutUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Partial<T> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key as keyof T] = value as T[keyof T];
    }
  }
  return output;
}

function normalizeDiscountByCurrency(input: Record<string, unknown> | undefined) {
  if (!input) return {};
  const output: Record<string, number> = {};
  for (const [currency, rawValue] of Object.entries(input)) {
    const key = currency.trim().toUpperCase();
    if (!key) continue;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) continue;
    output[key] = toTwoDecimals(parsed);
  }
  return output;
}

export async function getGiftCardByCode(code: string): Promise<GiftCard | null> {
  const ref = docRefFromCode(code);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return snap.data() as GiftCard;
}

export async function listGiftCards(limit = 200): Promise<GiftCard[]> {
  const snap = await db.collection(collectionName).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => doc.data() as GiftCard);
}

export async function createGiftCard(
  input: Omit<GiftCard, "createdAt" | "updatedAt" | "status" | "balance"> & {
    balance?: number;
    status?: GiftCardStatus;
  },
) {
  const now = new Date().toISOString();
  const code = normalizeGiftCardCode(input.code);
  const originalAmount = toTwoDecimals(Math.max(0, Number(input.originalAmount || 0)));
  const balance = toTwoDecimals(
    Math.max(0, Number.isFinite(input.balance as number) ? Number(input.balance) : originalAmount),
  );
  const status: GiftCardStatus = input.status || (balance > 0 ? "active" : "redeemed");

  const payload: GiftCard = {
    code,
    kind: "gift_card",
    balance,
    originalAmount,
    expiryDate: input.expiryDate,
    createdAt: now,
    updatedAt: now,
    status,
    recipientEmail: input.recipientEmail,
    recipientUserId: input.recipientUserId,
    recipientName: input.recipientName,
    senderName: input.senderName,
    note: input.note,
    issuedBy: input.issuedBy,
    redeemedAt: status === "redeemed" ? now : undefined,
  };

  const ref = docRefFromCode(code);
  const existing = await ref.get();
  if (existing.exists) {
    throw new Error("Gift card code already exists");
  }
  const sanitizedPayload = withoutUndefined(payload) as GiftCard;
  await ref.set(sanitizedPayload);
  return sanitizedPayload;
}

export async function createDiscountCode(input: {
  code: string;
  discountType?: DiscountType;
  discountByCurrency: Record<string, unknown>;
  expiryDate?: string;
  note?: string;
  issuedBy?: string;
}) {
  const now = new Date().toISOString();
  const code = normalizeGiftCardCode(input.code);
  const discountByCurrency = normalizeDiscountByCurrency(input.discountByCurrency);
  if (Object.keys(discountByCurrency).length === 0) {
    throw new Error("At least one currency discount is required");
  }

  const payload: GiftCard = {
    code,
    kind: "discount_code",
    balance: 0,
    originalAmount: 0,
    discountType: input.discountType === "percent" ? "percent" : "amount",
    discountByCurrency,
    expiryDate: input.expiryDate,
    createdAt: now,
    updatedAt: now,
    status: "active",
    note: input.note,
    issuedBy: input.issuedBy,
  };

  const ref = docRefFromCode(code);
  const existing = await ref.get();
  if (existing.exists) {
    throw new Error("Gift card code already exists");
  }
  const sanitizedPayload = withoutUndefined(payload) as GiftCard;
  await ref.set(sanitizedPayload);
  return sanitizedPayload;
}

export async function updateGiftCard(
  code: string,
  updates: Partial<
    Pick<
      GiftCard,
      "status" | "expiryDate" | "note" | "recipientEmail" | "recipientName" | "senderName" | "discountType"
    > & {
      discountByCurrency?: Record<string, unknown>;
    }
  >,
) {
  const ref = docRefFromCode(code);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Gift card not found");
  }

  const now = new Date().toISOString();
  const normalizedUpdates: Record<string, unknown> = { ...updates, updatedAt: now };
  if (updates.discountByCurrency) {
    normalizedUpdates.discountByCurrency = normalizeDiscountByCurrency(updates.discountByCurrency);
  }
  await ref.set(withoutUndefined(normalizedUpdates), { merge: true });
  const updated = await ref.get();
  return updated.data() as GiftCard;
}

export async function redeemGiftCard(code: string, amount: number) {
  const normalizedCode = normalizeGiftCardCode(code);
  const redeemAmount = toTwoDecimals(Math.max(0, amount));
  if (!redeemAmount) {
    throw new Error("Invalid redemption amount");
  }

  const ref = docRefFromCode(normalizedCode);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new Error("Gift card not found");
    }

    const card = snap.data() as GiftCard;
    if (card.kind === "discount_code") {
      throw new Error("Discount code balance cannot be redeemed");
    }
    if (card.status !== "active") {
      throw new Error("Gift card is not active");
    }
    if (card.expiryDate && new Date(card.expiryDate) < new Date()) {
      throw new Error("Gift card has expired");
    }
    if (card.balance < redeemAmount) {
      throw new Error("Insufficient balance");
    }

    const nextBalance = toTwoDecimals(card.balance - redeemAmount);
    const now = new Date().toISOString();
    const nextStatus: GiftCardStatus = nextBalance <= 0 ? "redeemed" : "active";

    tx.set(
      ref,
      withoutUndefined({
        balance: nextBalance,
        status: nextStatus,
        updatedAt: now,
        redeemedAt: nextStatus === "redeemed" ? now : card.redeemedAt || undefined,
      }),
      { merge: true },
    );

    return {
      code: normalizedCode,
      amountUsed: redeemAmount,
      remainingBalance: nextBalance,
      status: nextStatus,
    };
  });
}

export async function createGiftCardRequest(
  input: Omit<GiftCardRequest, "id" | "status" | "createdAt" | "updatedAt">,
) {
  const now = new Date().toISOString();
  const docRef = db.collection(requestCollectionName).doc();
  const payload: GiftCardRequest = {
    id: docRef.id,
    amount: toTwoDecimals(Math.max(0, Number(input.amount || 0))),
    currency: (input.currency || "USD").toUpperCase(),
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    recipientName: input.recipientName.trim(),
    senderName: input.senderName.trim(),
    senderEmail: input.senderEmail.trim().toLowerCase(),
    message: input.message?.trim() || undefined,
    deliveryDate: input.deliveryDate || undefined,
    sessionId: input.sessionId,
    purchaserUserId: input.purchaserUserId || undefined,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const sanitizedPayload = withoutUndefined(payload) as GiftCardRequest;
  await docRef.set(sanitizedPayload);
  return sanitizedPayload;
}

export async function listGiftCardRequests(limit = 200): Promise<GiftCardRequest[]> {
  const snap = await db.collection(requestCollectionName).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => doc.data() as GiftCardRequest);
}

export async function updateGiftCardRequest(
  id: string,
  updates: Partial<Pick<GiftCardRequest, "status" | "issuedGiftCardCode" | "processedBy" | "processedAt">>,
) {
  const ref = db.collection(requestCollectionName).doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("Gift card request not found");
  }

  const now = new Date().toISOString();
  await ref.set(withoutUndefined({ ...updates, updatedAt: now }), { merge: true });
  const updated = await ref.get();
  return updated.data() as GiftCardRequest;
}
