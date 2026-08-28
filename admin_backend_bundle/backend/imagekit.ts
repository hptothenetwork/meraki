import "server-only";

type UploadImageKitParams = {
  data: Buffer | Uint8Array;
  fileName: string;
  contentType?: string;
  folder?: string;
};

type UploadImageKitResult = {
  key: string;
  url: string;
};

const DEFAULT_IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/k6vqtwujl";
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = (process.env.IMAGEKIT_URL_ENDPOINT || DEFAULT_IMAGEKIT_ENDPOINT).replace(/\/$/, "");

function getAuthHeader() {
  if (!privateKey) {
    throw new Error("Missing IMAGEKIT_PRIVATE_KEY");
  }
  return `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
}

export function isImageKitConfigured() {
  return Boolean(privateKey && urlEndpoint);
}

export async function uploadToImageKit({
  data,
  fileName,
  contentType,
  folder = "/products",
}: UploadImageKitParams): Promise<UploadImageKitResult> {
  if (!isImageKitConfigured()) {
    throw new Error("ImageKit is not configured");
  }

  const form = new FormData();
  const bytes = Uint8Array.from(data);
  const fileBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const blob = new Blob([fileBuffer], { type: contentType || "application/octet-stream" });
  form.append("file", blob, fileName || `upload-${Date.now()}`);
  form.append("fileName", fileName || `upload-${Date.now()}`);
  form.append("useUniqueFileName", "true");
  form.append("folder", folder);

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
    },
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`ImageKit upload failed: ${res.status} ${msg}`);
  }

  const json = (await res.json()) as { fileId?: string; url?: string; filePath?: string };
  if (!json.fileId || !json.url) {
    throw new Error("ImageKit upload response missing fileId/url");
  }

  // Strictly enforce the target endpoint (https://ik.imagekit.io/k6vqtwujl)
  let finalUrl = json.url;
  if (json.filePath) {
    finalUrl = `${urlEndpoint}${json.filePath.startsWith("/") ? "" : "/"}${json.filePath}`;
  } else {
    finalUrl = json.url.replace(/^https?:\/\/[^\/]+\/[^\/]+/, urlEndpoint);
  }
  // Hard-replace legacy qsp4pqng4 account ID wherever present
  finalUrl = finalUrl.replace("ik.imagekit.io/qsp4pqng4", "ik.imagekit.io/k6vqtwujl");

  return {
    key: json.fileId,
    url: finalUrl,
  };
}

export async function deleteFromImageKit(fileId: string): Promise<void> {
  if (!isImageKitConfigured()) {
    throw new Error("ImageKit is not configured");
  }
  if (!fileId) {
    throw new Error("Missing fileId");
  }

  const res = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!res.ok && res.status !== 404) {
    const msg = await res.text().catch(() => "");
    throw new Error(`ImageKit delete failed: ${res.status} ${msg}`);
  }
}
