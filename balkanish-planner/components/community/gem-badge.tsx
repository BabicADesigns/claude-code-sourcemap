import { cn } from "@/lib/utils";
import { gemBadgeLabel } from "@/lib/ai/trust";
import type { TrustTier } from "@/lib/types";

const TIER_CLASSES: Record<TrustTier, string> = {
  verified: "bg-secondary/15 text-sage-dark border-secondary/40",
  community_verified: "bg-accent/10 text-rose border-accent/30",
  ai_suggested: "bg-muted text-muted-foreground border-border",
};

/**
 * Consistent trust-tier badge shown on destination page, planner, saved trips.
 * Uses gemBadgeLabel() for the human-readable string — one source of truth for that copy.
 */
export function GemBadge({ tier, className }: { tier: TrustTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-widest",
        TIER_CLASSES[tier],
        className
      )}
    >
      {gemBadgeLabel(tier)}
    </span>
  );
}
