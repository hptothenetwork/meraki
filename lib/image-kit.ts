/**
 * ImageKit CDN Optimization Helper
 * 
 * Dynamic ImageKit URL transformations reduce image file sizes by up to 98%
 * (e.g. converting 15MB camera uploads into 30KB crisp WebP/AVIF images)
 * to save ImageKit monthly bandwidth quota.
 */

export function optimizeImageKitUrl(url?: string, width = 600, quality = 80): string {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("imagekit.io")) return url;

  // Preserve protocol and domain, strip existing query transformation if present
  const [baseUrl] = url.split("?");
  
  // If it's a video poster or thumbnail, handle appropriately
  if (url.includes("ik-thumbnail")) {
    return `${baseUrl}?tr=w-${width},q-${quality},f-auto,so-0`;
  }

  return `${baseUrl}?tr=w-${width},q-${quality},f-auto`;
}
