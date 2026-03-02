import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

// Admin initialization with env-based credentials.
// FIREBASE_PRIVATE_KEY should include newlines, e.g. replace \n with actual newlines at runtime.
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.warn("[firebase-admin] Missing credentials; Firestore/Storage admin will not initialize.");
}

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        projectId && clientEmail && privateKey
          ? {
              credential: cert({
                projectId,
                clientEmail,
                privateKey,
              }),
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            }
          : {
              storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            },
      );

export const db = getFirestore(app);
export const storage = getStorage(app);
export const adminAuth = getAuth(app);
