/**
 * ImageKit CDN Optimization Helper
 * 
 * Dynamic ImageKit URL transformations reduce image file sizes by up to 98%
 * (e.g. converting 15MB camera uploads into 30KB crisp WebP/AVIF images)
 * to save ImageKit monthly bandwidth quota.
 */

export function optimizeImageKitUrl(url?: string, width = 600, quality = 80): string {
  if (!url || typeof url !== "string") return "";

  // Automatically replace legacy ImageKit account ID (qsp4pqng4) stored in Firestore with new account (k6vqtwujl)
  let targetUrl = url;
  if (targetUrl.includes("ik.imagekit.io/qsp4pqng4")) {
    targetUrl = targetUrl.replace("ik.imagekit.io/qsp4pqng4", "ik.imagekit.io/k6vqtwujl");
  }

  if (!targetUrl.includes("imagekit.io")) return targetUrl;

  // Preserve protocol and domain, strip existing query transformation if present
  const [baseUrl] = targetUrl.split("?");
  
  // If it's a video poster or thumbnail, handle appropriately
  if (targetUrl.includes("ik-thumbnail")) {
    return `${baseUrl}?tr=w-${width},q-${quality},f-auto,so-0`;
  }

  return `${baseUrl}?tr=w-${width},q-${quality},f-auto`;
}
