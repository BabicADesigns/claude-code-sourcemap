/**
 * MiniMax image-to-image generation — architecture only until MINIMAX_API_KEY is set, the same
 * "real code behind a configured-check, safe fallback otherwise" pattern as lib/email/send.ts and
 * lib/ai/itinerary.ts's OpenAI gate (see docs/production-readiness.md). Talks to MiniMax's plain
 * REST API via fetch — no SDK dependency needed for one POST.
 *
 * Not wired into the media library (lib/media/normalize.ts, ImageAsset) or any page/route yet —
 * see docs/media-library-architecture.md §10 on why AI-generated imagery is deliberately kept out
 * of the automatic destination pipeline. This module is the seam a future, human-triggered "regenerate
 * hero image" action would call, not an automatic enrichment step.
 */

export type MinimaxAspectRatio = "1:1" | "16:9" | "4:3" | "3:2" | "2:3" | "3:4" | "9:16" | "21:9";

export interface GenerateImageToImageInput {
  /** Text description of the desired image, max 1500 characters. */
  prompt: string;
  /** Reference photo to generate from — a public URL or a base64 data URL. */
  referenceImageUrl: string;
  aspectRatio?: MinimaxAspectRatio;
  /** Number of images to generate, 1-9. Defaults to 1. */
  n?: number;
  seed?: number;
}

export type GenerateImageToImageResult =
  | { ok: true; imageUrls: string[] }
  | { ok: false; error: string };

interface MinimaxImageGenerationResponse {
  data?: { image_urls?: string[] };
  base_resp?: { status_code: number; status_msg: string };
}

export function isMinimaxConfigured(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY);
}

/** Generates image(s) from a reference photo via MiniMax's image-01 model. Never throws. */
export async function generateImageToImage(input: GenerateImageToImageInput): Promise<GenerateImageToImageResult> {
  if (!isMinimaxConfigured()) {
    return { ok: false, error: "not_configured" };
  }

  try {
    const response = await fetch("https://api.minimax.io/v1/image_generation", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "image-01",
        prompt: input.prompt,
        subject_reference: [{ type: "character", image_file: input.referenceImageUrl }],
        aspect_ratio: input.aspectRatio ?? "1:1",
        n: input.n ?? 1,
        seed: input.seed,
        response_format: "url",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return { ok: false, error: `MiniMax API error (${response.status}): ${body.slice(0, 300)}` };
    }

    const result = (await response.json()) as MinimaxImageGenerationResponse;
    if (result.base_resp && result.base_resp.status_code !== 0) {
      return { ok: false, error: `${result.base_resp.status_msg} (code ${result.base_resp.status_code})` };
    }

    const imageUrls = result.data?.image_urls ?? [];
    if (imageUrls.length === 0) {
      return { ok: false, error: "MiniMax returned no images (likely blocked by content safety)." };
    }

    return { ok: true, imageUrls };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
