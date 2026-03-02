import "server-only"
import { db } from "../firebase.server"
import type { Category } from "@/types/catalog"

const collectionName = "categories"

export async function listCategories(): Promise<Category[]> {
  const snap = await db.collection(collectionName).orderBy("name").get()
  return snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Category, "id">) }))
}
