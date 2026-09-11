import { supabase } from "@/integrations/supabase/client";

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export type UploadEvidenceOptions = {
  plateNumber?: string;
  category?: string;
  folder?: string;
};

/**
 * Uploads an evidence frame (File, Blob, or DataURL) directly to the Supabase Storage 'evidence' bucket.
 * Returns the permanent public CDN URL.
 */
export async function uploadEvidenceToSupabase(
  evidence: File | Blob | string,
  options: UploadEvidenceOptions = {},
): Promise<string> {
  // If it is already a hosted URL (http/https) or relative asset, return directly
  if (typeof evidence === "string" && !evidence.startsWith("data:")) {
    return evidence;
  }

  try {
    let blob: Blob;
    let mimeType = "image/jpeg";

    if (typeof evidence === "string" && evidence.startsWith("data:")) {
      blob = dataUrlToBlob(evidence);
      mimeType = blob.type || "image/jpeg";
    } else if (evidence instanceof File) {
      blob = evidence;
      mimeType = evidence.type || "image/jpeg";
    } else if (evidence instanceof Blob) {
      blob = evidence;
      mimeType = evidence.type || "image/jpeg";
    } else {
      return "/assets/violation-1.jpg";
    }

    const cleanPlate = (options.plateNumber || "EVIDENCE").replace(/[\s-]/g, "").toUpperCase();
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 7);
    const folder = options.folder || "traffic";
    const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
    const filePath = `${folder}/${cleanPlate}_${timestamp}_${rand}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("evidence")
      .upload(filePath, blob, {
        contentType: mimeType,
        cacheControl: "31536000",
        upsert: true,
      });

    if (uploadError) {
      console.warn("[Supabase Storage] Upload error to 'evidence' bucket:", uploadError.message);
      // If bucket is not created or RLS rejected, return the dataURL/original
      if (typeof evidence === "string") return evidence;
      return "/assets/violation-1.jpg";
    }

    if (uploadData?.path) {
      const { data: publicUrlData } = supabase.storage.from("evidence").getPublicUrl(uploadData.path);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.error("[Supabase Storage] Unexpected error in uploadEvidenceToSupabase:", err);
  }

  if (typeof evidence === "string") return evidence;
  return "/assets/violation-1.jpg";
}

/**
 * Concurrently uploads multiple evidence frames to Supabase Storage.
 * Returns array of public CDN URLs.
 */
export async function uploadMultipleEvidenceToSupabase(
  evidenceList: (File | Blob | string)[],
  options: UploadEvidenceOptions = {},
): Promise<string[]> {
  if (!evidenceList || evidenceList.length === 0) {
    return [];
  }
  return Promise.all(
    evidenceList.map((item) => uploadEvidenceToSupabase(item, options))
  );
}

/**
 * Serializes an array of evidence URLs into a string for storage in citations.evidence_url.
 * If 1 URL is provided, returns that URL directly.
 * If multiple URLs are provided, serializes as a JSON array string.
 */
export function serializeEvidenceUrls(urls: string[]): string {
  const valid = urls.filter((u) => u && typeof u === "string" && u.trim().length > 0);
  if (valid.length === 0) return "/assets/violation-1.jpg";
  if (valid.length === 1) return valid[0];
  return JSON.stringify(valid);
}

/**
 * Parses citations.evidence_url into an array of URLs.
 * Gracefully handles:
 * - JSON array string: '["https://...", "https://..."]'
 * - Comma or pipe-separated URLs
 * - Plain single URL string
 * - Null/undefined/empty: returns fallback default
 */
export function parseEvidenceUrls(raw: string | null | undefined): string[] {
  if (!raw) return ["/assets/violation-1.jpg"];
  const trimmed = raw.trim();
  if (!trimmed) return ["/assets/violation-1.jpg"];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
        if (filtered.length > 0) return filtered;
      }
    } catch {
      // ignore json parse error, fall through
    }
  }

  if (trimmed.includes(" || ")) {
    return trimmed.split(" || ").map((s) => s.trim()).filter(Boolean);
  }

  return [trimmed];
}

/**
 * Returns the primary (first) evidence URL from a raw evidence_url string.
 */
export function getPrimaryEvidenceUrl(raw: string | null | undefined): string {
  const list = parseEvidenceUrls(raw);
  return list[0] || "/assets/violation-1.jpg";
}

