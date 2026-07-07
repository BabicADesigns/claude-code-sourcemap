/**
 * Inspiration Capture Pipeline
 *
 * Orchestrates: detect → adapt → resolve → spark
 *
 * Entry points:
 *   runCapturePipeline(input)  — URL, social URL, or plain text
 *   runImageCapturePipeline(imageDataBase64) — screenshot (temporary only)
 *
 * The pipeline is source-agnostic: new adapters can be added to ADAPTER_REGISTRY
 * without changing any domain logic. The registry evaluates adapters in order;
 * the first canHandle() match wins.
 *
 * Screenshot privacy contract: the image is passed to imageEvidenceAdapter.adapt()
 * and immediately discarded. It is NEVER stored, logged, or returned.
 */

import type { CaptureAdapterResult, InspirationCapture, InspirationCaptureInput, PlaceResolutionResult } from "@/lib/types";
import type { AdapterRegistry } from "@/lib/capture/types";
import { detectSource } from "@/lib/capture/detect-source";
import { socialUrlAdapter } from "@/lib/capture/adapters/social-url-adapter";
import { urlAdapter } from "@/lib/capture/adapters/url-adapter";
import { manualTextAdapter } from "@/lib/capture/adapters/manual-text-adapter";
import { imageEvidenceAdapter } from "@/lib/capture/adapters/image-evidence-adapter";
import { resolvePlace } from "@/lib/capture/place-resolver";
import { generateMemorySpark } from "@/lib/capture/memory-spark";

/** Registry: evaluated in order; first canHandle() match wins */
const ADAPTER_REGISTRY: AdapterRegistry = [
  socialUrlAdapter,   // Social URLs (Instagram, TikTok, etc.) before generic URL
  urlAdapter,         // Any other HTTP/HTTPS URL
  manualTextAdapter,  // Fallback for plain text
];

export interface PipelineResult {
  adapterResult: CaptureAdapterResult;
  resolution: PlaceResolutionResult;
  memorySpark: string | null;
}

/**
 * Runs the full capture pipeline for URL or text input.
 * Never throws — returns the best available result even on failures.
 */
export async function runCapturePipeline(input: InspirationCaptureInput): Promise<PipelineResult> {
  const rawInput = (input.source_url ?? input.manual_text ?? "").trim();

  let adapterResult: CaptureAdapterResult;

  const adapter = ADAPTER_REGISTRY.find((a) => a.canHandle(rawInput));
  if (adapter) {
    adapterResult = await adapter.adapt(rawInput);
  } else {
    // Should not reach here — manualTextAdapter always matches — but be safe
    adapterResult = await manualTextAdapter.adapt(rawInput);
  }

  const resolution = resolvePlace(adapterResult);
  const partialCapture = buildPartialCapture(adapterResult, resolution, input);
  const memorySpark = generateMemorySpark(partialCapture);

  return { adapterResult, resolution, memorySpark };
}

/**
 * Runs the pipeline for a screenshot upload.
 * The image data is analyzed and immediately discarded — never returned or stored.
 */
export async function runImageCapturePipeline(imageDataBase64: string, userNote?: string | null): Promise<PipelineResult> {
  const adapterResult = await imageEvidenceAdapter.adapt(imageDataBase64);
  const resolution = resolvePlace(adapterResult);
  const partialCapture = buildPartialCapture(adapterResult, resolution, { user_note: userNote });
  const memorySpark = generateMemorySpark(partialCapture);

  // Image data is NOT returned — only structured results propagate
  return { adapterResult, resolution, memorySpark };
}

/**
 * Assembles a partial InspirationCapture for Memory Spark generation.
 * Does not include database-assigned fields (id, user_id, timestamps).
 */
function buildPartialCapture(
  adapterResult: CaptureAdapterResult,
  resolution: PlaceResolutionResult,
  input: InspirationCaptureInput,
): InspirationCapture {
  const detectResult = adapterResult.source_type !== "MANUAL_TEXT" && adapterResult.source_type !== "SCREENSHOT"
    ? detectSource(input.source_url ?? "")
    : null;

  return {
    id: "",
    user_id: "",
    source_type: adapterResult.source_type,
    source_url: input.source_url ?? null,
    source_provider: adapterResult.source_provider ?? (detectResult?.source_provider ?? null),
    source_creator: adapterResult.source_creator,
    original_source_reference: adapterResult.original_source_reference,
    place_name: resolution.place_name,
    country_code: resolution.country_code,
    region: resolution.region,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    place_type: resolution.place_type,
    user_note: input.user_note ?? null,
    capture_context: adapterResult.capture_context,
    memory_spark: null,
    resolution_confidence: resolution.resolution_confidence,
    resolution_status: resolution.resolution_status,
    provenance: null,
    captured_at: new Date().toISOString(),
    confirmed_at: null,
    dismissed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
