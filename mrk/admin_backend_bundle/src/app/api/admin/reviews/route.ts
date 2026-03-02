import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Review = {
    id?: string;
    author: string;
    rating: number;
    text: string;
    product?: string;
    image?: string;
    verified?: boolean;
    featured?: boolean;
    status: "pending" | "approved" | "hidden" | "deleted";
    createdAt?: string;
    deletedAt?: string;
};

export async function GET(req: NextRequest) {
    try {
        requireAdmin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeDeleted = searchParams.get("deleted") === "true";

    const snapshot = await db.collection("reviews").orderBy("createdAt", "desc").get();
    // Ensure Firestore doc.id is used, not any stored 'id' field
    const allReviews = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Review, "id">;
        return { ...data, id: doc.id };
    });
    const reviews = allReviews.filter((r) => includeDeleted ? r.status === "deleted" : r.status !== "deleted");

    return NextResponse.json({ items: reviews });
}

export async function POST(req: NextRequest) {
    try {
        requireAdmin(req);
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Review;
    if (!body.author?.trim() || !body.text?.trim()) {
        return NextResponse.json({ error: "Author and text are required" }, { status: 400 });
    }

    // Strip out client-side ID to avoid saving it to Firestore
    const reviewData = { ...body };
    delete reviewData.id;
    const docRef = await db.collection("reviews").add({
        ...reviewData,
        rating: Math.min(5, Math.max(1, body.rating || 5)),
        createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id, ok: true });
}

export async function PUT(req: NextRequest) {
    try {
        requireAdmin(req);
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Review;
    if (!body.id) {
        return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    const { id, ...data } = body;
    await db.collection("reviews").doc(id).update(data);
    return NextResponse.json({ ok: true });
}

// Soft delete - marks as deleted instead of permanent removal
export async function DELETE(req: NextRequest) {
    try {
        requireAdmin(req);
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
        return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    if (permanent) {
        // Permanent delete
        await db.collection("reviews").doc(id).delete();
        return NextResponse.json({ ok: true, permanent: true });
    }

    // Soft delete - move to recycle bin
    await db.collection("reviews").doc(id).update({
        status: "deleted",
        deletedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, deleted: true });
}

// Restore from recycle bin
export async function PATCH(req: NextRequest) {
    try {
        requireAdmin(req);
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { id: string; action: "restore" };
    if (!body.id) {
        return NextResponse.json({ error: "Review ID required" }, { status: 400 });
    }

    if (body.action === "restore") {
        // Restore to pending status
        await db.collection("reviews").doc(body.id).update({
            status: "pending",
            deletedAt: null,
        });
        return NextResponse.json({ ok: true, restored: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
