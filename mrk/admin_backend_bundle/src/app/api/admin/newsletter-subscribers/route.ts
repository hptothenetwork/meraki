import { NextRequest, NextResponse } from "next/server";
import { db } from "@backend/firebase.server";
import { requireAdmin } from "@backend/admin/auth";
import { assertSameOrigin } from "@backend/admin/csrf";
import { createInternalApiHeaders } from "@backend/internalApiAuth";

type NewsletterSubscriber = {
  id: string;
  email: string;
  status?: string;
  subscribedAt?: string;
};

type NewsletterCampaign = {
  id: string;
  subject: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  queuedCount: number;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  lastProcessedAt?: string;
  lastError?: string | null;
};

type SendCampaignPayload = {
  subject?: string;
  text?: string;
  html?: string;
  subscriberIds?: string[];
};

function toSimpleHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/[<>]/g, "")}</p>`)
    .join("");
}

function toIsoAfterMs(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function chunk<T>(input: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < input.length; i += size) {
    result.push(input.slice(i, i + size));
  }
  return result;
}

async function enqueueCampaign(
  subject: string,
  html: string,
  text: string,
  recipients: NewsletterSubscriber[],
) {
  const now = new Date().toISOString();
  const campaignRef = db.collection("newsletter_campaigns").doc();

  const campaign: NewsletterCampaign = {
    id: campaignRef.id,
    subject,
    status: "queued",
    recipientCount: recipients.length,
    sentCount: 0,
    failedCount: 0,
    queuedCount: recipients.length,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    lastError: null,
  };
  await campaignRef.set(campaign);

  for (const recipientChunk of chunk(recipients, 300)) {
    const batch = db.batch();
    for (const recipient of recipientChunk) {
      const queueRef = db.collection("email_queue").doc();
      batch.set(queueRef, {
        id: queueRef.id,
        type: "newsletter",
        campaignId: campaignRef.id,
        to: recipient.email,
        subject,
        html: html || null,
        text: text || null,
        status: "queued",
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: toIsoAfterMs(0),
        createdAt: now,
        updatedAt: now,
        lastError: null,
      });
    }
    await batch.commit();
  }

  return campaignRef.id;
}

/**
 * GET /api/admin/newsletter-subscribers
 * Return active subscribers and recent campaign history.
 */
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [subscribersSnapshot, campaignsSnapshot] = await Promise.all([
      db.collection("newsletter_subscribers").orderBy("subscribedAt", "desc").get(),
      db.collection("newsletter_campaigns").orderBy("createdAt", "desc").limit(30).get(),
    ]);

    const subscribers = subscribersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    const campaigns = campaignsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ subscribers, campaigns });
  } catch (error) {
    console.error("Error fetching newsletter subscribers/campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch newsletter data" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/newsletter-subscribers
 * Queue newsletter campaign for background processing.
 */
export async function POST(req: NextRequest) {
  try {
    requireAdmin(req);
    assertSameOrigin(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as SendCampaignPayload;
    const subject = body.subject?.trim();
    const text = body.text?.trim() || "";
    const html = body.html?.trim() || (text ? toSimpleHtml(text) : "");
    const subscriberIds = Array.isArray(body.subscriberIds) ? body.subscriberIds.filter(Boolean) : [];

    if (!subject || (!text && !html)) {
      return NextResponse.json({ error: "subject and message are required" }, { status: 400 });
    }

    const subscribersSnapshot = await db
      .collection("newsletter_subscribers")
      .where("status", "==", "active")
      .get();
    const allSubscribers = subscribersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as NewsletterSubscriber[];

    const recipients =
      subscriberIds.length > 0
        ? allSubscribers.filter((sub) => subscriberIds.includes(sub.id))
        : allSubscribers;
    const validRecipients = recipients.filter(
      (sub) => typeof sub.email === "string" && sub.email.includes("@"),
    );

    if (validRecipients.length === 0) {
      return NextResponse.json({ error: "No active subscribers found" }, { status: 400 });
    }

    const campaignId = await enqueueCampaign(subject, html, text, validRecipients);

    const internalHeaders = createInternalApiHeaders();
    const canTriggerWorker = Object.keys(internalHeaders).length > 0;
    if (canTriggerWorker) {
      void fetch(`${req.nextUrl.origin}/api/admin/newsletter-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...internalHeaders },
        body: JSON.stringify({ campaignId, limit: 50 }),
      }).catch((error) => {
        console.error("[newsletter] Failed to trigger worker:", error);
      });
    }

    return NextResponse.json({
      success: true,
      campaignId,
      recipients: validRecipients.length,
      queued: validRecipients.length,
      status: "queued",
      workerTriggered: canTriggerWorker,
    });
  } catch (error) {
    console.error("Error queueing newsletter campaign:", error);
    return NextResponse.json({ error: "Failed to queue newsletter campaign" }, { status: 500 });
  }
}
