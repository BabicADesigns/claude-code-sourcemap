"use client";

import type { CulturalInsight, FounderNote, LocalPhrase } from "@/lib/types";
import {
  CULTURAL_INSIGHT_CATEGORY_LABELS,
  CULTURAL_INSIGHT_SCOPE_LABELS,
  CULTURAL_CONFIDENCE_LABELS,
  CULTURAL_SENSITIVITY_LABELS,
  LOCAL_PHRASE_CATEGORY_LABELS,
  FOUNDER_NOTE_SCOPE_LABELS,
} from "@/lib/types";

const CONFIDENCE_BADGE: Record<CulturalInsight["confidence"], string> = {
  EDITORIAL_VERIFIED: "bg-sage-dark/10 text-sage-dark",
  LOCAL_CONTEXT: "bg-sage/20 text-sage-dark",
  GENERAL_GUIDANCE: "bg-muted/40 text-muted-foreground",
  VERIFY_CURRENT_CONTEXT: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
};

const SENSITIVITY_BADGE: Record<CulturalInsight["sensitivity"], string> = {
  NONE: "",
  NEEDS_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  HISTORICALLY_SENSITIVE: "bg-orange-50 text-orange-700 border-orange-200",
  POLITICALLY_SENSITIVE: "bg-rose/10 text-rose border-rose/30",
};

interface CulturalPanelProps {
  insights: CulturalInsight[];
  phrases: LocalPhrase[];
  founderNotes: FounderNote[];
}

export function CulturalPanel({ insights, phrases, founderNotes }: CulturalPanelProps) {
  return (
    <div className="flex flex-col gap-12">
      {/* Insights */}
      <section>
        <h2 className="mb-4 font-display text-2xl text-sage-dark">
          Cultural Insights ({insights.length})
        </h2>
        {insights.length === 0 ? (
          <p className="font-serif text-foreground/80">No cultural insights found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                      {CULTURAL_INSIGHT_SCOPE_LABELS[insight.scope]} — {insight.scope_slug}
                      {" · "}
                      {CULTURAL_INSIGHT_CATEGORY_LABELS[insight.category]}
                    </p>
                    <h3 className="mt-1 font-display text-xl text-sage-dark">{insight.headline}</h3>
                    <p className="mt-1 font-serif text-sm text-foreground/80">{insight.body}</p>
                    {insight.nuance && (
                      <p className="mt-1 font-serif text-xs italic text-foreground/60">{insight.nuance}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs ${CONFIDENCE_BADGE[insight.confidence]}`}>
                      {CULTURAL_CONFIDENCE_LABELS[insight.confidence]}
                    </span>
                    {insight.sensitivity !== "NONE" && (
                      <span className={`rounded-full border px-2 py-0.5 font-sans text-xs ${SENSITIVITY_BADGE[insight.sensitivity]}`}>
                        {CULTURAL_SENSITIVITY_LABELS[insight.sensitivity]}
                      </span>
                    )}
                    <div className="flex gap-1.5">
                      {insight.demo_only && (
                        <span className="rounded-full bg-muted px-2 py-0.5 font-sans text-xs text-muted-foreground">
                          Demo only
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 font-sans text-xs ${insight.active ? "bg-sage/15 text-sage-dark" : "bg-muted text-muted-foreground"}`}>
                        {insight.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Founder Notes */}
      <section>
        <h2 className="mb-4 font-display text-2xl text-sage-dark">
          Founder Notes ({founderNotes.length})
        </h2>
        {founderNotes.length === 0 ? (
          <p className="font-serif text-foreground/80">No founder notes found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {founderNotes.map((note) => (
              <div
                key={note.id}
                className="flex flex-col gap-2 rounded-xl border border-sage/30 bg-sage/5 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                      {FOUNDER_NOTE_SCOPE_LABELS[note.scope]}
                      {note.scope_slug ? ` — ${note.scope_slug}` : ""}
                    </p>
                    <h3 className="mt-1 font-display text-xl text-sage-dark">{note.headline}</h3>
                    <p className="mt-1 font-serif text-sm text-foreground/80">{note.body}</p>
                    {note.attribution && (
                      <p className="mt-1 font-serif text-xs italic text-foreground/60">{note.attribution}</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {note.demo_only && (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-sans text-xs text-muted-foreground">
                        Demo only
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 font-sans text-xs ${note.active ? "bg-sage/15 text-sage-dark" : "bg-muted text-muted-foreground"}`}>
                      {note.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Local Phrases */}
      <section>
        <h2 className="mb-4 font-display text-2xl text-sage-dark">
          Local Phrases ({phrases.length})
        </h2>
        {phrases.length === 0 ? (
          <p className="font-serif text-foreground/80">No local phrases found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {phrases.map((phrase) => (
              <div
                key={phrase.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                    {phrase.language_name} ({phrase.language_code.toUpperCase()})
                    {" · "}
                    {LOCAL_PHRASE_CATEGORY_LABELS[phrase.category]}
                    {" · "}
                    {phrase.applicable_country_codes.join(", ")}
                  </p>
                  <p className="mt-1 font-display text-lg text-foreground">{phrase.phrase}</p>
                  {phrase.transliteration && (
                    <p className="font-sans text-xs text-muted-foreground">
                      Sounds like: {phrase.transliteration}
                    </p>
                  )}
                  <p className="font-sans text-sm text-foreground/80">{phrase.translation}</p>
                  {phrase.pronunciation_tip && (
                    <p className="mt-0.5 font-serif text-xs italic text-foreground/60">
                      {phrase.pronunciation_tip}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {phrase.demo_only && (
                    <span className="rounded-full bg-muted px-2 py-0.5 font-sans text-xs text-muted-foreground">
                      Demo only
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 font-sans text-xs ${phrase.active ? "bg-sage/15 text-sage-dark" : "bg-muted text-muted-foreground"}`}>
                    {phrase.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
