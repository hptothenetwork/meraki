import { NextResponse } from "next/server"
import { listPublishedEvents } from "@/backend/db/events"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const items = await listPublishedEvents()
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("[api/events] failed to load events", error)
    return NextResponse.json({ error: "Failed to load events", items: [] }, { status: 500 })
  }
}

