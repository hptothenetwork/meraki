"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function hasRequiredConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId,
  )
}

export function getFirebaseApp() {
  if (!hasRequiredConfig()) return null
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  const app = getFirebaseApp()
  if (!app) return null
  if (!(await isSupported())) return null
  return getAnalytics(app)
}
