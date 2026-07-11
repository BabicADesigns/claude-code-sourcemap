"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ActivationState } from "@/lib/activation-state";

/**
 * Phase 31 — Contextual first-journey guidance for the My Trips workspace.
 *
 * Rendered inline before DashboardSections when no trips exist ("first_time").
 * Disappears once a trip is saved. Never shown as a modal, tour, or overlay.
 */
export function MyTripsGuidance({ state }: { state: ActivationState }) {
  const { t } = useLocale();

  if (state !== "first_time") return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">
        {t("common", "guidance.welcomeEyebrow")}
      </p>
      <p className="mt-2 font-display text-lg text-sage-dark sm:text-xl">
        {t("common", "guidance.myTripsEmptyTitle")}
      </p>
      <p className="mt-2 font-serif text-sm text-foreground/70">
        {t("common", "guidance.myTripsEmptyHint")}
      </p>
      <div className="mt-4">
        <Button asChild size="sm">
          <Link href="/planner">{t("common", "guidance.planYourFirstTrip")}</Link>
        </Button>
      </div>
    </div>
  );
}
