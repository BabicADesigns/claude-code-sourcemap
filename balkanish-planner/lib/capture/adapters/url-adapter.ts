/**
 * Generic URL Adapter
 *
 * Fetches Open Graph metadata (og:title, og:description, og:site_name, article:section)
 * from publicly accessible web pages. This is the same data any link-preview widget reads.
 *
 * Limitations and honesty:
 * - Only reads publicly available metadata — never authenticated content
 * - Times out at 5 seconds to prevent planner blocking
 * - Returns extraction_available: false when the fetch fails rather than inventing data
 *
 * Replacement guide: to use a dedicated link-preview service, swap this adapter only.
 * The pipeline contract (CaptureAdapterResult) is unchanged.
 */

import type { SourceAdapter } from "@/lib/capture/types";
import type { CaptureAdapterResult } from "@/lib/types";
import { isUrl } from "@/lib/capture/detect-source";

const ADAPTER_NAME = "url-adapter";
const ADAPTER_VERSION = "1.0";
const FETCH_TIMEOUT_MS = 5000;

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property.replace("og:", "")}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1].trim()) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function buildCaptureContext(title: string | null, description: string | null): string | null {
  const parts: string[] = [];
  if (title) parts.push(title);
  if (description && description !== title) {
    parts.push(description.length > 200 ? description.slice(0, 200) + "…" : description);
  }
  return parts.length > 0 ? parts.join(" — ") : null;
}

export const urlAdapter: SourceAdapter = {
  name: ADAPTER_NAME,
  version: ADAPTER_VERSION,

  canHandle(input: string): boolean {
    return isUrl(input);
  },

  async adapt(url: string): Promise<CaptureAdapterResult> {
    const extractedAt = new Date().toISOString();
    let html: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Balkanish/1.0 (travel inspiration capture; https://balkanish.com)",
          Accept: "text/html",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        // Read only the first 50KB — enough for <head> meta tags
        html = text.slice(0, 50_000);
      }
    } catch {
      // Network error or timeout — return gracefully
    }

    if (!html) {
      return {
        source_type: "URL",
        source_provider: "GENERIC_WEB",
        source_creator: null,
        original_source_reference: null,
        raw_title: null,
        raw_description: null,
        raw_location_hint: null,
        capture_context: null,
        confidence: 0,
        provenance_metadata: {
          adapter: ADAPTER_NAME,
          adapter_version: ADAPTER_VERSION,
          extracted_at: extractedAt,
          fetch_result: "failed",
          source_url: url,
        },
        extraction_available: false,
        extraction_note: "Could not fetch page metadata. The URL may be private, rate-limited, or unavailable.",
      };
    }

    const rawTitle = extractTitle(html);
    const rawDescription = extractMetaContent(html, "og:description") ?? extractMetaContent(html, "description");
    const rawLocationHint = extractMetaContent(html, "og:locality") ??
      extractMetaContent(html, "place:location:latitude") ? null : null;
    const siteName = extractMetaContent(html, "og:site_name");

    const captureContext = buildCaptureContext(rawTitle, rawDescription);
    const hasUsefulContent = !!(rawTitle || rawDescription);

    return {
      source_type: "URL",
      source_provider: "GENERIC_WEB",
      source_creator: siteName,
      original_source_reference: null,
      raw_title: rawTitle,
      raw_description: rawDescription,
      raw_location_hint: rawLocationHint,
      capture_context: captureContext,
      confidence: hasUsefulContent ? 0.4 : 0.1,
      provenance_metadata: {
        adapter: ADAPTER_NAME,
        adapter_version: ADAPTER_VERSION,
        extracted_at: extractedAt,
        fetch_result: "success",
        source_url: url,
        site_name: siteName ?? null,
        has_og_title: rawTitle ? "true" : "false",
        has_og_description: rawDescription ? "true" : "false",
      },
      extraction_available: hasUsefulContent,
      extraction_note: hasUsefulContent
        ? null
        : "Page loaded but no useful metadata found. Add a note to describe the place.",
    };
  },
};
