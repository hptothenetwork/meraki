import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";
import { requireInternalApi } from "@backend/internalApiAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID =
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_GENERIC_ID ||
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

type QueueItem = {
  id: string;
  campaignId: string;
  type?: string;
  to: string;
  subject: string;
  html?: string | null;
  text?: string | null;
  status: "queued" | "sent" | "failed";
  attempts?: number;
  maxAttempts?: number;
  nextAttemptAt?: string;
};

function authorizeWorker(req: NextRequest) {
  try {
    requireInternalApi(req);
    return;
  } catch {
    // fallback to admin auth for manual dashboard trigger
  }

  requireAdmin(req);
  assertSameOrigin(req);
}

function toIsoAfterSeconds(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function retryDelaySeconds(attempt: number) {
  return Math.min(3600, 60 * Math.pow(2, Math.max(0, attempt - 1)));
}

async function sendViaEmailJs(to: string, subject: string, html: string, text: string) {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error("Email provider is not configured");
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: to,
        subject,
        message_html: html,
        message_text: text,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider error ${response.status}`);
  }
}

async function loadQueueBatch(limit: number) {
  const now = new Date().toISOString();
  try {
    const snapshot = await db
      .collection("email_queue")
      .where("type", "==", "newsletter")
      .where("status", "==", "queued")
      .where("nextAttemptAt", "<=", now)
      .orderBy("nextAttemptAt", "asc")
      .limit(limit)
      .get();
    return snapshot.docs;
  } catch (error) {
    // Allow queue processing while index deploy is pending.
    console.warn("[newsletter-worker] Falling back to non-indexed queue query:", error);
    const fallback = await db
      .collection("email_queue")
      .where("type", "==", "newsletter")
      .where("status", "==", "queued")
      .limit(limit * 3)
      .get();

    return fallback.docs
      .filter((doc) => {
        const data = doc.data() as QueueItem;
        return !data.nextAttemptAt || data.nextAttemptAt <= now;
      })
      .sort((a, b) => {
        const left = (a.data() as QueueItem).nextAttemptAt || "";
        const right = (b.data() as QueueItem).nextAttemptAt || "";
        return left.localeCompare(right);
      })
      .slice(0, limit);
  }
}

async function refreshCampaignStats(campaignId: string) {
  const queueSnapshot = await db.collection("email_queue").where("campaignId", "==", campaignId).get();
  const queueItems = queueSnapshot.docs.map((doc) => doc.data() as QueueItem & { attempts?: number });

  const sentCount = queueItems.filter((item) => item.status === "sent").length;
  const failedCount = queueItems.filter((item) => item.status === "failed").length;
  const queuedCount = queueItems.filter((item) => item.status === "queued").length;
  const retryCount = queueItems.reduce((sum, item) => sum + Math.max(0, Number(item.attempts || 0) - 1), 0);
  const nextStatus =
    queuedCount > 0 ? "processing" : failedCount > 0 ? "completed_with_errors" : "completed";

  await db.collection("newsletter_campaigns").doc(campaignId).set(
    {
      status: nextStatus,
      sentCount,
      failedCount,
      queuedCount,
      retryCount,
      lastProcessedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function POST(req: NextRequest) {
  try {
    authorizeWorker(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { campaignId?: string; limit?: number };
    const campaignId = body.campaignId?.trim() || "";
    const limit = Math.min(100, Math.max(1, Number(body.limit || 25)));

    const queueDocs = await loadQueueBatch(limit);
    const targetDocs = campaignId
      ? queueDocs.filter((doc) => (doc.data() as QueueItem).campaignId === campaignId)
      : queueDocs;

    let processed = 0;
    let sent = 0;
    let retried = 0;
    let failed = 0;
    const touchedCampaigns = new Set<string>();

    for (const doc of targetDocs) {
      const data = doc.data() as QueueItem;
      const attempts = Number(data.attempts || 0);
      const maxAttempts = Math.max(1, Number(data.maxAttempts || 5));
      const now = new Date().toISOString();
      touchedCampaigns.add(data.campaignId);

      try {
        await sendViaEmailJs(
          data.to,
          data.subject,
          typeof data.html === "string" ? data.html : "",
          typeof data.text === "string" ? data.text : "",
        );

        await doc.ref.set(
          {
            status: "sent",
            attempts: attempts + 1,
            sentAt: now,
            updatedAt: now,
            lastError: null,
          },
          { merge: true },
        );
        sent += 1;
      } catch (error) {
        const nextAttempt = attempts + 1;
        const message = error instanceof Error ? error.message : "Email send failed";

        if (nextAttempt >= maxAttempts) {
          await doc.ref.set(
            {
              status: "failed",
              attempts: nextAttempt,
              failedAt: now,
              updatedAt: now,
              lastError: message,
            },
            { merge: true },
          );
          failed += 1;
        } else {
          await doc.ref.set(
            {
              status: "queued",
              attempts: nextAttempt,
              nextAttemptAt: toIsoAfterSeconds(retryDelaySeconds(nextAttempt)),
              updatedAt: now,
              lastError: message,
            },
            { merge: true },
          );
          retried += 1;
        }
      }
      processed += 1;
    }

    for (const id of touchedCampaigns) {
      await refreshCampaignStats(id);
    }

    return NextResponse.json({
      success: true,
      processed,
      sent,
      retried,
      failed,
      campaignsUpdated: touchedCampaigns.size,
    });
  } catch (error) {
    console.error("[newsletter-worker] Processing failed:", error);
    return NextResponse.json({ error: "Failed to process newsletter queue" }, { status: 500 });
  }
}
