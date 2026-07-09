"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { recordAction } from "@/lib/actions/resurfacing";
import type { ResurfacingCandidate, ResurfacingReason } from "@/lib/types";
import type { Namespace } from "@/lib/i18n/dictionaries";

type TFn = (namespace: Namespace, key: string, vars?: Record<string, string | number>) => string;

interface ResurfacedFindCardProps {
  candidate: ResurfacingCandidate;
  tripId: string;
  t: TFn;
}

function primaryReasonKey(reasons: ResurfacingReason[]): string {
  const priority: ResurfacingReason[] = [
    "ON_ROUTE",
    "NEAR_OVERNIGHT_STOP",
    "UPCOMING_DAY_OPPORTUNITY",
    "NEAR_DAY_STOP",
    "NEAR_ROUTE",
    "SAME_DESTINATION",
    "TRIP_INTEREST_MATCH",
    "SAME_REGION",
  ];
  for (const r of priority) {
    if (reasons.includes(r)) return `reasons.${r}`;
  }
  return `reasons.SAME_REGION`;
}

export function ResurfacedFindCard({ candidate, tripId, t }: ResurfacedFindCardProps) {
  const { capture, match } = candidate;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const placeName = capture.place_name ?? t("resurfacing", "unknown_place");
  const reasonKey = primaryReasonKey(match.reasons);
  const reasonLabel = t("resurfacing", reasonKey);

  function handleAction(action: "VIEW_FIND" | "ADD_TO_DAY" | "NOT_THIS_TRIP" | "REMIND_ME_LATER" | "DISMISS") {
    startTransition(async () => {
      await recordAction(capture.id, tripId, action);
      if (action === "ADD_TO_DAY") {
        track(ANALYTICS_EVENTS.TRAVEL_FIND_ADDED_TO_DAY, { confidence: match.confidence });
      } else if (action === "NOT_THIS_TRIP" || action === "DISMISS") {
        track(ANALYTICS_EVENTS.TRAVEL_FIND_RESURFACING_DISMISSED, { action });
      } else if (action === "REMIND_ME_LATER") {
        track(ANALYTICS_EVENTS.TRAVEL_FIND_REMIND_LATER);
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4 space-y-3">
      {/* Header: place label */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {t("resurfacing", "saved_label")}
          </p>
          <p className="text-sm font-semibold text-foreground truncate">{placeName}</p>
        </div>
        {/* Distance badge — only shown when we have real coordinate-derived distance */}
        {match.distanceKm !== null && match.distanceMetric === "GEOGRAPHIC_DISTANCE" && (
          <span className="shrink-0 text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">
            {t("resurfacing", "distance.straight_line", { km: Math.round(match.distanceKm) })}
          </span>
        )}
      </div>

      {/* Memory spark — what the user originally saved */}
      {capture.memory_spark && (
        <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2">
          {capture.memory_spark}
        </p>
      )}

      {/* Primary reason */}
      <p className="text-xs font-medium text-primary">{reasonLabel}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          href="/my-balkans/finds"
          onClick={() => handleAction("VIEW_FIND")}
          className="rounded-md bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          {t("resurfacing", "actions.view_find")}
        </Link>
        <button
          type="button"
          onClick={() => handleAction("ADD_TO_DAY")}
          disabled={isPending}
          className="rounded-md bg-muted text-muted-foreground px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          {t("resurfacing", "actions.add_to_day")}
        </button>
        <button
          type="button"
          onClick={() => handleAction("REMIND_ME_LATER")}
          disabled={isPending}
          className="rounded-md bg-muted text-muted-foreground px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          {t("resurfacing", "actions.remind_me_later")}
        </button>
        <button
          type="button"
          onClick={() => handleAction("NOT_THIS_TRIP")}
          disabled={isPending}
          className="text-xs text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground transition-colors disabled:opacity-50"
        >
          {t("resurfacing", "actions.not_this_trip")}
        </button>
      </div>
    </div>
  );
}
