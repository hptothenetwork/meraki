import { NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";

export async function GET(request: Request) {
  try {
    requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all users from Firestore
    const usersSnapshot = await db.collection("users").orderBy("createdAt", "desc").get();
    const users = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users });
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch users" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    requireAdmin(request);
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Missing uid" }, { status: 400 });
    }

    // Delete user from Firestore
    await db.collection("users").doc(uid).delete();

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete user" }, { status: 500 });
  }
}
