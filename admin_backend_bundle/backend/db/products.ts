import "server-only";
import { db } from "../firebase.server";
import type { Product } from "@/types/catalog";

type ProductDoc = Omit<Product, "id">;

const collectionName = "products";

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ProductDoc) }));
}

export async function getProduct(id: string): Promise<Product | null> {
  const ref = db.collection(collectionName).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as ProductDoc) };
}
