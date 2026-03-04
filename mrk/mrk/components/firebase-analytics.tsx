"use client"

import { useEffect } from "react"
import { initFirebaseAnalytics } from "@/lib/firebase-client"

export function FirebaseAnalytics() {
  useEffect(() => {
    const run = async () => {
      try {
        await initFirebaseAnalytics()
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[firebase-analytics] init skipped:", error)
        }
      }
    }

    void run()
  }, [])

  return null
}
