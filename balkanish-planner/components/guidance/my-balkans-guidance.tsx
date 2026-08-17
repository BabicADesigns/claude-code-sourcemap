"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-provider";

/**
 * Phase 31 — Contextual first-journey guidance for the My Balkans workspace.
 *
 * Rendered inline before DashboardSections when the workspace is empty (state "first_time").
 * Disappears silently once the user has saved any content.
 * Never shown as a modal, tour, or overlay.
 */
export function MyBalkansGuidance({ isEmpty }: { isEmpty: boolean }) {
  const { t } = useLocale();

  if (!isEmpty) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">
        {t("common", "guidance.welcomeEyebrow")}
      </p>
      <p className="mt-2 font-display text-lg text-sage-dark sm:text-xl">
        {t("common", "guidance.myBalkansEmptyTitle")}
      </p>
      <p className="mt-2 font-serif text-sm text-foreground/70">
        {t("common", "guidance.myBalkansEmptyHint")}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/hidden-gems">{t("common", "guidance.browseHiddenGems")}</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/planner">{t("common", "guidance.planYourFirstTrip")}</Link>
        </Button>
      </div>
    </div>
  );
}
