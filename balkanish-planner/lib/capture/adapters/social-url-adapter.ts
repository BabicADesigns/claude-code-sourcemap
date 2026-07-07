/**
 * Social URL Adapter
 *
 * Handles URLs from known social media platforms (Instagram, TikTok, YouTube, etc.)
 * WITHOUT making any API calls to those platforms.
 *
 * What this adapter does:
 * - Detects the provider and extracts the post/reel/video ID for provenance auditing
 * - Returns extraction_available: false with a clear NEEDS_CONFIRMATION status
 * - Records the source_provider and original_source_reference for audit trail
 *
 * What this adapter does NOT do:
 * - Fetch private or authenticated content from social APIs
 * - Scrape social media pages (they require JS rendering and session cookies)
 * - Fabricate captions, titles, or location data
 * - Call any external API
 *
 * Design intent: live provider extraction is a separate adapter that can be
 * inserted here when an API key is available. The pipeline contract is unchanged.
 */

import type { SourceAdapter } from "@/lib/capture/types";
import type { CaptureAdapterResult, InspirationSourceProvider } from "@/lib/types";
import { detectSocialProvider, extractSocialReference } from "@/lib/capture/detect-source";

const ADAPTER_NAME = "social-url-adapter";
const ADAPTER_VERSION = "1.0";

const PROVIDER_NOTES: Record<InspirationSourceProvider, string> = {
  INSTAGRAM: "Instagram content requires authentication to extract. Save the link — your find is recorded.",
  YOUTUBE: "YouTube metadata can sometimes be retrieved. Add a note describing what caught your eye.",
  TIKTOK: "TikTok content is not publicly extractable. Your link is saved for reference.",
  PINTEREST: "Pinterest requires sign-in to view pins. Add a note to describe the place.",
  TWITTER: "Twitter/X content requires authentication. Add a note with what you remember.",
  FACEBOOK: "Facebook content is not publicly accessible. Add a note to keep the context.",
  GENERIC_WEB: "This URL could not be matched to a known social platform.",
  UNKNOWN: "Unable to extract content from this URL. Add a note to describe the place.",
};

export const socialUrlAdapter: SourceAdapter = {
  name: ADAPTER_NAME,
  version: ADAPTER_VERSION,

  canHandle(input: string): boolean {
    return detectSocialProvider(input) !== null;
  },

  async adapt(url: string): Promise<CaptureAdapterResult> {
    const extractedAt = new Date().toISOString();
    const provider = detectSocialProvider(url) ?? "UNKNOWN";
    const sourceReference = extractSocialReference(url, provider);

    return {
      source_type: "SOCIAL_URL",
      source_provider: provider,
      source_creator: null,
      original_source_reference: sourceReference,
      raw_title: null,
      raw_description: null,
      raw_location_hint: null,
      capture_context: null,
      confidence: 0,
      provenance_metadata: {
        adapter: ADAPTER_NAME,
        adapter_version: ADAPTER_VERSION,
        extracted_at: extractedAt,
        fetch_result: "skipped_no_api",
        source_url: url,
        detected_provider: provider,
        source_reference: sourceReference,
      },
      extraction_available: false,
      extraction_note: PROVIDER_NOTES[provider] ?? PROVIDER_NOTES.UNKNOWN,
    };
  },
};
