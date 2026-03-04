import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";
import { triggerStorefrontRevalidate } from "@backend/revalidateStorefront";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Event = {
    id?: string;
    title: string;
    description: string;
    shortDescription?: string;
    date: string;
    endDate?: string;
    location: string;
    image?: string;
    link?: string;
    status: "upcoming" | "ongoing" | "past" | "draft" | "deleted";
    featured?: boolean;
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

    const snapshot = await db.collection("events").orderBy("date", "desc").get();
    // Ensure Firestore doc.id is used, not any stored 'id' field
    const allEvents = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<Event, "id">;
        return { ...data, id: doc.id };
    });
    const events = allEvents.filter((e) => includeDeleted ? e.status === "deleted" : e.status !== "deleted");

    return NextResponse.json({ items: events });
}

export async function POST(req: NextRequest) {
    try {
        requireAdmin(req);
        assertSameOrigin(req);
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Event;
    if (!body.title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Strip out client-side ID to avoid saving it to Firestore
    const eventData = { ...body };
    delete eventData.id;
    const docRef = await db.collection("events").add({
        ...eventData,
        createdAt: new Date().toISOString(),
    });

    await triggerStorefrontRevalidate({
        reason: "event-create",
        paths: ["/", "/events"],
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

    const body = (await req.json()) as Event;
    if (!body.id) {
        return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const { id, ...data } = body;
    await db.collection("events").doc(id).update(data);
    await triggerStorefrontRevalidate({
        reason: "event-update",
        paths: ["/", "/events"],
    });
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
        return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    if (permanent) {
        // Permanent delete
        await db.collection("events").doc(id).delete();
        await triggerStorefrontRevalidate({
            reason: "event-delete-permanent",
            paths: ["/", "/events"],
        });
        return NextResponse.json({ ok: true, permanent: true });
    }

    // Soft delete - move to recycle bin
    await db.collection("events").doc(id).update({
        status: "deleted",
        deletedAt: new Date().toISOString(),
    });
    await triggerStorefrontRevalidate({
        reason: "event-soft-delete",
        paths: ["/", "/events"],
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
        return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    if (body.action === "restore") {
        // Restore to upcoming so it is visible on storefront immediately.
        await db.collection("events").doc(body.id).update({
            status: "upcoming",
            deletedAt: null,
        });
        await triggerStorefrontRevalidate({
            reason: "event-restore",
            paths: ["/", "/events"],
        });
        return NextResponse.json({ ok: true, restored: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

