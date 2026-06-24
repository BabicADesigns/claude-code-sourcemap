import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

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
