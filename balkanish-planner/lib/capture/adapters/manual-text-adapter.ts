/**
 * Manual Text Adapter
 *
 * Handles free-text input: a place name, a recommendation from a friend,
 * or any text description the user types. No network calls are made.
 *
 * Extraction strategy:
 * 1. Pass the raw text through as capture_context for the place resolver
 * 2. Treat the text itself as the best available title
 * 3. Report low confidence — the user text is unverified
 *
 * The place resolver (place-resolver.ts) handles keyword matching against
 * known Balkan destinations and country names. The adapter's job is only
 * to normalize the raw input into the CaptureAdapterResult contract.
 */

import type { SourceAdapter } from "@/lib/capture/types";
import type { CaptureAdapterResult } from "@/lib/types";

const ADAPTER_NAME = "manual-text-adapter";
const ADAPTER_VERSION = "1.0";

export const manualTextAdapter: SourceAdapter = {
  name: ADAPTER_NAME,
  version: ADAPTER_VERSION,

  canHandle(input: string): boolean {
    return input.trim().length >= 0; // always true; this is the final fallback adapter
    // Handles everything not handled by URL-based adapters.
    // The adapter registry evaluates in order; this is always the final fallback.
    return true;
  },

  async adapt(text: string): Promise<CaptureAdapterResult> {
    const extractedAt = new Date().toISOString();
    const trimmed = text.trim();

    // Use first 200 chars as the raw title; preserve full text as location hint
    const rawTitle = trimmed.length > 200 ? trimmed.slice(0, 200) + "…" : trimmed;

    return {
      source_type: "MANUAL_TEXT",
      source_provider: null,
      source_creator: null,
      original_source_reference: null,
      raw_title: rawTitle,
      raw_description: null,
      raw_location_hint: trimmed,
      capture_context: trimmed,
      confidence: 0.2,
      provenance_metadata: {
        adapter: ADAPTER_NAME,
        adapter_version: ADAPTER_VERSION,
        extracted_at: extractedAt,
        input_length: String(trimmed.length),
      },
      extraction_available: trimmed.length > 0,
      extraction_note: trimmed.length > 0
        ? null
        : "No text provided. Please enter a place name or recommendation.",
    };
  },
};
