import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Bucket ids created in migration 0010_phase13_storage_buckets.sql.
 * destination-images / gallery-images are public-read editorial buckets;
 * itinerary-pdfs / user-uploads are private and owner-scoped by path prefix.
 */
export const STORAGE_BUCKETS = {
  destinationImages: "destination-images",
  galleryImages: "gallery-images",
  itineraryPdfs: "itinerary-pdfs",
  userUploads: "user-uploads",
} as const;

type PublicBucket = typeof STORAGE_BUCKETS.destinationImages | typeof STORAGE_BUCKETS.galleryImages;
type OwnerScopedBucket = typeof STORAGE_BUCKETS.itineraryPdfs | typeof STORAGE_BUCKETS.userUploads;

/** Builds the `${userId}/...` path the owner-scoped storage.objects RLS policies require. */
export function ownerObjectPath(userId: string, fileName: string): string {
  return `${userId}/${fileName}`;
}

/** Public URL for an object in one of the editorial (public-read) buckets. */
export function getPublicAssetUrl(supabase: SupabaseClient, bucket: PublicBucket, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Time-limited signed URL for an object in one of the private, owner-scoped buckets. */
export async function getOwnerAssetSignedUrl(
  supabase: SupabaseClient,
  bucket: OwnerScopedBucket,
  userId: string,
  fileName: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(ownerObjectPath(userId, fileName), expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Uploads a file into one of the private, owner-scoped buckets under the caller's own path prefix. */
export async function uploadOwnerAsset(
  supabase: SupabaseClient,
  bucket: OwnerScopedBucket,
  userId: string,
  fileName: string,
  file: Blob | File | ArrayBuffer,
  options?: { contentType?: string; upsert?: boolean }
): Promise<{ path: string } | { error: string }> {
  const path = ownerObjectPath(userId, fileName);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });
  if (error) return { error: error.message };
  return { path };
}
