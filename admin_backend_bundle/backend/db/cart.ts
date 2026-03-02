import "server-only";
import { db } from "../firebase.server";

export type CartItem = {
  id: string;
  name: string;
  priceUsd: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
};

type CartDoc = {
  sessionId: string;
  currency: string;
  items: CartItem[];
  updatedAt: string;
};

const collectionName = "carts";

export async function getCart(sessionId: string): Promise<CartDoc | null> {
  const snap = await db.collection(collectionName).doc(sessionId).get();
  if (!snap.exists) return null;
  return snap.data() as CartDoc;
}

export async function saveCart(sessionId: string, cart: Omit<CartDoc, "sessionId">) {
  const payload: CartDoc = {
    sessionId,
    ...cart,
    updatedAt: new Date().toISOString(),
  };
  await db.collection(collectionName).doc(sessionId).set(payload, { merge: true });
  return payload;
}

export async function clearCart(sessionId: string) {
  await db.collection(collectionName).doc(sessionId).delete();
}
