/**
 * Source detection: identifies whether a raw input is a URL, social URL, or text,
 * and which platform (if any) it belongs to.
 *
 * Provider detection is purely regex-based — no API calls, no scraping.
 * Detecting a provider does NOT give access to any provider API.
 */

import type { InspirationCaptureSource, InspirationSourceProvider } from "@/lib/types";

/**
 * Known social media URL patterns.
 * Adding a new platform here is the only change needed for provider detection.
 * No other code needs to be modified.
 */
const SOCIAL_URL_PATTERNS: Array<{ provider: InspirationSourceProvider; pattern: RegExp }> = [
  { provider: "INSTAGRAM", pattern: /instagram\.com\/(p|reel|tv|stories)\//i },
  { provider: "YOUTUBE",   pattern: /(?:youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\/)/i },
  { provider: "TIKTOK",    pattern: /tiktok\.com\/@[\w.]+\/video\//i },
  { provider: "PINTEREST",  pattern: /pinterest\.\w{2,3}\/pin\//i },
  { provider: "TWITTER",   pattern: /(?:twitter|x)\.com\/\w+\/status\//i },
  { provider: "FACEBOOK",  pattern: /facebook\.com\/(?:watch|reel|video|photo)\//i },
];

/** Checks if an input string looks like a valid URL. */
export function isUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Detects which social provider a URL belongs to, if any. */
export function detectSocialProvider(url: string): InspirationSourceProvider | null {
  for (const { provider, pattern } of SOCIAL_URL_PATTERNS) {
    if (pattern.test(url)) return provider;
  }
  return null;
}

export interface SourceDetectionResult {
  source_type: InspirationCaptureSource;
  source_provider: InspirationSourceProvider | null;
  normalized_input: string;
}

/**
 * Determines the source type and provider for a raw user input string.
 * Does not make any network calls.
 */
export function detectSource(rawInput: string): SourceDetectionResult {
  const trimmed = rawInput.trim();

  if (isUrl(trimmed)) {
    const socialProvider = detectSocialProvider(trimmed);
    if (socialProvider) {
      return {
        source_type: "SOCIAL_URL",
        source_provider: socialProvider,
        normalized_input: trimmed,
      };
    }
    return {
      source_type: "URL",
      source_provider: "GENERIC_WEB",
      normalized_input: trimmed,
    };
  }

  return {
    source_type: "MANUAL_TEXT",
    source_provider: null,
    normalized_input: trimmed,
  };
}

/**
 * Extracts a post/reel/pin/video ID from a known social URL for provenance auditing.
 * This is used only as a provenance reference — never for re-fetching private content.
 */
export function extractSocialReference(url: string, provider: InspirationSourceProvider): string | null {
  try {
    const parsed = new URL(url);
    switch (provider) {
      case "INSTAGRAM": {
        const match = parsed.pathname.match(/\/(p|reel|tv|stories)\/([A-Za-z0-9_-]+)/);
        return match?.[2] ?? null;
      }
      case "YOUTUBE": {
        const v = parsed.searchParams.get("v");
        if (v) return v;
        const pathMatch = parsed.pathname.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]+)/);
        return pathMatch?.[1] ?? null;
      }
      case "TIKTOK": {
        const match = parsed.pathname.match(/\/video\/(\d+)/);
        return match?.[1] ?? null;
      }
      case "PINTEREST": {
        const match = parsed.pathname.match(/\/pin\/(\d+)/);
        return match?.[1] ?? null;
      }
      case "TWITTER": {
        const match = parsed.pathname.match(/\/status\/(\d+)/);
        return match?.[1] ?? null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
