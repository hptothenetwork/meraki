import { NextResponse } from "next/server"
import { getSiteAssets } from "@/backend/db/site-settings"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    const assets = (await getSiteAssets()) || {}
    return NextResponse.json({ assets })
  } catch {
    return NextResponse.json({ assets: {} }, { status: 200 })
  }
}
