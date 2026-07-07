/**
 * Adapter contracts for the Inspiration Capture pipeline.
 *
 * Architecture principle: the core Travel Intent domain NEVER imports provider-specific
 * logic. All provider knowledge lives in adapters that implement these interfaces.
 * Replacing an adapter (URL fetcher, social platform, OCR/vision provider, geocoder)
 * requires only swapping the adapter file — the pipeline and domain model are unchanged.
 *
 * CAPTURE → RESOLVE → CONFIRM → REMEMBER → MATCH → RESURFACE → ACT
 */

import type { CaptureAdapterResult, ImageEvidenceResult } from "@/lib/types";

/** Common input shape for all source adapters. */
export interface SourceAdapterInput {
  raw_input: string;
}

/** Contract that every source adapter must satisfy. */
export interface SourceAdapter {
  /** Adapter identifier included in provenance metadata. */
  readonly name: string;
  readonly version: string;

  /** Returns true when this adapter should handle the given input. */
  canHandle(input: string): boolean;

  /** Processes the input and returns a normalized CaptureAdapterResult. */
  adapt(input: string): Promise<CaptureAdapterResult>;
}

/** Contract for image/screenshot analysis providers. */
export interface ImageEvidenceProvider {
  readonly name: string;
  readonly version: string;

  /** Returns true when this provider is configured and available. */
  isAvailable(): boolean;

  /**
   * Analyzes an image (provided as base64) for text and location hints.
   * Must NEVER retain the image data. Must NEVER return fabricated results.
   * When unavailable, returns { available: false, confidence: 0 }.
   */
  analyze(imageDataBase64: string): Promise<ImageEvidenceResult>;
}

/** Contract for place resolution providers. */
export interface PlaceResolutionProvider {
  readonly name: string;
  readonly version: string;

  /** Returns true when this provider is configured and available. */
  isAvailable(): boolean;
}

/**
 * Registry of all registered source adapters.
 * Adapters are evaluated in order; the first one where canHandle() returns true is used.
 * The GenericUrlAdapter acts as the default fallback for unmatched URLs.
 */
export type AdapterRegistry = SourceAdapter[];
