"use client";

import type { TravelSegment, RouteComplexity } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";

const COMPLEXITY_COLOR: Record<RouteComplexity, string> = {
  EASY: "text-sage-dark bg-sage-dark/10 border-sage-dark/20",
  MANAGEABLE: "text-sage-dark bg-sage/20 border-sage/30",
  LONG_DAY: "text-foreground bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700/40",
  COMPLEX: "text-foreground bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700/40",
  NOT_RECOMMENDED: "text-foreground bg-rose/10 border-rose/30",
};

const COMPLEXITY_DOT: Record<RouteComplexity, string> = {
  EASY: "bg-sage-dark",
  MANAGEABLE: "bg-sage",
  LONG_DAY: "bg-amber-500",
  COMPLEX: "bg-orange-500",
  NOT_RECOMMENDED: "bg-rose",
};

export function TravelSegmentCard({ segment }: { segment: TravelSegment }) {
  const { t } = useLocale();

  const complexityClass = COMPLEXITY_COLOR[segment.practicality.rating];
  const dotClass = COMPLEXITY_DOT[segment.practicality.rating];
  const label = t("logistics", `complexity.${segment.practicality.rating}`);
  const modeLabel = t("logistics", `transportMode.${segment.primary_mode}`);

  return (
    <div className={`rounded-xl border px-4 py-3 sm:px-5 sm:py-4 ${complexityClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
          {segment.from_destination_name} → {segment.to_destination_name}
        </p>
        <span className="flex items-center gap-1.5 font-sans text-xs font-medium">
          <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
          {label}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-foreground/70">
        <span>{t("logistics", "travelSegments.byLabel")} {modeLabel}</span>
        <span>{t("logistics", "travelSegments.approxKm", { km: String(segment.distance_km) })}</span>
        {segment.drive_time_estimate && (
          <span>{segment.drive_time_estimate}</span>
        )}
        {segment.ferry_info && (
          <span className="text-accent">{t("logistics", "travelSegments.ferryNote")}</span>
        )}
        {segment.border_info && (
          <span className="text-muted-foreground">{t("logistics", "travelSegments.borderNote")}</span>
        )}
      </div>

      <p className="mt-2 font-serif text-sm text-foreground/80">{segment.practicality.reason}</p>

      {segment.editorial_note && (
        <p className="mt-1 font-serif text-xs italic text-foreground/60">{segment.editorial_note}</p>
      )}

      {segment.ferry_info && (
        <div className="mt-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
          <p className="font-sans text-xs font-medium uppercase tracking-widest text-accent">
            {t("logistics", "ferryNotice.heading")}
          </p>
          {segment.ferry_info.operator_name && (
            <p className="mt-1 font-sans text-xs text-foreground/70">{segment.ferry_info.operator_name}</p>
          )}
          {segment.ferry_info.advance_booking_required && (
            <p className="mt-0.5 font-sans text-xs text-foreground/70">
              {t("logistics", "ferryNotice.advanceBooking")}
            </p>
          )}
          {segment.ferry_info.booking_tip && (
            <p className="mt-1 font-serif text-xs italic text-foreground/60">{segment.ferry_info.booking_tip}</p>
          )}
          <p className="mt-1 font-sans text-xs text-foreground/50">
            {t("logistics", "ferryNotice.disclaimer")}
          </p>
        </div>
      )}

      {segment.border_info && (
        <div className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <p className="font-sans text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t("logistics", "borderNotice.heading")}
          </p>
          {segment.border_info.crossing_point && (
            <p className="mt-1 font-sans text-xs text-foreground/70">{segment.border_info.crossing_point}</p>
          )}
          {segment.border_info.typical_wait_hint && (
            <p className="mt-0.5 font-sans text-xs text-foreground/60">
              {t("logistics", "borderNotice.typicalWait", { hint: segment.border_info.typical_wait_hint })}
            </p>
          )}
          <p className="mt-1 font-sans text-xs text-foreground/50">
            {t("logistics", "borderNotice.disclaimer")}
          </p>
        </div>
      )}

      {segment.is_estimated && (
        <p className="mt-1 font-sans text-xs text-muted-foreground/60">
          {t("logistics", "travelSegments.estimatedLabel")}
        </p>
      )}
    </div>
  );
}

export function TravelSegmentsSection({ segments }: { segments: TravelSegment[] }) {
  const { t } = useLocale();
  if (segments.length === 0) return null;

  return (
    <div className="mt-8 sm:mt-10">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">
        {t("logistics", "travelSegments.sectionLabel")}
      </p>
      <p className="mt-1 font-serif text-sm text-foreground/70">
        {t("logistics", "travelSegments.sectionDescription")}
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {segments.map((segment) => (
          <TravelSegmentCard
            key={`${segment.from_destination_slug}-${segment.to_destination_slug}`}
            segment={segment}
          />
        ))}
      </div>
    </div>
  );
}
