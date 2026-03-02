import "server-only";

type RevalidateOptions = {
  reason: string;
  paths?: string[];
  tags?: string[];
};

export async function triggerStorefrontRevalidate(options: RevalidateOptions) {
  const url = process.env.STOREFRONT_REVALIDATE_URL;
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET;

  if (!url || !secret) {
    console.warn("[revalidate] Missing STOREFRONT_REVALIDATE_URL or STOREFRONT_REVALIDATE_SECRET; skipping.");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({
        paths: options.paths && options.paths.length > 0 ? options.paths : ["/"],
        tags: options.tags || [],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.warn(`[revalidate] failed (${options.reason})`, response.status, message);
      return;
    }

    console.log(`[revalidate] storefront updated (${options.reason})`);
  } catch (error) {
    console.warn(`[revalidate] request error (${options.reason})`, error);
  }
}
