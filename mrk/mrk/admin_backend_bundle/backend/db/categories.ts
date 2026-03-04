import "server-only";
import { db } from "../firebase.server";

export type Category = {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  createdAt?: string;
};

const collectionName = "categories";

export async function listCategories(): Promise<Category[]> {
  const snap = await db.collection(collectionName).orderBy("name").get();
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Category, "id">) }));
}

export async function saveCategory(category: Category) {
  const payload: Category = {
    ...category,
    id: category.id,
    createdAt: category.createdAt ?? new Date().toISOString(),
  };
  await db.collection(collectionName).doc(category.id).set(payload, { merge: true });
  return payload;
}

export async function deleteCategory(id: string) {
  await db.collection(collectionName).doc(id).delete();
}
