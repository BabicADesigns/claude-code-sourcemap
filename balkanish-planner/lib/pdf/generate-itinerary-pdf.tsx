import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { TRAVEL_STYLE_TO_PLANNER_STYLE, type SavedItinerary } from "@/lib/types";

/**
 * Renders the branded itinerary PDF to a Blob. Shared by the on-demand "Export Premium
 * PDF" download and reusable as-is by a future email-delivery flow — keeps @react-pdf/renderer
 * out of the initial bundle via dynamic import, same as the original inline implementation.
 */
export async function generateItineraryPdfBlob(
  itinerary: GeneratedItinerary,
  input: PlannerInput,
  locale: Locale = DEFAULT_LOCALE
): Promise<Blob> {
  const [{ pdf }, { ItineraryPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/planner/itinerary-pdf"),
  ]);
  return pdf(<ItineraryPdfDocument itinerary={itinerary} input={input} locale={locale} />).toBlob();
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Server-side counterpart to generateItineraryPdfBlob — same document, rendered to a Buffer
 * instead of a Blob for code paths that never touch the browser (email attachments, Storage
 * uploads). @react-pdf/renderer's toBuffer() resolves to a Node ReadableStream, not a Buffer
 * directly, hence streamToBuffer above.
 */
export async function generateItineraryPdfBuffer(
  itinerary: GeneratedItinerary,
  input: PlannerInput,
  locale: Locale = DEFAULT_LOCALE
): Promise<Buffer> {
  const [{ pdf }, { ItineraryPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/planner/itinerary-pdf"),
  ]);
  const stream = await pdf(<ItineraryPdfDocument itinerary={itinerary} input={input} locale={locale} />).toBuffer();
  return streamToBuffer(stream);
}

/**
 * Reconstructs a PlannerInput-shaped object from a saved itinerary row, for regenerating its PDF
 * without re-running the AI planner. Every field round-trips exactly except plannerStyle — see
 * TRAVEL_STYLE_TO_PLANNER_STYLE for why that one's a display-only approximation.
 */
export function plannerInputFromSavedItinerary(saved: SavedItinerary): PlannerInput {
  return {
    durationDays: saved.duration_days,
    month: saved.month,
    budget: saved.budget as PlannerInput["budget"],
    country: saved.itinerary_json.country,
    pace: saved.itinerary_json.pace,
    plannerStyle: TRAVEL_STYLE_TO_PLANNER_STYLE[saved.travel_style],
    interests: saved.interests,
  };
}
