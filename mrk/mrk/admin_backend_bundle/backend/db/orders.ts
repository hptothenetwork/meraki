import "server-only";
import { db } from "../firebase.server";
import type { CartItem } from "./cart";

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed";

export type Order = {
  id: string;
  sessionId: string;
  userId?: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  giftCard?: {
    code: string;
    amountUsed: number;
    remainingBalance?: number;
  };
  currency: string;
  createdAt: string;
  contact?: {
    email?: string;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    zip?: string;
  };
};

const collectionName = "orders";

type FirestoreError = {
  code?: number;
};

const hasErrorCode = (error: unknown): error is Required<FirestoreError> =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as FirestoreError).code === "number";

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefined(item)).filter((item) => item !== undefined) as T;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, removeUndefined(entry)]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

export async function createOrder(payload: Omit<Order, "id" | "createdAt">) {
  const docRef = db.collection(collectionName).doc();
  const order = removeUndefined<Order>({
    ...payload,
    paymentStatus: payload.paymentStatus ?? "pending",
    id: docRef.id,
    createdAt: new Date().toISOString(),
  });
  await docRef.set(order);
  return order;
}

export async function getOrdersForSession(sessionId: string): Promise<Order[]> {
  try {
    const snap = await db
      .collection(collectionName)
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "desc")
      .get();
    return snap.docs.map((doc) => doc.data() as Order);
  } catch (err: unknown) {
    // If Firestore composite index is missing, fallback to an unsorted fetch and sort in memory.
    if (hasErrorCode(err) && err.code === 9 /* FAILED_PRECONDITION */) {
      const snap = await db.collection(collectionName).where("sessionId", "==", sessionId).get();
      return snap.docs
        .map((doc) => doc.data() as Order)
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0));
    }
    throw err;
  }
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await db.collection(collectionName).orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => doc.data() as Order);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const ref = db.collection(collectionName).doc(orderId);
  await ref.set({ status }, { merge: true });
}

export async function deleteOrder(orderId: string) {
  await db.collection(collectionName).doc(orderId).delete();
}
