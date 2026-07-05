"use client";

import type { LocalPhrase } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";

export function LocalPhraseChip({ phrase }: { phrase: LocalPhrase }) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="font-display text-base text-foreground">{phrase.phrase}</p>
      {phrase.transliteration && (
        <p className="font-sans text-xs text-muted-foreground">
          <span className="mr-1 opacity-60">{t("cultureIntel", "phrase.transliterationLabel")}:</span>
          {phrase.transliteration}
        </p>
      )}
      <p className="font-sans text-xs text-foreground/70">
        <span className="mr-1 opacity-60">{t("cultureIntel", "phrase.translationLabel")}:</span>
        {phrase.translation}
      </p>
      {phrase.pronunciation_tip && (
        <p className="mt-0.5 font-serif text-xs italic text-foreground/50">
          {t("cultureIntel", "phrase.pronunciationLabel")}: {phrase.pronunciation_tip}
        </p>
      )}
    </div>
  );
}
