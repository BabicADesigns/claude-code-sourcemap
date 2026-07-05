"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { PartnerTrustLevel } from "@/lib/types";

const BADGE_CLASS: Record<PartnerTrustLevel, string> = {
  founder_pick: "bg-terracotta/10 text-terracotta border-terracotta/20",
  verified_local: "bg-sage-dark/10 text-sage-dark border-sage-dark/20",
  community_favourite: "bg-muted text-muted-foreground border-border",
};

export function TrustBadge({
  level,
  showHint = false,
  className,
}: {
  level: PartnerTrustLevel;
  showHint?: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const label = t("partners", `trust_levels.${level}`);
  const hint = showHint ? t("partners", `trust_hints.${level}`) : undefined;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs uppercase tracking-widest",
        BADGE_CLASS[level],
        className
      )}
      title={hint}
    >
      {label}
    </span>
  );
}
