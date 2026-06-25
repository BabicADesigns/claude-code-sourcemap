import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/config";
import type { PdfDocument, PdfDocumentType } from "@/lib/types";
import { STORAGE_BUCKETS, uploadOwnerAsset } from "@/lib/supabase/storage";
import { logError } from "@/lib/monitoring/logger";

/**
 * pdf_documents is a history log (every render gets its own row, see migration
 * 0011_phase14_pdf_delivery.sql), so each generation also gets its own Storage object —
 * the pdf_documents id is generated up front and threaded into the file name so the two
 * stay in lockstep without a second round-trip.
 */
function pdfFileName(documentType: PdfDocumentType, sourceId: string, pdfDocumentId: string, locale: Locale): string {
  return `${documentType}-${sourceId}-${pdfDocumentId}-${locale}.pdf`;
}

/**
 * Most recent, non-expired pdf_documents row for this source — lets "Download" reuse a
 * previously rendered PDF instead of re-rendering. Returns null if nothing reusable exists,
 * which the caller treats as "regenerate" (requirement #7's "expired files" handling).
 */
export async function findReusablePdfDocument(
  supabase: SupabaseClient,
  userId: string,
  documentType: PdfDocumentType,
  sourceId: string,
  locale: Locale
): Promise<PdfDocument | null> {
  const { data, error } = await supabase
    .from("pdf_documents")
    .select("*")
    .eq("user_id", userId)
    .eq("document_type", documentType)
    .eq("source_id", sourceId)
    .eq("locale", locale)
    .not("storage_path", "is", null)
    .gt("expires_at", new Date().toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as PdfDocument;
}

/**
 * Uploads a freshly rendered PDF buffer to the itinerary-pdfs bucket and records it as a new
 * pdf_documents row. Always inserts rather than updates — "Regenerate" creating a new history
 * row, never mutating an old one, is the whole point of the delivery-history requirement.
 */
export async function storeGeneratedPdf(
  supabase: SupabaseClient,
  userId: string,
  documentType: PdfDocumentType,
  sourceId: string,
  locale: Locale,
  buffer: Buffer
): Promise<PdfDocument | { error: string }> {
  const id = randomUUID();
  const fileName = pdfFileName(documentType, sourceId, id, locale);

  const uploadResult = await uploadOwnerAsset(supabase, STORAGE_BUCKETS.itineraryPdfs, userId, fileName, buffer, {
    contentType: "application/pdf",
  });
  if ("error" in uploadResult) {
    logError("pdf.storage.storeGeneratedPdf", new Error(uploadResult.error), { userId, documentType, sourceId });
    return { error: uploadResult.error };
  }

  const { data, error } = await supabase
    .from("pdf_documents")
    .insert({
      id,
      user_id: userId,
      document_type: documentType,
      source_id: sourceId,
      locale,
      storage_path: uploadResult.path,
      file_size_bytes: buffer.byteLength,
    })
    .select("*")
    .single();
  if (error || !data) {
    logError("pdf.storage.storeGeneratedPdf", error, { userId, documentType, sourceId });
    return { error: "Couldn't record the generated PDF." };
  }
  return data as PdfDocument;
}

/** Time-limited signed URL for an already-stored pdf_documents row. Null if the row has no object yet. */
export async function getPdfDownloadUrl(
  supabase: SupabaseClient,
  document: PdfDocument,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!document.storage_path) return null;
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.itineraryPdfs)
    .createSignedUrl(document.storage_path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Downloads a previously stored PDF's bytes — used to attach a reused (not freshly rendered) PDF to an email. */
export async function downloadStoredPdf(supabase: SupabaseClient, document: PdfDocument): Promise<Buffer | null> {
  if (!document.storage_path) return null;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKETS.itineraryPdfs).download(document.storage_path);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}
