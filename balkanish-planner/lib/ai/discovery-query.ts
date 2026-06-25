import type { DiscoveryQuery, ItineraryFocus } from "@/lib/types";

/**
 * Deterministic, regex/keyword-based parser for planner free-text discovery queries
 * (requirement #7) — never an LLM call. Keeping this rule-based, rather than AI-classified,
 * means intent/anchor extraction is reproducible and auditable, and never itself a source of
 * invented facts.
 */
const FOCUS_KEYWORDS: Record<ItineraryFocus, string[]> = {
  coast: ["beach", "beaches", "coast", "coastal", "island", "islands", "seaside"],
  food: ["food", "cuisine", "culinary", "gastronom", "restaurant"],
  wine: ["wine", "vineyard", "winery", "wineries"],
  slow_living: ["slow", "quiet", "peaceful", "relax", "tranquil"],
  romantic: ["romantic", "romance", "honeymoon", "couple"],
  family: ["family", "kids", "children", "child-friendly"],
  culture: ["culture", "historic", "history", "heritage", "museum", "old town"],
  national_park: ["national park", "waterfall", "mountain", "hiking", "nature", "lake"],
  road_trip: ["road trip", "driving route", "drive"],
  mixed: [],
};

function stripPunctuation(value: string): string {
  return value.replace(/[?.!,;:]+$/g, "").trim();
}

function extractFocusTags(cleaned: string): ItineraryFocus[] {
  const lower = cleaned.toLowerCase();
  const matches: ItineraryFocus[] = [];
  for (const [focus, keywords] of Object.entries(FOCUS_KEYWORDS) as [ItineraryFocus, string[]][]) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      matches.push(focus);
    }
  }
  return matches;
}

const ROUTE_BETWEEN_RE = /\bfrom\s+([a-zÀ-ſ][a-zÀ-ſ\s]*?)\s+to\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i;
const ALTERNATIVE_TO_RE = /\b(?:alternatives?|substitutes?|instead of)\s+(?:to|for)?\s*([a-zÀ-ſ][a-zÀ-ſ\s]*)/i;
const NEAR_RE = /\bnear\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i;
const IN_PLACE_RE = /\bin\s+([A-ZÀ-ſ][a-zA-ZÀ-ſ\s]*)$/;

/** Parses a free-text discovery query into structured intent + focus tags + anchor place(s). */
export function parseDiscoveryQuery(raw: string): DiscoveryQuery {
  const trimmed = raw.trim();
  const cleaned = stripPunctuation(trimmed);
  const focus_tags = extractFocusTags(cleaned);

  const routeMatch = ROUTE_BETWEEN_RE.exec(cleaned);
  if (routeMatch) {
    return {
      raw: trimmed,
      intent: "route_between",
      focus_tags,
      anchor_place: stripPunctuation(routeMatch[1]),
      route_to_place: stripPunctuation(routeMatch[2]),
    };
  }

  const alternativeMatch = ALTERNATIVE_TO_RE.exec(cleaned);
  if (alternativeMatch) {
    return {
      raw: trimmed,
      intent: "alternative_to",
      focus_tags,
      anchor_place: stripPunctuation(alternativeMatch[1]),
      route_to_place: null,
    };
  }

  const nearMatch = NEAR_RE.exec(cleaned);
  if (nearMatch) {
    return {
      raw: trimmed,
      intent: "themed_search",
      focus_tags,
      anchor_place: stripPunctuation(nearMatch[1]),
      route_to_place: null,
    };
  }

  const inMatch = IN_PLACE_RE.exec(cleaned);
  if (inMatch) {
    return {
      raw: trimmed,
      intent: "themed_search",
      focus_tags,
      anchor_place: stripPunctuation(inMatch[1]),
      route_to_place: null,
    };
  }

  return {
    raw: trimmed,
    intent: focus_tags.length > 0 ? "themed_search" : "general",
    focus_tags,
    anchor_place: null,
    route_to_place: null,
  };
}
