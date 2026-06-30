import type { DiscoveryQuery, ItineraryFocus } from "@/lib/types";

/**
 * Deterministic, regex/keyword-based parser for planner free-text discovery queries
 * (requirement #7) — never an LLM call. Keeping this rule-based, rather than AI-classified,
 * means intent/anchor extraction is reproducible and auditable, and never itself a source of
 * invented facts.
 *
 * Multilingual readiness (requirement #9): keyword/pattern matching covers English, German,
 * Italian, and Croatian — the four locales lib/i18n supports. Focus-tag keywords are stored as
 * short stems (e.g. Croatian "plaž" rather than the full "plaža"/"plaži"/"plažu") so a single
 * entry catches a declined/inflected language's common case forms via plain substring matching,
 * with no per-language grammar engine. Anchor-place capture (the named place inside a "near X" /
 * "alternatives to X" / "from X to Y" query) is best-effort outside English: German and Italian
 * place names are usually unchanged by case, but Croatian declines them (e.g. "Dubrovniku",
 * "Zagreba") and an AI-suggested place's name from lib/ai/discovery.ts won't match that inflected
 * form. This is an honest, documented limitation, not a silent failure — resolveAnchorCoordinates
 * (lib/ai/verification.ts) already treats "no match" as "can't verify proximity," never as a
 * rejection, so an unmatched anchor degrades gracefully to skipping the proximity confidence
 * boost rather than breaking discovery. See docs/ai-expansion-engine-architecture.md "Multilingual
 * readiness" for the full writeup and the manually-verified example queries in all four locales.
 */
const FOCUS_KEYWORDS: Record<ItineraryFocus, string[]> = {
  coast: [
    // en
    "beach", "beaches", "coast", "coastal", "island", "islands", "seaside",
    // de
    "strand", "küste", "insel", "inseln",
    // it
    "spiaggia", "spiagge", "costa", "costiera", "isola", "isole", "balnear",
    // hr
    "plaž", "obal", "otok",
  ],
  food: [
    // en
    "food", "cuisine", "culinary", "gastronom", "restaurant",
    // de
    "kulinar", "küche",
    // it
    "cibo", "cucina", "gastronomia", "ristorante",
    // hr
    "hran", "kuhinj", "restoran",
  ],
  wine: [
    // en
    "wine", "vineyard", "winery", "wineries",
    // de
    "wein",
    // it
    "vino", "vigneto", "cantina",
    // hr
    "vin",
  ],
  slow_living: [
    // en
    "slow", "quiet", "peaceful", "relax", "tranquil",
    // de
    "ruhig", "langsam", "erholung", "entspann",
    // it
    "tranquill", "lent", "rilass", "riposo",
    // hr
    "tih", "mirn", "opuštanj", "polako",
  ],
  romantic: [
    // en
    "romantic", "romance", "honeymoon", "couple",
    // de
    "romantisch", "flitterwochen", "paar",
    // it
    "romantic", "luna di miele", "coppia",
    // hr
    "romantič", "medeni mjesec", "par",
  ],
  family: [
    // en
    "family", "kids", "children", "child-friendly",
    // de
    "familie", "kinder",
    // it
    "famiglia", "bambini",
    // hr
    "obitelj", "djec",
  ],
  culture: [
    // en
    "culture", "historic", "history", "heritage", "museum", "old town",
    // de
    "kultur", "historisch", "geschichte", "altstadt", "museum",
    // it
    "cultura", "storic", "museo", "centro storico",
    // hr
    "kultur", "povijes", "muzej", "stari grad",
  ],
  national_park: [
    // en
    "national park", "waterfall", "mountain", "hiking", "nature", "lake",
    // de
    "nationalpark", "wasserfall", "berg", "wandern", "natur", "see",
    // it
    "parco nazionale", "cascata", "montagna", "escursioni", "natura", "lago",
    // hr
    "nacionalni park", "vodopad", "planin", "prirod", "jezer",
  ],
  road_trip: [
    // en
    "road trip", "driving route", "drive",
    // de
    "roadtrip", "autoroute", "fahrt",
    // it
    "viaggio su strada", "in auto",
    // hr
    "road trip", "vožnj", "putovanje autom",
  ],
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

/** Each array is tried in order (en, de, it, hr); the first pattern that matches wins. */
const ROUTE_BETWEEN_PATTERNS = [
  /\bfrom\s+([a-zÀ-ſ][a-zÀ-ſ\s]*?)\s+to\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // en: "from X to Y"
  /\bvon\s+([a-zÀ-ſ][a-zÀ-ſ\s]*?)\s+nach\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // de: "von X nach Y"
  /\bda\s+([a-zÀ-ſ][a-zÀ-ſ\s]*?)\s+a\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // it: "da X a Y"
  /\bod\s+([a-zÀ-ſ][a-zÀ-ſ\s]*?)\s+do\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // hr: "od X do Y"
];

const ALTERNATIVE_TO_PATTERNS = [
  /\b(?:alternatives?|substitutes?|instead of)\s+(?:to|for)?\s*([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // en
  /\b(?:alternativen?\s+zu|statt)\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // de: "Alternativen zu X" / "statt X"
  /\binvece\s+di\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // it: "invece di X"
  /\balternativ[ae]\b[\s\S]*?\ba\s+([A-ZÀ-ſ][a-zA-ZÀ-ſ\s]*)$/i, // it: "alternativa/e ... a X" (qualifier may sit in between)
  /\bumjesto\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // hr: "umjesto X"
  /\balternativ[ae]\b\s*(?:za\s+)?([A-ZÀ-ſ][a-zA-ZÀ-ſ\s]*)$/i, // hr: "alternative [za] X" (no preposition needed)
];

const NEAR_PATTERNS = [
  /\bnear\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // en
  /\b(?:in\s+der\s+nähe\s+von|nahe\s+bei|nahe)\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // de
  /\b(?:vicino\s+a|nei\s+pressi\s+di)\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // it
  /\b(?:u\s+blizini|blizu)\s+([a-zÀ-ſ][a-zÀ-ſ\s]*)/i, // hr
];

const IN_PLACE_PATTERNS = [
  /\bin\s+([A-ZÀ-ſ][a-zA-ZÀ-ſ\s]*)$/, // en, de, it all use "in"
  /\bu\s+([A-ZÀ-ſ][a-zA-ZÀ-ſ\s]*)$/, // hr: "u X"
];

function firstMatch(patterns: RegExp[], text: string): RegExpExecArray | null {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) return match;
  }
  return null;
}

/** Parses a free-text discovery query into structured intent + focus tags + anchor place(s). */
export function parseDiscoveryQuery(raw: string): DiscoveryQuery {
  const trimmed = raw.trim();
  const cleaned = stripPunctuation(trimmed);
  const focus_tags = extractFocusTags(cleaned);

  const routeMatch = firstMatch(ROUTE_BETWEEN_PATTERNS, cleaned);
  if (routeMatch) {
    return {
      raw: trimmed,
      intent: "route_between",
      focus_tags,
      anchor_place: stripPunctuation(routeMatch[1]),
      route_to_place: stripPunctuation(routeMatch[2]),
    };
  }

  const alternativeMatch = firstMatch(ALTERNATIVE_TO_PATTERNS, cleaned);
  if (alternativeMatch) {
    return {
      raw: trimmed,
      intent: "alternative_to",
      focus_tags,
      anchor_place: stripPunctuation(alternativeMatch[1]),
      route_to_place: null,
    };
  }

  const nearMatch = firstMatch(NEAR_PATTERNS, cleaned);
  if (nearMatch) {
    return {
      raw: trimmed,
      intent: "themed_search",
      focus_tags,
      anchor_place: stripPunctuation(nearMatch[1]),
      route_to_place: null,
    };
  }

  const inMatch = firstMatch(IN_PLACE_PATTERNS, cleaned);
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
