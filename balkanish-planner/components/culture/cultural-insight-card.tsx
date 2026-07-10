"use client";

import type { CulturalInsight, CulturalInsightCategory } from "@/lib/types";
import { CULTURAL_INSIGHT_CATEGORY_LABELS } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";

const CATEGORY_ICON: Partial<Record<CulturalInsightCategory, string>> = {
  COFFEE_CULTURE: "☕",
  FOOD_CULTURE: "🍽",
  TIPPING_ETIQUETTE: "💶",
  DRESS_CODE: "👗",
  HOSPITALITY_CUSTOMS: "🤝",
  SOCIAL_CUSTOM: "💬",
  LOCAL_RHYTHM: "🕐",
  NOISE_AND_PACE: "🎶",
  RELIGIOUS_OBSERVANCE: "🕌",
  PHOTOGRAPHY_ETIQUETTE: "📷",
  MARKET_CULTURE: "🛍",
  MONEY_AND_PAYMENT: "💳",
  SAFETY_AWARENESS: "🔒",
  LANGUAGE_TIPS: "💬",
  FESTIVAL_AND_CELEBRATION: "🎉",
  SEASONAL_RHYTHM: "🌿",
  DIGITAL_AND_CONNECTIVITY: "📶",
  ENVIRONMENTAL_NORMS: "♻️",
  LGBTQ_CONTEXT: "🏳️‍🌈",
  ACCESSIBILITY_CONTEXT: "♿",
  FAMILY_AND_COMMUNITY: "👨‍👩‍👧",
  GETTING_AROUND_LOCALLY: "🚌",
  BARGAINING_NORMS: "🤝",
};

const CONFIDENCE_STYLE: Record<CulturalInsight["confidence"], string> = {
  EDITORIAL_VERIFIED: "text-sage-dark bg-sage-dark/10",
  LOCAL_CONTEXT: "text-sage bg-sage/15",
  GENERAL_GUIDANCE: "text-muted-foreground bg-muted/40",
  VERIFY_CURRENT_CONTEXT: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20",
};

export function CulturalInsightCard({ insight }: { insight: CulturalInsight }) {
  const { t } = useLocale();
  const icon = CATEGORY_ICON[insight.category] ?? "🌍";
  const categoryLabel = CULTURAL_INSIGHT_CATEGORY_LABELS[insight.category];
  const confidenceLabel = t("cultureIntel", `confidence.${insight.confidence}`);
  const confidenceStyle = CONFIDENCE_STYLE[insight.confidence];

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-lg">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
            {categoryLabel}
          </span>
          {insight.confidence !== "GENERAL_GUIDANCE" && (
            <span className={`rounded-full px-2 py-0.5 font-sans text-xs ${confidenceStyle}`}>
              {confidenceLabel}
            </span>
          )}
        </div>
        <p className="font-display text-base text-foreground sm:text-lg">{insight.headline}</p>
        <p className="mt-1 font-serif text-sm leading-relaxed text-foreground/80">{insight.body}</p>
        {insight.nuance && (
          <p className="mt-2 font-serif text-xs italic leading-relaxed text-foreground/60">
            {insight.nuance}
          </p>
        )}
        {insight.confidence === "VERIFY_CURRENT_CONTEXT" && (
          <p className="mt-2 font-sans text-xs text-amber-700 dark:text-amber-400">
            {t("cultureIntel", "verifyCurrentContext")}
          </p>
        )}
      </div>
    </div>
  );
}
