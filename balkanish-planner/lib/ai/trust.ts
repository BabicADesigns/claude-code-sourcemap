import type { DestinationCandidate, TrustTier } from "@/lib/types";

/**
 * Derives the user-facing trust tier for a destination candidate. Curated destinations
 * (Layer A) never flow through here — they're plain `Destination` rows, not candidates.
 * This only needs to split Layer B's two real states: an editor has approved the
 * candidate's `discovered_destinations` registry row ("community_verified") or it's still
 * awaiting review ("ai_suggested"). See docs/ai-expansion-engine-architecture.md "Trust model".
 */
export function deriveTrustTier(
  candidate: Pick<DestinationCandidate, "source" | "moderation_status">
): TrustTier {
  if (candidate.source === "curated") return "verified";
  return candidate.moderation_status === "approved" ? "community_verified" : "ai_suggested";
}

/** Human-readable badge label for a trust tier — shown on destination page, planner, PDF, and saved trips. */
export function gemBadgeLabel(tier: TrustTier): string {
  if (tier === "verified") return "Verified Hidden Gem";
  if (tier === "community_verified") return "Community Hidden Gem";
  return "AI Suggested Hidden Gem";
}
