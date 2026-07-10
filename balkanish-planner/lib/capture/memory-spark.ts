/**
 * Memory Spark Generator
 *
 * Deterministic. No AI. No external calls.
 * Generates a short reminder of WHY this place was saved,
 * based only on what the capture actually contained.
 *
 * Rules:
 * 1. User note always wins — it's the richest signal (explicit intent)
 * 2. Social + place → "Spotted on [Provider]: [place]"
 * 3. URL title + place name → "[title] — [place], [country]"
 * 4. URL title alone → "Spotted online: [title]"
 * 5. Manual text → "You noted: [text]"
 * 6. Screenshot + place → "Screenshot pointed to [place]"
 * 7. Fallback → generic "A place you saved" message
 *
 * Design constraints:
 * - Never claims user emotion unless the user stated it themselves
 * - Never invents detail not present in the capture
 * - Kept under 150 characters for card display
 * - Observable fact only — what the source said, not what we infer
 */

import type { InspirationCapture, InspirationSourceProvider } from "@/lib/types";

const PROVIDER_NAMES: Record<InspirationSourceProvider, string> = {
  INSTAGRAM: "Instagram",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  PINTEREST: "Pinterest",
  TWITTER: "Twitter / X",
  FACEBOOK: "Facebook",
  GENERIC_WEB: "the web",
  UNKNOWN: "online",
};

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function formatPlace(capture: InspirationCapture): string | null {
  if (capture.place_name && capture.country_code) {
    return `${capture.place_name}, ${capture.country_code}`;
  }
  if (capture.place_name) return capture.place_name;
  return null;
}

/**
 * Generates a deterministic Memory Spark string for a capture.
 * Returns null when no meaningful content is available.
 */
export function generateMemorySpark(capture: InspirationCapture): string | null {
  // Rule 1: user note is the strongest signal
  if (capture.user_note?.trim()) {
    const note = capture.user_note.trim();
    return truncate(`You noted: "${note}"`, 150);
  }

  const place = formatPlace(capture);

  // Rule 2: social platform + place
  if (capture.source_type === "SOCIAL_URL" && capture.source_provider) {
    const providerName = PROVIDER_NAMES[capture.source_provider] ?? "online";
    if (place) return truncate(`Spotted on ${providerName}: ${place}`, 150);
    return truncate(`Saved from ${providerName}`, 120);
  }

  // Rule 3: URL with both title context and place
  if (capture.source_type === "URL" && capture.capture_context && place) {
    return truncate(`${capture.capture_context} — ${place}`, 150);
  }

  // Rule 4: URL title alone
  if (capture.source_type === "URL" && capture.capture_context) {
    return truncate(`Spotted online: ${capture.capture_context}`, 150);
  }

  // Rule 5: manual text — use the capture context (which is the raw text)
  if (capture.source_type === "MANUAL_TEXT" && capture.capture_context) {
    return truncate(`You noted: ${capture.capture_context}`, 150);
  }

  // Rule 6: screenshot + resolved place
  if (capture.source_type === "SCREENSHOT" && place) {
    return truncate(`Screenshot pointed to ${place}`, 150);
  }

  // Rule 7: at least we have a place name
  if (place) {
    return truncate(`A place you saved: ${place}`, 150);
  }

  return null;
}
