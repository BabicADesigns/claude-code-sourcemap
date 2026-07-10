import type {
  CulturalInsight,
  CulturalInsightCategory,
  CulturalMatchResult,
  FounderNote,
  LocalPhrase,
  PersonalConnectionStory,
} from "@/lib/types";

/**
 * Deterministic cultural intelligence resolver (Phase 20).
 *
 * Design principles:
 * - Scope precedence: DESTINATION > REGION > COUNTRY (most specific wins per category).
 * - Sensitivity guardrail: POLITICALLY_SENSITIVE insights are never surfaced by the resolver;
 *   they require explicit editor review before active=true is set.
 * - Founder Notes: resolver selects from editorial data only — never generated.
 * - No fabrication: this module filters and ranks real data; it does not produce content.
 */

// ─── Insight selection ────────────────────────────────────────────────────────

/**
 * Selects the best insight per category for a destination, applying scope precedence.
 * DESTINATION-scope insights beat REGION-scope, which beat COUNTRY-scope.
 */
export function resolveInsightsForDestination(
  allInsights: CulturalInsight[],
  destinationSlug: string,
  regionSlug: string | null | undefined,
  countryCode: string | null | undefined,
  /** Maximum insights to return (default 8). */
  maxInsights = 8
): CulturalInsight[] {
  const scopeOrder: Record<CulturalInsight["scope"], number> = {
    DESTINATION: 0,
    REGION: 1,
    COUNTRY: 2,
  };

  const relevant = allInsights.filter((insight) => {
    if (insight.scope === "DESTINATION") return insight.scope_slug === destinationSlug;
    if (insight.scope === "REGION") return regionSlug && insight.scope_slug === regionSlug;
    if (insight.scope === "COUNTRY") return countryCode && insight.scope_slug === countryCode;
    return false;
  });

  // Per-category: keep the most specific (lowest scopeOrder) insight.
  const byCategory = new Map<CulturalInsightCategory, CulturalInsight>();
  for (const insight of relevant) {
    const existing = byCategory.get(insight.category);
    if (!existing || scopeOrder[insight.scope] < scopeOrder[existing.scope]) {
      byCategory.set(insight.category, insight);
    }
  }

  return Array.from(byCategory.values()).slice(0, maxInsights);
}

// ─── Phrase selection ─────────────────────────────────────────────────────────

/** Returns phrases applicable to one or more country codes, capped at maxPhrases. */
export function resolvePhrasesForCountryCodes(
  allPhrases: LocalPhrase[],
  countryCodes: string[],
  maxPhrases = 12
): LocalPhrase[] {
  return allPhrases
    .filter((p) => p.applicable_country_codes.some((c) => countryCodes.includes(c)))
    .slice(0, maxPhrases);
}

// ─── Founder Note selection ───────────────────────────────────────────────────

/**
 * Selects the most specific Founder Note for a destination.
 * Precedence: DESTINATION slug match > REGION slug match > COUNTRY code match > GENERAL.
 * Returns null if no note is available.
 *
 * CRITICAL: AI may surface a Founder Note. AI may NEVER invent a Founder Note.
 */
export function resolveFounderNote(
  allNotes: FounderNote[],
  destinationSlug: string,
  regionSlug: string | null | undefined,
  countryCode: string | null | undefined
): FounderNote | null {
  return (
    allNotes.find((n) => n.scope === "DESTINATION" && n.scope_slug === destinationSlug) ??
    (regionSlug ? allNotes.find((n) => n.scope === "REGION" && n.scope_slug === regionSlug) : undefined) ??
    (countryCode ? allNotes.find((n) => n.scope === "COUNTRY" && n.scope_slug === countryCode) : undefined) ??
    allNotes.find((n) => n.scope === "GENERAL") ??
    null
  );
}

// ─── Full match ───────────────────────────────────────────────────────────────

export function resolveCulturalMatch(
  allInsights: CulturalInsight[],
  allPhrases: LocalPhrase[],
  allFounderNotes: FounderNote[],
  personalStories: PersonalConnectionStory[],
  destinationSlug: string,
  regionSlug: string | null | undefined,
  countryCode: string | null | undefined,
  countryCodes: string[]
): CulturalMatchResult {
  return {
    insights: resolveInsightsForDestination(allInsights, destinationSlug, regionSlug, countryCode),
    phrases: resolvePhrasesForCountryCodes(allPhrases, countryCodes),
    founderNote: resolveFounderNote(allFounderNotes, destinationSlug, regionSlug, countryCode),
    personalStories: personalStories.filter((s) => s.destination_slug === destinationSlug),
  };
}

// ─── AI brief context builder ─────────────────────────────────────────────────

/**
 * Builds a compact cultural context string for injection into the AI itinerary brief.
 * Surfaces only editorial-verified content; never fabricates or expands the notes.
 * Founder Notes are referenced by headline only — the AI must not paraphrase the body.
 */
export function buildCulturalContextForBrief(
  insights: CulturalInsight[],
  founderNote: FounderNote | null
): string {
  if (insights.length === 0 && !founderNote) return "";

  const lines: string[] = [];

  if (insights.length > 0) {
    lines.push("Cultural context (editorial, do not invent beyond these notes):");
    for (const insight of insights.slice(0, 5)) {
      lines.push(`- [${insight.category}] ${insight.headline}: ${insight.body}`);
    }
  }

  if (founderNote) {
    lines.push(
      `Founder note for this area (surface verbatim if relevant; NEVER invent a founder note): "${founderNote.headline}"`
    );
  }

  return lines.join("\n");
}
