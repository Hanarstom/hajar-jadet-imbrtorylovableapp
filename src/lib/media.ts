import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const MEDIA_BUCKET = "media";

/** Center-crops an image file to a square and downscales it. Returns a JPEG blob. */
export async function cropToSquare(file: File, size = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", 0.9),
  );
}

/** Uploads a blob into the user's own folder and returns the storage path. */
export async function uploadMedia(userId: string, folder: string, blob: Blob, ext = "jpg") {
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  if (error) throw error;
  return path;
}

export async function resolveMediaUrl(value: string) {
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(value, 60 * 60 * 24 * 7);
  if (error) throw error;
  return data.signedUrl;
}

/** Resolves stored avatar/story values (external URL or private storage path) to a usable src. */
export function useMediaUrl(value: string | null | undefined) {
  const q = useQuery({
    queryKey: ["media-url", value],
    enabled: !!value,
    staleTime: 60 * 60 * 1000,
    queryFn: () => resolveMediaUrl(value!),
  });
  return q.data ?? null;
}
