"use client";

import type { CulturalMatchResult } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CulturalInsightCard } from "@/components/culture/cultural-insight-card";
import { LocalPhraseChip } from "@/components/culture/local-phrase-chip";
import { FounderNoteCard } from "@/components/culture/founder-note-card";

interface CulturalSectionProps {
  match: CulturalMatchResult;
  /** Optional heading override — defaults to i18n sectionTitle. */
  heading?: string;
}

export function CulturalSection({ match, heading }: CulturalSectionProps) {
  const { t } = useLocale();
  const hasContent =
    match.insights.length > 0 ||
    match.phrases.length > 0 ||
    match.founderNote !== null ||
    match.personalStories.length > 0;

  if (!hasContent) return null;

  return (
    <section className="mt-10 flex flex-col gap-8">
      <div>
        <p className="font-sans text-xs uppercase tracking-widest text-sage-dark">
          {heading ?? t("cultureIntel", "sectionTitle")}
        </p>
        <p className="mt-1 font-serif text-sm text-foreground/60">
          {t("cultureIntel", "estimateDisclaimer")}
        </p>
      </div>

      {match.founderNote && <FounderNoteCard note={match.founderNote} />}

      {match.insights.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-lg text-foreground sm:text-xl">
            {t("cultureIntel", "insightsHeading")}
          </h3>
          <div className="flex flex-col gap-3">
            {match.insights.map((insight) => (
              <CulturalInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {match.phrases.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-lg text-foreground sm:text-xl">
            {t("cultureIntel", "phrasesHeading")}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {match.phrases.map((phrase) => (
              <LocalPhraseChip key={phrase.id} phrase={phrase} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
