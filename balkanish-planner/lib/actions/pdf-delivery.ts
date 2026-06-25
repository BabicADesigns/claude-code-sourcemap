"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getSavedItineraryById } from "@/lib/data/itineraries";
import { generateItineraryPdfBuffer, plannerInputFromSavedItinerary } from "@/lib/pdf/generate-itinerary-pdf";
import { downloadStoredPdf, findReusablePdfDocument, getPdfDownloadUrl, storeGeneratedPdf } from "@/lib/pdf/storage";
import { isEmailConfigured, sendEmail } from "@/lib/email/send";
import { buildItineraryEmail, buildResendItineraryEmail } from "@/lib/email/templates";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import type { DeliveryChannel, DeliveryStatus, PdfDocument, SavedItinerary } from "@/lib/types";
import { logError } from "@/lib/monitoring/logger";

async function logDelivery(
  supabase: SupabaseClient,
  userId: string,
  pdfDocumentId: string,
  channel: DeliveryChannel,
  status: DeliveryStatus,
  recipientEmail: string | null,
  errorMessage: string | null
): Promise<void> {
  const { error } = await supabase.from("pdf_deliveries").insert({
    pdf_document_id: pdfDocumentId,
    user_id: userId,
    channel,
    status,
    recipient_email: recipientEmail,
    error_message: errorMessage,
  });
  if (error) logError("actions.pdf-delivery.logDelivery", error, { userId, pdfDocumentId, channel, status });
}

/**
 * Reuses a non-expired stored PDF for this itinerary+locale (requirement #7's "expired files"
 * fallback), or renders and stores a fresh one. `buffer` is only populated on the fresh-render
 * path — a reused document's bytes have to be fetched separately if a caller needs them (email).
 */
async function getOrRenderItineraryPdf(
  supabase: SupabaseClient,
  userId: string,
  saved: SavedItinerary,
  locale: Locale,
  forceRegenerate: boolean
): Promise<{ document: PdfDocument; buffer: Buffer | null } | { error: string }> {
  if (!forceRegenerate) {
    const existing = await findReusablePdfDocument(supabase, userId, "itinerary", saved.id, locale);
    if (existing) return { document: existing, buffer: null };
  }

  const input = plannerInputFromSavedItinerary(saved);
  const buffer = await generateItineraryPdfBuffer(saved.itinerary_json, input, locale);
  const stored = await storeGeneratedPdf(supabase, userId, "itinerary", saved.id, locale, buffer);
  if ("error" in stored) return { error: "We couldn't generate that PDF. Please try again." };
  return { document: stored, buffer };
}

export async function downloadItineraryPdf(
  itineraryId: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const saved = await getSavedItineraryById(user.id, itineraryId);
  if (!saved) return { error: "Couldn't find that trip." };

  const supabase = await createSupabaseServerClient();
  const result = await getOrRenderItineraryPdf(supabase, user.id, saved, locale, false);
  if ("error" in result) return { error: result.error };

  const url = await getPdfDownloadUrl(supabase, result.document);
  if (!url) {
    await logDelivery(supabase, user.id, result.document.id, "download", "failed", null, "Couldn't create a download link.");
    return { error: "That PDF has expired. Please try again to regenerate it." };
  }

  await logDelivery(supabase, user.id, result.document.id, "download", "sent", null, null);
  revalidatePath("/my-trips");
  return { url };
}

/** Always re-renders and re-uploads, even if a reusable PDF exists — a fresh history row by design. */
export async function regenerateItineraryPdf(
  itineraryId: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<{ url?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };

  const saved = await getSavedItineraryById(user.id, itineraryId);
  if (!saved) return { error: "Couldn't find that trip." };

  const supabase = await createSupabaseServerClient();
  const result = await getOrRenderItineraryPdf(supabase, user.id, saved, locale, true);
  if ("error" in result) return { error: result.error };

  const url = await getPdfDownloadUrl(supabase, result.document);
  if (!url) {
    await logDelivery(supabase, user.id, result.document.id, "download", "failed", null, "Couldn't create a download link.");
    return { error: "Generated the PDF but couldn't create a download link. Please try again." };
  }

  await logDelivery(supabase, user.id, result.document.id, "download", "sent", null, null);
  revalidatePath("/my-trips");
  return { url };
}

export async function emailItineraryPdf(
  itineraryId: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (!user.email) return { error: "Your account doesn't have an email address on file." };
  if (!isEmailConfigured()) return { error: "Email delivery isn't set up yet — try Download instead." };

  const saved = await getSavedItineraryById(user.id, itineraryId);
  if (!saved) return { error: "Couldn't find that trip." };

  const supabase = await createSupabaseServerClient();
  const result = await getOrRenderItineraryPdf(supabase, user.id, saved, locale, false);
  if ("error" in result) return { error: result.error };

  const buffer = result.buffer ?? (await downloadStoredPdf(supabase, result.document));
  if (!buffer) {
    await logDelivery(supabase, user.id, result.document.id, "email", "failed", user.email, "Couldn't read the stored PDF.");
    return { error: "Couldn't read that PDF. Please try Download instead." };
  }

  const title = saved.title ?? saved.itinerary_json.trip_title;
  const content = buildItineraryEmail(title, saved.duration_days, locale);
  const sendResult = await sendEmail({
    to: user.email,
    subject: content.subject,
    html: content.html,
    attachment: { filename: `${title}.pdf`, content: buffer },
  });

  await logDelivery(
    supabase,
    user.id,
    result.document.id,
    "email",
    sendResult.sent ? "sent" : "failed",
    user.email,
    sendResult.sent ? null : sendResult.error
  );
  if (!sendResult.sent) return { error: "Couldn't send that email. Please try again." };

  revalidatePath("/my-trips");
  return {};
}

/** Re-sends a specific past PdfDocument as-is — a new delivery row, never mutating the original. */
export async function resendItineraryPdf(pdfDocumentId: string): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (!user.email) return { error: "Your account doesn't have an email address on file." };
  if (!isEmailConfigured()) return { error: "Email delivery isn't set up yet — try Download instead." };

  const supabase = await createSupabaseServerClient();
  const { data, error: documentError } = await supabase
    .from("pdf_documents")
    .select("*")
    .eq("id", pdfDocumentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (documentError || !data) return { error: "Couldn't find that PDF." };
  const document = data as PdfDocument;

  const saved = await getSavedItineraryById(user.id, document.source_id);
  if (!saved) return { error: "Couldn't find the trip that PDF belongs to." };

  let activeDocument = document;
  let buffer = await downloadStoredPdf(supabase, document);
  if (!buffer) {
    const regenerated = await getOrRenderItineraryPdf(supabase, user.id, saved, document.locale, true);
    if ("error" in regenerated) return { error: regenerated.error };
    activeDocument = regenerated.document;
    buffer = regenerated.buffer ?? (await downloadStoredPdf(supabase, regenerated.document));
  }
  if (!buffer) return { error: "Couldn't read that PDF. Please try again." };

  const title = saved.title ?? saved.itinerary_json.trip_title;
  const content = buildResendItineraryEmail(title, document.locale);
  const sendResult = await sendEmail({
    to: user.email,
    subject: content.subject,
    html: content.html,
    attachment: { filename: `${title}.pdf`, content: buffer },
  });

  await logDelivery(
    supabase,
    user.id,
    activeDocument.id,
    "email",
    sendResult.sent ? "sent" : "failed",
    user.email,
    sendResult.sent ? null : sendResult.error
  );
  if (!sendResult.sent) return { error: "Couldn't resend that email. Please try again." };

  revalidatePath("/my-trips");
  return {};
}
