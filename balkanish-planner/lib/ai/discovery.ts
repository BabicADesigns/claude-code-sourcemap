import OpenAI from "openai";
import { z } from "zod";
import {
  COUNTRIES,
  ITINERARY_FOCUS_LABELS,
  PLANNER_STYLE_LABELS,
  type Country,
  type ItineraryFocus,
  type PlannerStyle,
  type DestinationCandidate,
  type DiscoveryQuery,
} from "@/lib/types";
import { verifyDestinationCandidate, resolveAnchorCoordinates } from "@/lib/ai/verification";
import { registerDiscoveredDestination } from "@/lib/data/discovered-destinations";
import type { LatLng } from "@/lib/geo";

/**
 * Layer B — AI discovery (docs/ai-discovery-architecture.md Stage 2). Proposes real places the
 * curated database (Layer A) doesn't cover yet. Every suggestion is run through the deterministic
 * verification layer before it's allowed anywhere near a client; the AI never supplies its own
 * confidence number, and a rejected suggestion never leaves this module.
 */

/** Below this coverage score (GroundedItinerary.coverageScore), the curated pool is too thin and discovery runs automatically, independent of any free-text query. */
export const DISCOVERY_COVERAGE_THRESHOLD = 0.6;

/** Max AI-suggested destinations surfaced per itinerary — kept small; this is a supplement, not a second itinerary. */
const MAX_CANDIDATES = 4;

export interface DiscoveryContext {
  plannerStyle: PlannerStyle;
  focus: ItineraryFocus;
  country: Country | null;
  /** Parsed free-text discovery query (requirement #7), or null when discovery is triggered only by thin coverage. */
  query: DiscoveryQuery | null;
  /** Curated stop names already chosen for this itinerary — given to the AI as context to avoid redundant suggestions. */
  existingStopNames: string[];
}

const DISCOVERY_SYSTEM_PROMPT = `You are the Balkanish Planner's destination scout — Layer B of a two-layer recommendation system. Layer A is a curated, editorially-vetted database of real destinations; you propose ADDITIONAL real places that aren't in that database yet, to fill gaps Layer A can't cover.

Rules, strictly enforced:
- Only propose real, named places that actually exist in Croatia, Bosnia and Herzegovina, Montenegro, Serbia, or Slovenia. Never invent a place.
- Don't repropose anything in the "already_curated_in_this_trip" list you're given.
- Give real, approximate latitude/longitude for each place — your honest best estimate for that town, village, or region, not a placeholder.
- Never invent statistics, scores, or a confidence number — verification and scoring happen elsewhere, not by you.
- "rationale" is one honest, narrative sentence on why this place fits the request — frame it as worth considering, never as a verified fact.
- Propose at most ${MAX_CANDIDATES} places. If nothing real and relevant comes to mind, return an empty array.

Respond with a single JSON object only, no markdown fences, no commentary, matching exactly:
{ "destinations": [{ "name": string, "region": string, "country": string, "latitude": number, "longitude": number, "rationale": string, "matched_focus": string[] }] }`;

const discoverySuggestionSchema = z.object({
  destinations: z
    .array(
      z.object({
        name: z.string(),
        region: z.string(),
        country: z.enum(COUNTRIES as [Country, ...Country[]]),
        latitude: z.number(),
        longitude: z.number(),
        rationale: z.string(),
        matched_focus: z
          .array(z.enum(Object.keys(ITINERARY_FOCUS_LABELS) as [ItineraryFocus, ...ItineraryFocus[]]))
          .default([]),
      })
    )
    .max(MAX_CANDIDATES),
});

function resolveDiscoveryAnchor(query: DiscoveryQuery | null): LatLng | null {
  if (!query || query.intent === "route_between" || !query.anchor_place) return null;
  return resolveAnchorCoordinates(query.anchor_place);
}

function buildDiscoveryBrief(context: DiscoveryContext): string {
  return JSON.stringify(
    {
      travel_style: PLANNER_STYLE_LABELS[context.plannerStyle],
      focus: ITINERARY_FOCUS_LABELS[context.focus],
      country: context.country ?? "any Balkan country in scope",
      query: context.query
        ? {
            raw: context.query.raw,
            intent: context.query.intent,
            anchor_place: context.query.anchor_place,
            route_to_place: context.query.route_to_place,
          }
        : null,
      already_curated_in_this_trip: context.existingStopNames,
    },
    null,
    2
  );
}

/**
 * Calls the AI discovery layer and verifies every suggestion before returning it. Never throws —
 * any failure (network, malformed response, missing API key) falls back to an empty array, so a
 * caller can always render the curated itinerary with zero AI-suggested destinations.
 */
export async function discoverDestinationCandidates(context: DiscoveryContext): Promise<DestinationCandidate[]> {
  if (!process.env.OPENAI_API_KEY) return [];

  try {
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.4,
      messages: [
        { role: "system", content: DISCOVERY_SYSTEM_PROMPT },
        { role: "user", content: buildDiscoveryBrief(context) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return [];

    const parsed = discoverySuggestionSchema.parse(JSON.parse(raw));
    const anchor = resolveDiscoveryAnchor(context.query);

    const verified: DestinationCandidate[] = [];
    for (const suggestion of parsed.destinations) {
      const result = verifyDestinationCandidate(suggestion, anchor);
      if (result.status === "rejected") continue;
      verified.push({
        name: suggestion.name,
        region: suggestion.region,
        country: suggestion.country,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        source: "ai_suggested",
        confidence_score: result.confidence,
        verification_status: result.status,
        rationale: suggestion.rationale,
        matched_focus: suggestion.matched_focus.length > 0 ? suggestion.matched_focus : [context.focus],
        moderation_status: "pending",
      });
    }

    // Each verified suggestion is also upserted into the shared registry (migration 0012) so an
    // editor can review it once, not once per request — see docs/ai-expansion-engine-architecture.md.
    // Registration runs after verification (never for a rejected suggestion) and never throws.
    const candidates = await Promise.all(
      verified.map(async (candidate) => ({
        ...candidate,
        moderation_status: await registerDiscoveredDestination(candidate),
      }))
    );
    return candidates;
  } catch (error) {
    console.error("AI discovery layer failed; returning no AI-suggested destinations.", error);
    return [];
  }
}
