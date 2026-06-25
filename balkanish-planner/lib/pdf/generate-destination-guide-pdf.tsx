import type { Destination } from "@/lib/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Renders the branded destination guide PDF to a Blob — download-only (see
 * docs/pdf-delivery-architecture.md for why this skips Storage/email), same dynamic-import
 * pattern as generateItineraryPdfBlob so @react-pdf/renderer stays out of the initial bundle.
 */
export async function generateDestinationGuidePdfBlob(
  destination: Destination,
  locale: Locale = DEFAULT_LOCALE
): Promise<Blob> {
  const [{ pdf }, { DestinationGuidePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/planner/destination-guide-pdf"),
  ]);
  return pdf(<DestinationGuidePdfDocument destination={destination} locale={locale} />).toBlob();
}
