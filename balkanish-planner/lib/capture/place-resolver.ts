/**
 * Place Resolver — Confidence-Aware Destination Matching
 *
 * Extracts place information from a CaptureAdapterResult using purely local
 * keyword matching against known Balkan destinations and country names.
 * No geocoding API or external service is required.
 *
 * Confidence thresholds:
 *   ≥ 0.8  → RESOLVED_HIGH_CONFIDENCE (auto-resolved, no confirmation needed)
 *   0.4–0.79 → NEEDS_CONFIRMATION (system has a suggestion, ask user to confirm)
 *   < 0.4  → UNRESOLVED (system has nothing useful; show raw input to user)
 *
 * The resolver NEVER claims a place is known with certainty unless the text
 * contains an exact match or very strong signal. User corrections always win.
 */

import type { CaptureAdapterResult, PlaceResolutionResult, InspirationPlaceType } from "@/lib/types";

interface KnownPlace {
  name: string;
  country_code: string;
  region: string;
  place_type: InspirationPlaceType;
  keywords: string[];
}

export const BALKAN_PLACES: KnownPlace[] = [
  // Croatia
  { name: "Plitvice Lakes", country_code: "HR", region: "Lika", place_type: "NATIONAL_PARK", keywords: ["plitvice", "plitvička jezera", "plitvice lakes"] },
  { name: "Dubrovnik", country_code: "HR", region: "Dalmatia", place_type: "CITY_OR_TOWN", keywords: ["dubrovnik", "ragusa"] },
  { name: "Split", country_code: "HR", region: "Dalmatia", place_type: "CITY_OR_TOWN", keywords: ["split", "spalato"] },
  { name: "Hvar", country_code: "HR", region: "Dalmatia", place_type: "COASTAL_AREA", keywords: ["hvar"] },
  { name: "Krka National Park", country_code: "HR", region: "Šibenik-Knin", place_type: "NATIONAL_PARK", keywords: ["krka", "krka waterfall", "krka national park"] },
  { name: "Zadar", country_code: "HR", region: "Dalmatia", place_type: "CITY_OR_TOWN", keywords: ["zadar"] },
  { name: "Trogir", country_code: "HR", region: "Dalmatia", place_type: "HISTORICAL_SITE", keywords: ["trogir"] },
  { name: "Rovinj", country_code: "HR", region: "Istria", place_type: "CITY_OR_TOWN", keywords: ["rovinj", "rovigno"] },
  { name: "Pula", country_code: "HR", region: "Istria", place_type: "CITY_OR_TOWN", keywords: ["pula", "pola"] },
  { name: "Brač", country_code: "HR", region: "Dalmatia", place_type: "COASTAL_AREA", keywords: ["brač", "brac", "zlatni rat", "bol"] },
  { name: "Vis", country_code: "HR", region: "Dalmatia", place_type: "COASTAL_AREA", keywords: ["vis island", " vis "] },
  { name: "Mljet", country_code: "HR", region: "Dalmatia", place_type: "NATIONAL_PARK", keywords: ["mljet"] },
  { name: "Korčula", country_code: "HR", region: "Dalmatia", place_type: "COASTAL_AREA", keywords: ["korčula", "korcula"] },
  { name: "Lokrum", country_code: "HR", region: "Dalmatia", place_type: "COASTAL_AREA", keywords: ["lokrum"] },
  { name: "Šibenik", country_code: "HR", region: "Dalmatia", place_type: "CITY_OR_TOWN", keywords: ["šibenik", "sibenik"] },
  { name: "Makarska", country_code: "HR", region: "Dalmatia", place_type: "COASTAL_AREA", keywords: ["makarska"] },
  { name: "Omiš", country_code: "HR", region: "Dalmatia", place_type: "CITY_OR_TOWN", keywords: ["omiš", "omis"] },
  { name: "Cetina Canyon", country_code: "HR", region: "Dalmatia", place_type: "NATURAL_FEATURE", keywords: ["cetina", "cetina canyon", "cetina gorge"] },
  // Bosnia and Herzegovina
  { name: "Mostar", country_code: "BA", region: "Herzegovina", place_type: "CITY_OR_TOWN", keywords: ["mostar", "stari most"] },
  { name: "Sarajevo", country_code: "BA", region: "Sarajevo", place_type: "CITY_OR_TOWN", keywords: ["sarajevo"] },
  { name: "Kravice Waterfalls", country_code: "BA", region: "Herzegovina", place_type: "NATURAL_FEATURE", keywords: ["kravice", "kravica waterfall"] },
  { name: "Trebinje", country_code: "BA", region: "Herzegovina", place_type: "CITY_OR_TOWN", keywords: ["trebinje"] },
  { name: "Blagaj", country_code: "BA", region: "Herzegovina", place_type: "HISTORICAL_SITE", keywords: ["blagaj", "blagaj tekke", "buna spring"] },
  { name: "Počitelj", country_code: "BA", region: "Herzegovina", place_type: "HISTORICAL_SITE", keywords: ["počitelj", "pocitelj"] },
  { name: "Una National Park", country_code: "BA", region: "Bihać", place_type: "NATIONAL_PARK", keywords: ["una national park", "una river"] },
  // Montenegro
  { name: "Kotor", country_code: "ME", region: "Bay of Kotor", place_type: "HISTORICAL_SITE", keywords: ["kotor", "boka kotorska", "bay of kotor"] },
  { name: "Budva", country_code: "ME", region: "Montenegro Riviera", place_type: "COASTAL_AREA", keywords: ["budva"] },
  { name: "Perast", country_code: "ME", region: "Bay of Kotor", place_type: "VILLAGE", keywords: ["perast"] },
  { name: "Sveti Stefan", country_code: "ME", region: "Montenegro Riviera", place_type: "COASTAL_AREA", keywords: ["sveti stefan", "saint stephen"] },
  { name: "Durmitor National Park", country_code: "ME", region: "Northern Montenegro", place_type: "NATIONAL_PARK", keywords: ["durmitor", "durmitor national park", "tara canyon", "tara river"] },
  { name: "Lovćen National Park", country_code: "ME", region: "Central Montenegro", place_type: "NATIONAL_PARK", keywords: ["lovćen", "lovcen"] },
  { name: "Lake Skadar", country_code: "ME", region: "Montenegro", place_type: "RIVER_OR_LAKE", keywords: ["skadar", "lake skadar", "shkodër lake"] },
  { name: "Ulcinj", country_code: "ME", region: "Montenegro Riviera", place_type: "COASTAL_AREA", keywords: ["ulcinj", "ulqin"] },
  // Slovenia
  { name: "Lake Bled", country_code: "SI", region: "Upper Carniola", place_type: "RIVER_OR_LAKE", keywords: ["lake bled", "bled", "blejsko jezero"] },
  { name: "Ljubljana", country_code: "SI", region: "Ljubljana", place_type: "CITY_OR_TOWN", keywords: ["ljubljana"] },
  { name: "Triglav National Park", country_code: "SI", region: "Upper Carniola", place_type: "NATIONAL_PARK", keywords: ["triglav", "triglav national park"] },
  { name: "Vintgar Gorge", country_code: "SI", region: "Upper Carniola", place_type: "NATURAL_FEATURE", keywords: ["vintgar", "vintgar gorge"] },
  { name: "Soča Valley", country_code: "SI", region: "Goriška", place_type: "NATURAL_FEATURE", keywords: ["soča", "soca", "soča valley"] },
  { name: "Piran", country_code: "SI", region: "Slovenian Istria", place_type: "COASTAL_AREA", keywords: ["piran", "pirano"] },
  { name: "Predjama Castle", country_code: "SI", region: "Inner Carniola", place_type: "HISTORICAL_SITE", keywords: ["predjama", "predjama castle"] },
  { name: "Postojna Cave", country_code: "SI", region: "Inner Carniola", place_type: "NATURAL_FEATURE", keywords: ["postojna", "postojna cave"] },
  // North Macedonia
  { name: "Ohrid", country_code: "MK", region: "Ohrid", place_type: "CITY_OR_TOWN", keywords: ["ohrid", "lake ohrid", "ohridsko jezero"] },
  { name: "Skopje", country_code: "MK", region: "Skopje", place_type: "CITY_OR_TOWN", keywords: ["skopje"] },
  { name: "Matka Canyon", country_code: "MK", region: "Skopje", place_type: "NATURAL_FEATURE", keywords: ["matka", "matka canyon", "matka lake"] },
  { name: "Mavrovo National Park", country_code: "MK", region: "Western Macedonia", place_type: "NATIONAL_PARK", keywords: ["mavrovo"] },
  // Albania
  { name: "Berat", country_code: "AL", region: "Berat County", place_type: "HISTORICAL_SITE", keywords: ["berat", "city of a thousand windows"] },
  { name: "Gjirokastër", country_code: "AL", region: "Gjirokastër County", place_type: "HISTORICAL_SITE", keywords: ["gjirokastër", "gjirokaster", "gjirokastra"] },
  { name: "Theth", country_code: "AL", region: "Shkodër County", place_type: "VILLAGE", keywords: ["theth", "theth valley", "accursed mountains", "prokletije"] },
  { name: "Albanian Riviera", country_code: "AL", region: "Vlorë County", place_type: "COASTAL_AREA", keywords: ["albanian riviera", "dhërmi", "dhermi", "himara", "himara", "ksamil", "sarandë", "saranda"] },
  { name: "Valbona Valley", country_code: "AL", region: "Dibër County", place_type: "NATIONAL_PARK", keywords: ["valbona", "valbona valley"] },
  { name: "Butrint", country_code: "AL", region: "Vlorë County", place_type: "HISTORICAL_SITE", keywords: ["butrint"] },
  // Serbia
  { name: "Belgrade", country_code: "RS", region: "Belgrade", place_type: "CITY_OR_TOWN", keywords: ["belgrade", "beograd"] },
  { name: "Novi Sad", country_code: "RS", region: "Vojvodina", place_type: "CITY_OR_TOWN", keywords: ["novi sad"] },
  { name: "Đavolja Varoš", country_code: "RS", region: "South and East Serbia", place_type: "NATURAL_FEATURE", keywords: ["đavolja varoš", "djavolja varos", "devil's town"] },
  { name: "Uvac Canyon", country_code: "RS", region: "Raška District", place_type: "NATURAL_FEATURE", keywords: ["uvac", "uvac canyon"] },
  { name: "Tara National Park", country_code: "RS", region: "Western Serbia", place_type: "NATIONAL_PARK", keywords: ["tara national park", "tara mountain"] },
  // Kosovo
  { name: "Prizren", country_code: "XK", region: "Prizren District", place_type: "CITY_OR_TOWN", keywords: ["prizren"] },
  { name: "Pristina", country_code: "XK", region: "Pristina District", place_type: "CITY_OR_TOWN", keywords: ["pristina", "prishtina"] },
  // Greece (adjacent Balkans)
  { name: "Meteora", country_code: "GR", region: "Thessaly", place_type: "HISTORICAL_SITE", keywords: ["meteora", "meteora monasteries"] },
  { name: "Thessaloniki", country_code: "GR", region: "Central Macedonia", place_type: "CITY_OR_TOWN", keywords: ["thessaloniki", "salonica"] },
];

const COUNTRY_CODES: Record<string, string> = {
  croatia: "HR", hrvatska: "HR",
  "bosnia and herzegovina": "BA", bosnia: "BA", herzegovina: "BA", "bih": "BA",
  montenegro: "ME", crna_gora: "ME",
  slovenia: "SI", slovenija: "SI",
  "north macedonia": "MK", macedonia: "MK", makedonija: "MK",
  albania: "AL", shqipëria: "AL",
  serbia: "RS", srbija: "RS",
  kosovo: "XK",
  greece: "GR",
  bulgaria: "BG", bugarska: "BG",
  romania: "RO", rumunjska: "RO",
};

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[đ]/g, "d")
    .replace(/[šš]/g, "s")
    .replace(/[žž]/g, "z")
    .replace(/[ë]/g, "e")
    .replace(/[ğ]/g, "g")
    .trim();
}

interface MatchResult {
  place: KnownPlace;
  score: number;
}

function findBestMatch(text: string): MatchResult | null {
  const normalized = normalizeForMatch(text);
  let bestMatch: MatchResult | null = null;

  for (const place of BALKAN_PLACES) {
    for (const keyword of place.keywords) {
      const normalizedKeyword = normalizeForMatch(keyword);
      if (normalized.includes(normalizedKeyword)) {
        // Exact whole-word match scores higher than partial
        const wordBoundaryPattern = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
        const isWholeWord = wordBoundaryPattern.test(normalized);
        // Longer keyword = more specific = higher confidence
        const score = isWholeWord
          ? 0.6 + Math.min(normalizedKeyword.length / 30, 0.3)
          : 0.4 + Math.min(normalizedKeyword.length / 40, 0.15);
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { place, score };
        }
      }
    }
  }

  return bestMatch;
}

function detectCountryFromText(text: string): string | null {
  const normalized = normalizeForMatch(text);
  for (const [keyword, code] of Object.entries(COUNTRY_CODES)) {
    if (normalized.includes(normalizeForMatch(keyword))) return code;
  }
  return null;
}

/**
 * Resolves a CaptureAdapterResult to the best available place information.
 * Never invents place data — returns UNRESOLVED when no confident match is found.
 */
export function resolvePlace(adapterResult: CaptureAdapterResult): PlaceResolutionResult {
  const searchText = [
    adapterResult.raw_location_hint,
    adapterResult.raw_title,
    adapterResult.raw_description,
    adapterResult.capture_context,
  ]
    .filter(Boolean)
    .join(" ");

  if (!searchText.trim()) {
    return {
      place_name: null,
      country_code: null,
      region: null,
      latitude: null,
      longitude: null,
      place_type: null,
      resolution_status: "UNRESOLVED",
      resolution_confidence: 0,
      resolution_method: "no_text_available",
    };
  }

  const match = findBestMatch(searchText);
  const countryHint = detectCountryFromText(searchText);

  if (!match) {
    return {
      place_name: null,
      country_code: countryHint,
      region: null,
      latitude: null,
      longitude: null,
      place_type: null,
      resolution_status: countryHint ? "NEEDS_CONFIRMATION" : "UNRESOLVED",
      resolution_confidence: countryHint ? 0.25 : 0,
      resolution_method: countryHint ? "country_hint_only" : "no_match",
    };
  }

  // Boost confidence if the adapter already had high confidence
  const combinedConfidence = Math.min(match.score + (adapterResult.confidence * 0.3), 1.0);

  let status: PlaceResolutionResult["resolution_status"];
  if (combinedConfidence >= 0.8) {
    status = "RESOLVED_HIGH_CONFIDENCE";
  } else if (combinedConfidence >= 0.4) {
    status = "NEEDS_CONFIRMATION";
  } else {
    status = "UNRESOLVED";
  }

  return {
    place_name: match.place.name,
    country_code: match.place.country_code,
    region: match.place.region,
    latitude: null,  // No geocoding API in Phase 26
    longitude: null,
    place_type: match.place.place_type,
    resolution_status: status,
    resolution_confidence: combinedConfidence,
    resolution_method: "keyword_match",
  };
}
