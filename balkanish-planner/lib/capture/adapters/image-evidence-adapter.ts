/**
 * Image Evidence Adapter
 *
 * Processes screenshot/image uploads for inspiration capture.
 *
 * Privacy contract (non-negotiable):
 * - The image buffer is accepted transiently for analysis only
 * - NEVER persisted, logged, or stored anywhere
 * - screenshot_retained is ALWAYS false in provenance metadata
 * - Only structured evidence (text snippets, location hints) is returned
 *
 * Current implementation:
 * - No vision provider is configured in Phase 26
 * - Returns { available: false } — explicitly communicates unavailability
 * - Never fabricates extracted text or location hints
 *
 * Replacement guide: when a vision provider (e.g., OpenAI Vision) is configured,
 * replace the no-op isAvailable() check and implement analyze() in a new
 * ImageEvidenceProvider module. Wire it in here without changing pipeline.ts.
 */

import type { SourceAdapter, ImageEvidenceProvider } from "@/lib/capture/types";
import type { CaptureAdapterResult, ImageEvidenceResult } from "@/lib/types";

const ADAPTER_NAME = "image-evidence-adapter";
const ADAPTER_VERSION = "1.0";

/**
 * No-op implementation of ImageEvidenceProvider.
 * Returned when no vision provider is configured.
 */
const noOpImageProvider: ImageEvidenceProvider = {
  name: "no-op-image-provider",
  version: "1.0",

  isAvailable(): boolean {
    return false;
  },

  async analyze(imageDataBase64: string): Promise<ImageEvidenceResult> {
    void imageDataBase64;
    return {
      available: false,
      extraction_note: "Image analysis is not configured. Add a note to describe the place.",
      raw_text_extracted: null,
      location_hints: [],
      confidence: 0,
    };
  },
};

/** Returns the configured image provider; falls back to no-op when none is wired. */
function getImageProvider(): ImageEvidenceProvider {
  // Future: check for OPENAI_API_KEY or other vision provider env var and return
  // a real provider implementation. For now, always return the no-op.
  return noOpImageProvider;
}

export const imageEvidenceAdapter: SourceAdapter = {
  name: ADAPTER_NAME,
  version: ADAPTER_VERSION,

  canHandle(input: string): boolean {
    // Not used for string inputs — the pipeline calls this adapter explicitly
    // when imageDataBase64 is present on the capture input.
    void input;
    return false;
  },

  async adapt(imageDataBase64: string): Promise<CaptureAdapterResult> {
    const extractedAt = new Date().toISOString();
    const provider = getImageProvider();

    let evidence: ImageEvidenceResult;
    if (provider.isAvailable()) {
      evidence = await provider.analyze(imageDataBase64);
    } else {
      evidence = await noOpImageProvider.analyze(imageDataBase64);
    }

    // Image is analyzed and immediately discarded — never stored
    const captureContext = evidence.raw_text_extracted
      ? evidence.raw_text_extracted.slice(0, 300)
      : null;
    const rawLocationHint = evidence.location_hints.length > 0
      ? evidence.location_hints.join(", ")
      : null;

    return {
      source_type: "SCREENSHOT",
      source_provider: null,
      source_creator: null,
      original_source_reference: null,
      raw_title: null,
      raw_description: evidence.raw_text_extracted,
      raw_location_hint: rawLocationHint,
      capture_context: captureContext,
      confidence: evidence.confidence,
      provenance_metadata: {
        adapter: ADAPTER_NAME,
        adapter_version: ADAPTER_VERSION,
        extracted_at: extractedAt,
        screenshot_analyzed: evidence.available ? "true" : "false",
        screenshot_retained: "false",
        vision_provider: provider.name,
        extraction_note: evidence.extraction_note,
      },
      extraction_available: evidence.available && evidence.confidence > 0,
      extraction_note: evidence.available
        ? null
        : evidence.extraction_note,
    };
  },
};
