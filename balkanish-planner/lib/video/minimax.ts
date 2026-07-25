/**
 * Text-to-video generation via MiniMax's API — architecture only until MINIMAX_API_KEY
 * is set, the same "real code behind a configured-check, safe fallback otherwise" pattern
 * as lib/ai/itinerary.ts's OpenAI gate and lib/email/send.ts's Resend gate. Talks to
 * MiniMax's plain REST API via fetch — no SDK dependency needed for one POST.
 *
 * This only creates the generation task (POST /v1/video_generation); MiniMax's task is
 * async and returns a task_id that must be polled via their separate query endpoint,
 * which is out of scope here until a caller needs it.
 */

const MINIMAX_API_URL = "https://api.minimax.io/v1/video_generation";

export const VIDEO_GENERATION_MODELS = ["MiniMax-Hailuo-2.3", "MiniMax-Hailuo-02", "T2V-01-Director", "T2V-01"] as const;
export type VideoGenerationModel = (typeof VIDEO_GENERATION_MODELS)[number];

export const VIDEO_RESOLUTIONS = ["720P", "768P", "1080P"] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTIONS)[number];

export interface GenerateVideoInput {
  model: VideoGenerationModel;
  /** Up to 2000 characters. Supports `[command]` camera-movement syntax for Hailuo-2.3/02 and T2V-01-Director. */
  prompt: string;
  promptOptimizer?: boolean;
  fastPretreatment?: boolean;
  /** Seconds. Defaults to 6 — see MiniMax's model/resolution duration table. */
  duration?: number;
  resolution?: VideoResolution;
  callbackUrl?: string;
}

export type GenerateVideoResult = { created: true; taskId: string } | { created: false; error: string };

interface VideoGenerationApiResponse {
  task_id?: string;
  base_resp: { status_code: number; status_msg: string };
}

export function isMiniMaxConfigured(): boolean {
  return Boolean(process.env.MINIMAX_API_KEY);
}

/** Creates one MiniMax text-to-video generation task. Returns a friendly, never-thrown error when unconfigured or when the API call fails. */
export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
  if (!isMiniMaxConfigured()) {
    return { created: false, error: "not_configured" };
  }

  try {
    const response = await fetch(MINIMAX_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        prompt: input.prompt,
        prompt_optimizer: input.promptOptimizer,
        fast_pretreatment: input.fastPretreatment,
        duration: input.duration,
        resolution: input.resolution,
        callback_url: input.callbackUrl,
      }),
    });

    const body = (await response.json()) as VideoGenerationApiResponse;

    if (!response.ok || body.base_resp?.status_code !== 0) {
      return { created: false, error: describeMiniMaxError(response.status, body.base_resp) };
    }

    if (!body.task_id) {
      return { created: false, error: "MiniMax API returned success with no task_id." };
    }

    return { created: true, taskId: body.task_id };
  } catch (error) {
    return { created: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const MINIMAX_STATUS_MESSAGES: Record<number, string> = {
  1002: "Rate limit triggered, please try again later.",
  1004: "Account authentication failed — check the MiniMax API key.",
  1008: "Insufficient account balance.",
  1026: "Sensitive content detected in prompt.",
  2013: "Invalid input parameters.",
  2049: "Invalid API key.",
};

function describeMiniMaxError(httpStatus: number, baseResp: VideoGenerationApiResponse["base_resp"] | undefined): string {
  if (!baseResp) return `MiniMax API error (HTTP ${httpStatus}).`;
  const known = MINIMAX_STATUS_MESSAGES[baseResp.status_code];
  return `MiniMax API error (${baseResp.status_code}): ${known ?? baseResp.status_msg}`;
}
