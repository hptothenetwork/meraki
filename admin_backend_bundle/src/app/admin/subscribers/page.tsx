"use client";

import { useEffect, useState } from "react";

const ADMIN_BASE_PATH = "/admin";

function withAdminBasePath(path: string) {
  return path.startsWith(ADMIN_BASE_PATH) ? path : `${ADMIN_BASE_PATH}${path}`;
}

type Subscriber = {
  id: string;
  email: string;
  subscribedAt: string;
  status: string;
  source?: string;
};

type StockNotification = {
  id: string;
  email: string;
  productId: string;
  size?: string;
  status: string;
  requestedAt: string;
};

type Campaign = {
  id: string;
  subject: string;
  status: "queued" | "processing" | "completed" | "completed_with_errors";
  recipientCount: number;
  sentCount?: number;
  failedCount?: number;
  queuedCount?: number;
  retryCount?: number;
  createdAt: string;
  updatedAt?: string;
};

export default function SubscribersPage() {
  const fetch: typeof globalThis.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/")) {
      return globalThis.fetch(withAdminBasePath(input), init);
    }

    return globalThis.fetch(input, init);
  };

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stockNotifications, setStockNotifications] = useState<StockNotification[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"newsletter" | "stock">("newsletter");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignMessage, setCampaignMessage] = useState("");
  const [campaignSending, setCampaignSending] = useState(false);
  const [queueProcessing, setQueueProcessing] = useState(false);
  const [campaignResult, setCampaignResult] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const verifyAdminSession = async () => {
      try {
        const res = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!res.ok) {
          window.location.assign("/admin");
          return;
        }

        setAuthChecked(true);
        await loadData();
      } catch {
        window.location.assign("/admin");
      }
    };

    void verifyAdminSession();
  }, []);

  const loadData = async () => {
    try {
      // Fetch newsletter subscribers
      const subRes = await fetch("/api/admin/newsletter-subscribers");
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscribers(subData.subscribers || []);
        setCampaigns(subData.campaigns || []);
      }

      // Fetch stock notifications
      const stockRes = await fetch("/api/stock-notifications");
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        setStockNotifications(stockData.notifications || []);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = (data: Array<Record<string, unknown>>, filename: string) => {
    if (data.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => `"${String(row[h] ?? "")}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendNewsletterCampaign = async () => {
    if (!campaignSubject.trim() || !campaignMessage.trim() || campaignSending) return;

    setCampaignSending(true);
    setCampaignResult("");

    try {
      const res = await fetch("/api/admin/newsletter-subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: campaignSubject.trim(),
          text: campaignMessage.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCampaignResult(data.error || "Failed to send campaign");
        return;
      }

      const queued = typeof data.queued === "number" ? data.queued : 0;
      const recipients = typeof data.recipients === "number" ? data.recipients : 0;
      const workerTriggered = Boolean(data.workerTriggered);

      setCampaignResult(`Campaign queued: ${queued}/${recipients} recipients.${workerTriggered ? " Worker started." : ""}`);
      setCampaignSubject("");
      setCampaignMessage("");
      await loadData();
    } catch (error) {
      console.error("Failed to send campaign:", error);
      setCampaignResult("Failed to send campaign");
    } finally {
      setCampaignSending(false);
    }
  };

  const processQueue = async () => {
    if (queueProcessing) return;
    setQueueProcessing(true);
    try {
      const res = await fetch("/api/admin/newsletter-worker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 100 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCampaignResult(data.error || "Failed to process queue");
        return;
      }
      setCampaignResult(
        `Queue processed: ${data.processed || 0} handled (${data.sent || 0} sent, ${data.retried || 0} retried, ${data.failed || 0} failed).`,
      );
      await loadData();
    } catch (error) {
      console.error("Failed to process queue:", error);
      setCampaignResult("Failed to process queue");
    } finally {
      setQueueProcessing(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mubah-deep">
        <div className="text-mubah-cream">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-mubah-deep py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-4xl tracking-[0.14em] text-mubah-cream mb-2">
              Subscribers & Notifications
            </h1>
            <p className="text-sm text-mubah-cream/70">Manage newsletter subscribers and stock notifications</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-mubah-mid">
            <button
              onClick={() => setActiveTab("newsletter")}
              className={`px-6 py-3 text-sm uppercase tracking-wider transition border-b-2 ${
                activeTab === "newsletter"
                  ? "border-mubah-orange text-mubah-orange"
                  : "border-transparent text-mubah-cream/60 hover:text-mubah-cream"
              }`}
            >
              Newsletter ({subscribers.length})
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`px-6 py-3 text-sm uppercase tracking-wider transition border-b-2 ${
                activeTab === "stock"
                  ? "border-mubah-orange text-mubah-orange"
                  : "border-transparent text-mubah-cream/60 hover:text-mubah-cream"
              }`}
            >
              Stock Notifications ({stockNotifications.length})
            </button>
          </div>

          {/* Newsletter Subscribers */}
          {activeTab === "newsletter" && (
            <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-mubah-cream">Newsletter Subscribers</h2>
                <button
                  onClick={() => exportCSV(subscribers, "newsletter_subscribers")}
                  className="rounded-full bg-mubah-orange px-5 py-2.5 text-xs uppercase tracking-wider text-mubah-deep hover:bg-mubah-orange/90 transition"
                >
                  📥 Export CSV
                </button>
              </div>

              <div className="mb-6 rounded-xl border border-mubah-mid/40 bg-mubah-mid/15 p-4">
                <div className="mb-2 text-sm font-semibold text-mubah-cream">Send Campaign</div>
                <div className="grid gap-3">
                  <input
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="Subject line"
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm text-mubah-cream"
                  />
                  <textarea
                    value={campaignMessage}
                    onChange={(e) => setCampaignMessage(e.target.value)}
                    placeholder="Write your newsletter message"
                    rows={5}
                    className="w-full rounded-lg border border-mubah-mid bg-mubah-mid/30 px-3 py-2 text-sm text-mubah-cream"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={sendNewsletterCampaign}
                      disabled={campaignSending || !campaignSubject.trim() || !campaignMessage.trim()}
                      className="rounded-full bg-mubah-orange px-5 py-2.5 text-xs uppercase tracking-wider text-mubah-deep hover:bg-mubah-orange/90 transition disabled:opacity-50"
                    >
                      {campaignSending ? "Queueing..." : "Queue Campaign"}
                    </button>
                    <button
                      onClick={processQueue}
                      disabled={queueProcessing}
                      className="rounded-full border border-mubah-mid px-5 py-2.5 text-xs uppercase tracking-wider text-mubah-cream hover:border-mubah-orange transition disabled:opacity-50"
                    >
                      {queueProcessing ? "Processing..." : "Process Queue"}
                    </button>
                    {campaignResult && <span className="text-xs text-mubah-cream/70">{campaignResult}</span>}
                  </div>
                </div>
              </div>

              {subscribers.length === 0 ? (
                <div className="text-center py-12 text-mubah-cream/60">
                  No subscribers yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-mubah-mid">
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Source</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-mubah-mid/40 hover:bg-mubah-mid/10">
                          <td className="py-3 px-4 text-mubah-cream">{sub.email}</td>
                          <td className="py-3 px-4 text-mubah-cream/70">
                            {new Date(sub.subscribedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-mubah-cream/70">{sub.source || "website"}</td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-green-500/20 border border-green-500/40 px-3 py-1 text-xs text-green-400">
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-mubah-mid/40 bg-mubah-mid/15 p-4">
                <div className="mb-2 text-sm font-semibold text-mubah-cream">Recent Campaigns</div>
                {campaigns.length === 0 ? (
                  <div className="text-sm text-mubah-cream/60">No campaigns queued yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-mubah-mid">
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Subject</th>
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Status</th>
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Recipients</th>
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Sent</th>
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Queued</th>
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Failed</th>
                          <th className="text-left py-2 px-3 text-mubah-cream/80 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id} className="border-b border-mubah-mid/30">
                            <td className="py-2 px-3 text-mubah-cream">{campaign.subject}</td>
                            <td className="py-2 px-3 text-mubah-cream/70">{campaign.status}</td>
                            <td className="py-2 px-3 text-mubah-cream/70">{campaign.recipientCount || 0}</td>
                            <td className="py-2 px-3 text-green-400">{campaign.sentCount || 0}</td>
                            <td className="py-2 px-3 text-yellow-400">{campaign.queuedCount || 0}</td>
                            <td className="py-2 px-3 text-red-400">{campaign.failedCount || 0}</td>
                            <td className="py-2 px-3 text-mubah-cream/60">
                              {campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stock Notifications */}
          {activeTab === "stock" && (
            <div className="rounded-2xl border border-mubah-mid bg-mubah-mid/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-mubah-cream">Stock Notification Requests</h2>
                <button
                  onClick={() => exportCSV(stockNotifications, "stock_notifications")}
                  className="rounded-full bg-mubah-orange px-5 py-2.5 text-xs uppercase tracking-wider text-mubah-deep hover:bg-mubah-orange/90 transition"
                >
                  📥 Export CSV
                </button>
              </div>

              {stockNotifications.length === 0 ? (
                <div className="text-center py-12 text-mubah-cream/60">
                  No pending notifications
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-mubah-mid">
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Product ID</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Size</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Requested</th>
                        <th className="text-left py-3 px-4 text-mubah-cream/80 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockNotifications.map((notif) => (
                        <tr key={notif.id} className="border-b border-mubah-mid/40 hover:bg-mubah-mid/10">
                          <td className="py-3 px-4 text-mubah-cream">{notif.email}</td>
                          <td className="py-3 px-4 text-mubah-cream/70 font-mono text-xs">{notif.productId}</td>
                          <td className="py-3 px-4 text-mubah-cream/70">{notif.size || "Any"}</td>
                          <td className="py-3 px-4 text-mubah-cream/70">
                            {new Date(notif.requestedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="rounded-full bg-yellow-500/20 border border-yellow-500/40 px-3 py-1 text-xs text-yellow-400">
                              {notif.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
  );
}
