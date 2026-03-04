import "server-only"
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
const hasValidServiceAccount =
  Boolean(projectId?.trim()) &&
  Boolean(clientEmail?.includes("@")) &&
  !String(clientEmail).startsWith("REPLACE_WITH_") &&
  Boolean(privateKey?.includes("BEGIN PRIVATE KEY")) &&
  !String(privateKey).includes("REPLACE_WITH_")

if (!hasValidServiceAccount) {
  console.warn("[firebase-admin] Missing/invalid credentials; Firestore admin will not initialize.")
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        hasValidServiceAccount
          ? {
              credential: cert({
                projectId,
                clientEmail,
                privateKey,
              }),
            }
          : {},
      )

export const db = getFirestore(app)
