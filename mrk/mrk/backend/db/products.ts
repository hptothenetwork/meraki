import "server-only"
import { db } from "../firebase.server"
import { FieldPath } from "firebase-admin/firestore"
import type { Product } from "@/types/catalog"

type ProductDoc = Omit<Product, "id">

const collectionName = "products"

export async function getAllProducts(): Promise<Product[]> {
  const snapshot = await db.collection(collectionName).get()
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ProductDoc) }))
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const normalized = Array.from(
    new Set(ids.map((id) => id.trim()).filter((id): id is string => id.length > 0)),
  )
  if (normalized.length === 0) return []

  const chunks: string[][] = []
  for (let i = 0; i < normalized.length; i += 10) {
    chunks.push(normalized.slice(i, i + 10))
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      db.collection(collectionName).where(FieldPath.documentId(), "in", chunk).get(),
    ),
  )

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ProductDoc) })),
  )
}
