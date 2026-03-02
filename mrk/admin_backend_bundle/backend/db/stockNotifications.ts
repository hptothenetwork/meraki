import { db } from "@backend/firebase.server";

type SendStockNotificationsResult = {
  sent: number;
  total: number;
};

async function sendNotificationEmail({
  email,
  productName,
  productId,
  size,
}: {
  email: string;
  productName: string;
  productId: string;
  size?: string | null;
}) {
  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      template_id: process.env.NEXT_PUBLIC_EMAILJS_STOCK_NOTIFICATION_TEMPLATE,
      user_id: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        product_name: productName,
        product_size: size || "N/A",
        product_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/products/${productId}`,
      },
    }),
  });

  return response.ok;
}

export async function sendPendingStockNotifications(
  productId: string,
  size?: string,
): Promise<SendStockNotificationsResult> {
  let query = db
    .collection("stock_notifications")
    .where("productId", "==", productId)
    .where("status", "==", "pending");

  if (size) {
    query = query.where("size", "==", size);
  }

  const notifications = await query.get();

  if (notifications.empty) {
    return { sent: 0, total: 0 };
  }

  const productDoc = await db.collection("products").doc(productId).get();
  if (!productDoc.exists) {
    throw new Error("Product not found");
  }

  const product = productDoc.data() as { name?: string } | undefined;
  const productName = product?.name || "Product";

  const results = await Promise.allSettled(
    notifications.docs.map(async (doc) => {
      const data = doc.data() as { email?: string; size?: string | null };
      if (!data.email) return false;

      try {
        const sent = await sendNotificationEmail({
          email: data.email,
          productName,
          productId,
          size: data.size,
        });

        if (!sent) return false;

        await db.collection("stock_notifications").doc(doc.id).update({
          status: "sent",
          notifiedAt: new Date().toISOString(),
        });

        return true;
      } catch (error) {
        console.error(`Failed to send stock notification to ${data.email}:`, error);
        return false;
      }
    }),
  );

  const sent = results.filter(
    (item): item is PromiseFulfilledResult<boolean> => item.status === "fulfilled" && item.value,
  ).length;

  return { sent, total: notifications.size };
}
