import "server-only";
import { db } from "../firebase.server";

const collectionName = "product_viewers";

function sessionsCollection(productId: string) {
  return db.collection(collectionName).doc(productId).collection("sessions");
}

export async function touchViewer(productId: string, sessionId: string) {
  const nowIso = new Date().toISOString();
  await sessionsCollection(productId).doc(sessionId).set(
    {
      sessionId,
      lastSeen: nowIso,
      updatedAt: nowIso,
    },
    { merge: true },
  );
}

export async function removeViewer(productId: string, sessionId: string) {
  await sessionsCollection(productId).doc(sessionId).delete();
}

export async function countActiveViewers(productId: string, activeWindowMs = 2 * 60 * 1000) {
  const cutoff = new Date(Date.now() - activeWindowMs).toISOString();
  const sessionsRef = sessionsCollection(productId);

  const activeSnapshot = await sessionsRef.where("lastSeen", ">=", cutoff).get();

  const staleSnapshot = await sessionsRef.where("lastSeen", "<", cutoff).limit(100).get();
  if (!staleSnapshot.empty) {
    const batch = db.batch();
    staleSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  return activeSnapshot.size;
}
