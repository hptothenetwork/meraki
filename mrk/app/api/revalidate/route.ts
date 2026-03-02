import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RevalidatePayload = {
  secret?: string
  paths?: string[]
  tags?: string[]
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => ({}))) as RevalidatePayload
  const expectedSecret = process.env.STOREFRONT_REVALIDATE_SECRET
  const providedSecret = req.headers.get("x-revalidate-secret") || payload.secret

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const paths = Array.isArray(payload.paths) && payload.paths.length > 0 ? payload.paths : ["/"]
  const tags = Array.isArray(payload.tags) ? payload.tags : []

  for (const path of paths) {
    if (typeof path === "string" && path.startsWith("/")) {
      revalidatePath(path)
    }
  }

  for (const tag of tags) {
    if (typeof tag === "string" && tag.trim().length > 0) {
      revalidateTag(tag.trim(), "max")
    }
  }

  return NextResponse.json({
    revalidated: true,
    paths,
    tags,
    at: new Date().toISOString(),
  })
}
