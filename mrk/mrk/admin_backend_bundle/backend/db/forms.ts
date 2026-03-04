import "server-only";
import { db } from "../firebase.server";

export type FormSubmission = {
  id: string;
  type: string;
  channel?: "whatsapp" | "email" | "form";
  data: Record<string, unknown>;
  summary: string;
  createdAt: string;
  status?: string;
  note?: string;
};

const collectionName = "formSubmissions";

export async function saveFormSubmission(
  input: Omit<FormSubmission, "id" | "createdAt"> & { id?: string; createdAt?: string },
): Promise<FormSubmission> {
  const docRef = input.id
    ? db.collection(collectionName).doc(input.id)
    : db.collection(collectionName).doc();

  const payload: FormSubmission = {
    ...input,
    id: docRef.id,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  await docRef.set(payload, { merge: true });
  return payload;
}

export async function listFormSubmissions(limit = 100): Promise<FormSubmission[]> {
  const snap = await db.collection(collectionName).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((doc) => doc.data() as FormSubmission);
}

export async function updateFormSubmissionStatus(id: string, status: string, note?: string) {
  const ref = db.collection(collectionName).doc(id);
  await ref.set(
    {
      status,
      note,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function deleteFormSubmission(id: string) {
  await db.collection(collectionName).doc(id).delete();
}
