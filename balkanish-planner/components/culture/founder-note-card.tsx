"use client";

import type { FounderNote } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Displays a Founder Note.
 * IMPORTANT: This component only renders notes from the editorial data layer.
 * The AI may surface a Founder Note but may NEVER invent one.
 */
export function FounderNoteCard({ note }: { note: FounderNote }) {
  const { t } = useLocale();

  return (
    <div className="relative rounded-xl border border-sage/30 bg-sage/5 p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-0.5 w-6 bg-sage-dark/40" />
        <span className="font-sans text-xs uppercase tracking-widest text-sage-dark">
          {t("cultureIntel", "founderNoteLabel")}
        </span>
      </div>
      <p className="font-display text-lg leading-snug text-sage-dark sm:text-xl">{note.headline}</p>
      <p className="mt-2 font-serif text-sm leading-relaxed text-foreground/80">{note.body}</p>
      {note.attribution && (
        <p className="mt-3 font-serif text-sm italic text-foreground/50">{note.attribution}</p>
      )}
    </div>
  );
}
