"use client";

import { useState, useTransition } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { buildMemorySummary, getStrengthLabel } from "@/lib/ai/travel-memory";
import { confirmMemorySignal, rejectMemorySignal, resetLearnedMemory } from "@/lib/actions/travel-memory";
import { MEMORY_PREFERENCE_DOMAIN_LABELS, type TravelMemorySignal } from "@/lib/types";

interface SignalCardProps {
  signal: TravelMemorySignal;
  showActions?: boolean;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
}

function SignalCard({ signal, showActions = false, onConfirm, onReject }: SignalCardProps) {
  const { t } = useLocale();
  const label = getStrengthLabel(signal);
  const domainLabel = MEMORY_PREFERENCE_DOMAIN_LABELS[signal.domain] ?? signal.domain;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3 text-sm">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-muted-foreground">{domainLabel}</span>
          <span className="text-xs text-muted-foreground/60">·</span>
          <span className="text-xs text-muted-foreground/60">{t("travelMemory", `strengthLabels.${label}`)}</span>
        </div>
        <p className="font-medium text-foreground leading-snug">
          <span className="text-muted-foreground">{t("travelMemory", `directions.${signal.direction}`)}: </span>
          {signal.subject}
        </p>
        {signal.value && (
          <p className="text-xs text-muted-foreground mt-0.5">{signal.value}</p>
        )}
      </div>
      {showActions && (
        <div className="flex gap-1.5 shrink-0 mt-0.5">
          <button
            onClick={() => onConfirm?.(signal.id)}
            aria-label={t("travelMemory", "actions.confirmLabel")}
            className="rounded px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {t("travelMemory", "actions.confirm")}
          </button>
          <button
            onClick={() => onReject?.(signal.id)}
            aria-label={t("travelMemory", "actions.rejectLabel")}
            className="rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          >
            {t("travelMemory", "actions.reject")}
          </button>
        </div>
      )}
    </div>
  );
}

export function TravelMemoryPanel({ initialSignals }: { initialSignals: TravelMemorySignal[] }) {
  const { t } = useLocale();
  const [signals, setSignals] = useState(initialSignals);
  const [isPending, startTransition] = useTransition();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const summary = buildMemorySummary(signals);

  function handleConfirm(id: string) {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, confirmation_status: "CONFIRMED" as const } : s))
    );
    startTransition(async () => {
      await confirmMemorySignal(id);
    });
  }

  function handleReject(id: string) {
    setSignals((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      await rejectMemorySignal(id);
    });
  }

  function handleReset() {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    setSignals((prev) =>
      prev.filter(
        (s) => s.confirmation_status === "CONFIRMED" || s.source === "PROFILE_CONFIRMATION"
      )
    );
    setShowResetConfirm(false);
    startTransition(async () => {
      await resetLearnedMemory();
    });
  }

  if (summary.total === 0) {
    return (
      <section className="mt-10 pt-8 border-t border-border/60">
        <h2 className="text-xl font-serif font-semibold mb-1">{t("travelMemory", "sectionTitle")}</h2>
        <p className="text-sm text-muted-foreground mb-6">{t("travelMemory", "sectionSubtitle")}</p>
        <p className="text-sm text-muted-foreground">{t("travelMemory", "noMemoryYet")}</p>
      </section>
    );
  }

  const noticedSignals = [...summary.strong, ...summary.noticed];

  return (
    <section className="mt-10 pt-8 border-t border-border/60">
      <h2 className="text-xl font-serif font-semibold mb-1">{t("travelMemory", "sectionTitle")}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t("travelMemory", "sectionSubtitle")}</p>

      {summary.confirmed.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t("travelMemory", "confirmedTitle")}
          </h3>
          <div className="space-y-2">
            {summary.confirmed.map((s) => (
              <SignalCard key={s.id} signal={s} showActions={false} />
            ))}
          </div>
        </div>
      )}

      {noticedSignals.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {t("travelMemory", "noticedTitle")}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">{t("travelMemory", "noticedHint")}</p>
          <div className="space-y-2">
            {noticedSignals.map((s) => (
              <SignalCard
                key={s.id}
                signal={s}
                showActions
                onConfirm={handleConfirm}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {summary.learning.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {t("travelMemory", "stillLearningTitle")}
          </h3>
          <div className="space-y-2 opacity-60">
            {summary.learning.map((s) => (
              <SignalCard key={s.id} signal={s} showActions={false} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mb-8 max-w-prose">{t("travelMemory", "privacyNote")}</p>

      <div className="rounded-lg border border-border/60 p-4">
        <h3 className="text-sm font-semibold mb-1">{t("travelMemory", "resetTitle")}</h3>
        <p className="text-xs text-muted-foreground mb-3">{t("travelMemory", "resetDescription")}</p>
        {showResetConfirm && (
          <p className="text-xs font-medium text-destructive mb-2">{t("travelMemory", "resetConfirm")}</p>
        )}
        <button
          onClick={handleReset}
          disabled={isPending}
          className="rounded px-3 py-1.5 text-xs font-medium border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
        >
          {showResetConfirm ? t("travelMemory", "resetConfirm") : t("travelMemory", "resetButton")}
        </button>
        {showResetConfirm && (
          <button
            onClick={() => setShowResetConfirm(false)}
            className="ml-2 rounded px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}
