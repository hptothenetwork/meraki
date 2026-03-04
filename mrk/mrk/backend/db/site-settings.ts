import "server-only"
import { db } from "../firebase.server"
import type { SiteAssets } from "@/types/catalog"

const collectionName = "siteSettings"
const defaultDocId = "default"

export async function getSiteAssets(): Promise<SiteAssets | null> {
  const snap = await db.collection(collectionName).doc(defaultDocId).get()
  if (!snap.exists) return null
  return snap.data() as SiteAssets
}
