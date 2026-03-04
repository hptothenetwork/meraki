import "server-only";
import { adminAuth } from "../firebase.server";

export type FirebaseIdentity = {
  uid: string;
  email?: string;
  name?: string;
};

function readBearerToken(request: Request) {
  const raw =
    request.headers.get("authorization") ||
    request.headers.get("Authorization") ||
    request.headers.get("x-firebase-token");
  if (!raw) return "";
  if (raw.startsWith("Bearer ")) return raw.slice("Bearer ".length).trim();
  return raw.trim();
}

export async function requireFirebaseUser(request: Request): Promise<FirebaseIdentity> {
  const token = readBearerToken(request);
  if (!token) throw new Error("Missing Firebase auth token");
  const decoded = await adminAuth.verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: typeof decoded.email === "string" ? decoded.email.toLowerCase() : undefined,
    name: typeof decoded.name === "string" ? decoded.name : undefined,
  };
}

export async function getFirebaseUserIfAvailable(request: Request): Promise<FirebaseIdentity | null> {
  const token = readBearerToken(request);
  if (!token) return null;
  try {
    return await requireFirebaseUser(request);
  } catch {
    return null;
  }
}

