"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  markDaySlotDone,
  markDaySlotPlanned,
  markDaySlotSkipped,
  markDaySlotSavedForLater,
  resetDaySlot,
} from "@/lib/actions/live-trip";
import {
  computeCurrentMoment,
  buildTripDayContext,
  getTodayDateString,
  buildLighterDayProposal,
} from "@/lib/ai/live-trip";
import {
  type SavedItinerary,
  type TripReadinessItem,
  type CulturalInsight,
  type LocalPhrase,
  type LiveTripItemState,
  type CurrentTripMoment,
  type TripDayContext,
  type LiveTripDayItem,
  type LighterDayProposal,
  type PracticalContextCard,
  LOCAL_PHRASE_CATEGORY_LABELS,
} from "@/lib/types";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import type { Namespace } from "@/lib/i18n/dictionaries";
import { ResurfacedFindCard } from "@/components/resurfacing/resurfaced-find-card";
import { trackResurfacing } from "@/lib/actions/resurfacing";
import type { ResurfacingCandidate } from "@/lib/types";

interface LiveTripTodayProps {
  tripId: string;
  trip: SavedItinerary;
  itemStates: LiveTripItemState[];
  readinessItems: TripReadinessItem[];
  culturalInsights: CulturalInsight[];
  localPhrases: LocalPhrase[];
  resurfacedCandidates: ResurfacingCandidate[];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LiveTripToday({
  tripId,
  trip,
  itemStates,
  readinessItems,
  culturalInsights,
  localPhrases,
  resurfacedCandidates,
}: LiveTripTodayProps) {
  const { t } = useLocale();
  const router = useRouter();

  // todayDateString is computed client-side so it uses the user's local timezone
  const [todayDateString, setTodayDateString] = useState<string | null>(null);
  const [moment, setMoment] = useState<CurrentTripMoment | null>(null);
  const [viewingDayNumber, setViewingDayNumber] = useState<number | null>(null);
  const [showTomorrowPreview, setShowTomorrowPreview] = useState(false);
  const [showLighterDaySheet, setShowLighterDaySheet] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineSnapshotAge, setOfflineSnapshotAge] = useState<string | null>(null);

  useEffect(() => {
    const today = getTodayDateString();
    setTodayDateString(today);

    const computed = computeCurrentMoment(
      trip.departure_date,
      trip.duration_days,
      today
    );
    setMoment(computed);

    // Set initial viewing day
    if (computed.current_day_number !== null) {
      setViewingDayNumber(computed.current_day_number);
    } else if (computed.lifecycle === "PRE_TRIP") {
      setViewingDayNumber(1);
    }

    // Online/offline detection
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Offline snapshot age
    const snapTime = localStorage.getItem(`live_trip_snapshot_${tripId}_saved_at`);
    if (snapTime) {
      const diffMin = Math.round((Date.now() - Number(snapTime)) / 60000);
      setOfflineSnapshotAge(diffMin < 60 ? `${diffMin} min` : `${Math.round(diffMin / 60)}h`);
    }

    track("Live Trip Opened");

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [tripId, trip.departure_date, trip.duration_days]);

  const saveOfflineSnapshot = useCallback(() => {
    try {
      localStorage.setItem(`live_trip_snapshot_${tripId}`, JSON.stringify({
        trip,
        itemStates,
        savedAt: Date.now(),
      }));
      localStorage.setItem(`live_trip_snapshot_${tripId}_saved_at`, String(Date.now()));
      setOfflineSnapshotAge("just now");
      track("Offline Snapshot Saved");
    } catch {
      // localStorage may be unavailable
    }
  }, [tripId, trip, itemStates]);

  if (!moment || !todayDateString) {
    return <div className="py-16 text-center text-muted-foreground">Loading your trip…</div>;
  }

  const { lifecycle } = moment;

  // PLANNING state: no departure date or too far away
  if (lifecycle === "PLANNING") {
    return (
      <div className="max-w-md py-8">
        <h2 className="text-xl font-serif font-semibold mb-3">
          {t("liveTrip", "lifecycle.planning.title")}
        </h2>
        <p className="text-foreground/70 mb-6">{t("liveTrip", "lifecycle.planning.body")}</p>
        <a
          href={`/trips/${tripId}/companion`}
          className="inline-block rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("liveTrip", "lifecycle.planning.cta")}
        </a>
      </div>
    );
  }

  // COMPLETED state
  if (lifecycle === "COMPLETED") {
    return (
      <div className="max-w-md py-8">
        <h2 className="text-xl font-serif font-semibold mb-3">
          {t("liveTrip", "lifecycle.completed.title")}
        </h2>
        <p className="text-foreground/70 mb-4">{t("liveTrip", "lifecycle.completed.body")}</p>
        <a
          href={`/trips/${trip.id}/reflection`}
          className="inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
        >
          {t("liveTrip", "lifecycle.completed.cta_memory")}
        </a>
      </div>
    );
  }

  // Build state map from server-loaded states
  const stateMap = new Map(itemStates.map((s) => [s.item_key, s]));

  // Determine the day to display
  const days = trip.itinerary_json.days ?? [];
  const activeDay = viewingDayNumber ?? moment.current_day_number ?? 1;
  const day = days.find((d) => d.day === activeDay);
  const departureDateString = trip.departure_date!;

  // Current hour for NowNext heuristic (only on the current day)
  const currentHour = activeDay === moment.current_day_number ? new Date().getHours() : null;

  const dayContext: TripDayContext | null = day
    ? buildTripDayContext(day, departureDateString, stateMap, currentHour, [], readinessItems)
    : null;

  const lighterDayProposal =
    dayContext ? buildLighterDayProposal(dayContext.items) : null;

  const tomorrowDay = days.find((d) => d.day === activeDay + 1);

  return (
    <div className="space-y-6 max-w-xl">
      {/* Offline banner */}
      {!isOnline && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {t("liveTrip", "offline.banner")}
          </p>
        </div>
      )}

      {/* Day badge + lifecycle header */}
      <LifecycleBadge lifecycle={lifecycle} dayNumber={activeDay} totalDays={trip.duration_days} t={t} />

      {/* Day navigation */}
      {days.length > 1 && (
        <DayNav
          currentView={activeDay}
          totalDays={trip.duration_days}
          todayDay={moment.current_day_number}
          onNavigate={setViewingDayNumber}
          t={t}
        />
      )}

      {/* Day title + load badge */}
      {dayContext && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-semibold">{dayContext.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{dayContext.date_string}</p>
            </div>
            <DayLoadBadge load={dayContext.load} t={t} />
          </div>

          {/* Practical context cards */}
          {dayContext.practical_cards.length > 0 && (
            <div className="space-y-3">
              {dayContext.practical_cards.map((card, i) => (
                <PracticalCard key={i} card={card} t={t} />
              ))}
            </div>
          )}

          {/* Now / Next / Later groups */}
          <NowNextLaterView
            items={dayContext.items}
            tripId={tripId}
            todayDateString={todayDateString}
            isOnline={isOnline}
            t={t}
          />

          {/* Lighter day CTA */}
          {lighterDayProposal && !showLighterDaySheet && (
            <button
              onClick={() => {
                setShowLighterDaySheet(true);
                track("Lighter Day Proposed");
              }}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {t("liveTrip", "lighter_day.propose_cta")}
            </button>
          )}

          {/* Lighter day sheet */}
          {showLighterDaySheet && lighterDayProposal && (
            <LighterDaySheet
              proposal={lighterDayProposal}
              items={dayContext.items}
              tripId={tripId}
              todayDateString={todayDateString}
              isOnline={isOnline}
              onDismiss={() => setShowLighterDaySheet(false)}
              t={t}
            />
          )}
        </>
      )}

      {/* Remember this? — resurfaced finds */}
      {resurfacedCandidates.length > 0 && (
        <ResurfacedFindsSection candidates={resurfacedCandidates} tripId={tripId} t={t} />
      )}

      {/* Cultural intelligence */}
      {culturalInsights.length > 0 && (
        <GoodToKnowSection insights={culturalInsights.slice(0, 3)} t={t} />
      )}

      {/* Language phrases */}
      {localPhrases.length > 0 && (
        <UsefulTodaySection phrases={localPhrases.slice(0, 5)} t={t} />
      )}

      {/* Tomorrow preview */}
      {tomorrowDay && (
        <div>
          {!showTomorrowPreview ? (
            <button
              onClick={() => {
                setShowTomorrowPreview(true);
                track("Tomorrow Preview Opened");
              }}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              {t("liveTrip", "tomorrow.title")} →
            </button>
          ) : (
            <TomorrowPreview day={tomorrowDay} t={t} />
          )}
        </div>
      )}

      {/* Offline save */}
      <div className="pt-4 border-t border-border">
        <button
          onClick={saveOfflineSnapshot}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("liveTrip", "offline.save_cta")}
        </button>
        {offlineSnapshotAge && (
          <span className="ml-3 text-xs text-muted-foreground">
            {t("liveTrip", "offline.snapshot_age").replace("{time}", offlineSnapshotAge)}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type TFn = (namespace: Namespace, key: string, vars?: Record<string, string | number>) => string;

function LifecycleBadge({
  lifecycle,
  dayNumber,
  totalDays,
  t,
}: {
  lifecycle: string;
  dayNumber: number;
  totalDays: number;
  t: TFn;
}) {
  if (lifecycle === "PRE_TRIP") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/30 px-4 py-1.5">
        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
          {t("liveTrip", "lifecycle.pre_trip.badge")}
        </span>
      </div>
    );
  }
  if (lifecycle === "DEPARTURE_DAY") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-primary">
          {t("liveTrip", "lifecycle.departure_day.badge")}
        </span>
      </div>
    );
  }
  if (lifecycle === "IN_TRIP") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          {t("liveTrip", "lifecycle.in_trip.badge")
            .replace("{day}", String(dayNumber))
            .replace("{total}", String(totalDays))}
        </span>
      </div>
    );
  }
  return null;
}

function DayLoadBadge({ load, t }: { load: string; t: TFn }) {
  const labels: Record<string, string> = {
    LIGHT: t("liveTrip", "load.light"),
    MODERATE: t("liveTrip", "load.moderate"),
    FULL: t("liveTrip", "load.full"),
  };
  const colors: Record<string, string> = {
    LIGHT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    MODERATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    FULL: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colors[load] ?? ""}`}>
      {labels[load] ?? load}
    </span>
  );
}

function DayNav({
  currentView,
  totalDays,
  todayDay,
  onNavigate,
  t,
}: {
  currentView: number;
  totalDays: number;
  todayDay: number | null;
  onNavigate: (day: number) => void;
  t: TFn;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={currentView <= 1}
        onClick={() => onNavigate(currentView - 1)}
        className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← {t("liveTrip", "day_nav.previous")}
      </button>
      {todayDay !== null && currentView !== todayDay && (
        <button
          onClick={() => onNavigate(todayDay)}
          className="text-xs text-primary hover:underline transition-colors mx-auto"
        >
          {t("liveTrip", "day_nav.today")}
        </button>
      )}
      <button
        disabled={currentView >= totalDays}
        onClick={() => onNavigate(currentView + 1)}
        className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-auto"
      >
        {t("liveTrip", "day_nav.next")} →
      </button>
    </div>
  );
}

function PracticalCard({ card, t }: { card: PracticalContextCard; t: TFn }) {
  const typeLabels: Record<string, string> = {
    FERRY_DAY: t("liveTrip", "practical.ferry_day"),
    BORDER_CROSSING: t("liveTrip", "practical.border_crossing"),
    LOGISTICS_MOVE: t("liveTrip", "practical.logistics_move"),
    RESERVATION_DUE: t("liveTrip", "practical.reservation_due"),
    OFFLINE_REMINDER: t("liveTrip", "practical.offline_reminder"),
    PACKING_CHECK: t("liveTrip", "practical.packing_check"),
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            {typeLabels[card.type] ?? card.type}
          </p>
          <p className="text-sm font-medium text-foreground">{card.headline}</p>
          <p className="text-sm text-foreground/70 mt-1">{card.body}</p>
          {card.capability !== "LIVE_PROVIDER" && (
            <p className="text-xs text-muted-foreground mt-2">
              {card.capability === "STATIC_CURATED"
                ? t("liveTrip", "practical.capability_static")
                : card.capability === "USER_CONFIRMED"
                ? t("liveTrip", "practical.capability_confirmed")
                : t("liveTrip", "practical.capability_derived")}
            </p>
          )}
          {(card.type === "FERRY_DAY" || card.type === "BORDER_CROSSING") && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
              {t("liveTrip", "practical.verify_before_travel")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Now / Next / Later view
// ---------------------------------------------------------------------------

function NowNextLaterView({
  items,
  tripId,
  todayDateString,
  isOnline,
  t,
}: {
  items: LiveTripDayItem[];
  tripId: string;
  todayDateString: string;
  isOnline: boolean;
  t: TFn;
}) {
  const groups: Record<string, LiveTripDayItem[]> = {
    NOW: items.filter((i) => i.now_next_group === "NOW"),
    NEXT: items.filter((i) => i.now_next_group === "NEXT"),
    LATER: items.filter((i) => i.now_next_group === "LATER"),
    DONE_TODAY: items.filter((i) => i.now_next_group === "DONE_TODAY"),
  };

  const groupOrder = ["NOW", "NEXT", "LATER", "DONE_TODAY"] as const;
  const groupLabels: Record<string, string> = {
    NOW: t("liveTrip", "now_next.now"),
    NEXT: t("liveTrip", "now_next.next"),
    LATER: t("liveTrip", "now_next.later"),
    DONE_TODAY: t("liveTrip", "now_next.done_today"),
  };

  return (
    <div className="space-y-5">
      {groupOrder.map((group) => {
        const groupItems = groups[group];
        if (groupItems.length === 0) return null;
        return (
          <div key={group}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {groupLabels[group]}
            </p>
            <div className="space-y-3">
              {groupItems.map((item) => (
                <DaySlotCard
                  key={item.item_key}
                  item={item}
                  tripId={tripId}
                  todayDateString={todayDateString}
                  isOnline={isOnline}
                  t={t}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DaySlotCard({
  item,
  tripId,
  todayDateString,
  isOnline,
  t,
}: {
  item: LiveTripDayItem;
  tripId: string;
  todayDateString: string;
  isOnline: boolean;
  t: TFn;
}) {
  const [isPending, startTransition] = useTransition();
  const [offlineFeedback, setOfflineFeedback] = useState(false);
  const router = useRouter();

  const slotLabels: Record<string, string> = {
    morning: t("liveTrip", "slots.morning"),
    afternoon: t("liveTrip", "slots.afternoon"),
    evening: t("liveTrip", "slots.evening"),
    food: t("liveTrip", "slots.food"),
    day_overview: t("liveTrip", "slots.day_overview"),
  };

  const isDone = item.status === "DONE";
  const isSkipped = item.status === "SKIPPED";
  const isSaved = item.status === "SAVED_FOR_LATER";

  function withOnlineCheck(action: () => void) {
    if (!isOnline) {
      setOfflineFeedback(true);
      setTimeout(() => setOfflineFeedback(false), 3000);
      return;
    }
    action();
  }

  function handleMarkDone() {
    withOnlineCheck(() => {
      startTransition(async () => {
        await markDaySlotDone(tripId, item.item_key, todayDateString);
        track("Today Item Marked Done");
        router.refresh();
      });
    });
  }

  function handleSkip() {
    withOnlineCheck(() => {
      startTransition(async () => {
        await markDaySlotSkipped(tripId, item.item_key, todayDateString);
        track("Today Item Skipped");
        router.refresh();
      });
    });
  }

  function handleReset() {
    withOnlineCheck(() => {
      startTransition(async () => {
        await resetDaySlot(tripId, item.item_key);
        router.refresh();
      });
    });
  }

  function handleSaveForLater() {
    withOnlineCheck(() => {
      startTransition(async () => {
        await markDaySlotSavedForLater(tripId, item.item_key, todayDateString);
        router.refresh();
      });
    });
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-opacity ${
        isDone || isSkipped ? "opacity-60 border-border" : "border-border bg-background"
      } ${isPending ? "opacity-50" : ""}`}
    >
      {/* Slot label */}
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
        {slotLabels[item.slot] ?? item.slot}
        {isDone && <span className="ml-2 text-green-600 dark:text-green-400">✓ {t("liveTrip", "item.done_label")}</span>}
        {isSkipped && <span className="ml-2 text-muted-foreground">{t("liveTrip", "item.skipped_label")}</span>}
        {isSaved && <span className="ml-2 text-blue-600 dark:text-blue-400">{t("liveTrip", "item.saved_label")}</span>}
      </p>

      {/* Prose — shown even for done/skipped so traveller remembers what it was */}
      <p className="text-sm text-foreground/80 leading-relaxed">{item.prose}</p>

      {/* Offline feedback */}
      {offlineFeedback && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
          {t("liveTrip", "offline.mutation_blocked")}
        </p>
      )}

      {/* Actions — one-thumb-reachable tap targets */}
      <div className="flex flex-wrap gap-2 mt-3">
        {!isDone && !isSkipped && (
          <>
            <button
              onClick={handleMarkDone}
              disabled={isPending}
              className="rounded-md bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {t("liveTrip", "item.mark_done")}
            </button>
            <button
              onClick={handleSkip}
              disabled={isPending}
              className="rounded-md bg-muted text-muted-foreground px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              {t("liveTrip", "item.skip")}
            </button>
            {!isSaved && (
              <button
                onClick={handleSaveForLater}
                disabled={isPending}
                className="rounded-md bg-muted text-muted-foreground px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                {t("liveTrip", "item.save_for_later")}
              </button>
            )}
          </>
        )}
        {(isDone || isSkipped) && (
          <button
            onClick={handleReset}
            disabled={isPending}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t("liveTrip", "item.mark_planned")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lighter day sheet
// ---------------------------------------------------------------------------

function LighterDaySheet({
  proposal,
  items,
  tripId,
  todayDateString,
  isOnline,
  onDismiss,
  t,
}: {
  proposal: LighterDayProposal;
  items: LiveTripDayItem[];
  tripId: string;
  todayDateString: string;
  isOnline: boolean;
  onDismiss: () => void;
  t: TFn;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAccept() {
    if (!isOnline) return;
    startTransition(async () => {
      for (const key of proposal.suggested_items_to_skip) {
        await markDaySlotSkipped(tripId, key, todayDateString);
      }
      track("Lighter Day Accepted");
      router.refresh();
      onDismiss();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-background p-5 space-y-4">
      <h3 className="font-serif text-base font-semibold">{t("liveTrip", "lighter_day.sheet_title")}</h3>
      <p className="text-sm text-foreground/70">{proposal.reasoning}</p>

      <div className="space-y-2">
        {items.map((item) => {
          const toSkip = proposal.suggested_items_to_skip.includes(item.item_key);
          const slotLabels: Record<string, string> = {
            morning: t("liveTrip", "slots.morning"),
            afternoon: t("liveTrip", "slots.afternoon"),
            evening: t("liveTrip", "slots.evening"),
            food: t("liveTrip", "slots.food"),
          };
          return (
            <div key={item.item_key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                  toSkip
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {toSkip ? t("liveTrip", "lighter_day.skip_label") : t("liveTrip", "lighter_day.keep_label")}
              </span>
              <p className="text-sm text-foreground/80">
                <span className="font-medium">{slotLabels[item.slot] ?? item.slot}:</span>{" "}
                {item.prose.slice(0, 80)}{item.prose.length > 80 ? "…" : ""}
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground italic">{t("liveTrip", "lighter_day.disclaimer")}</p>

      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={isPending || !isOnline}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {t("liveTrip", "lighter_day.accept_cta")}
        </button>
        <button
          onClick={onDismiss}
          className="rounded-lg bg-muted text-muted-foreground px-4 py-2 text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          {t("liveTrip", "lighter_day.dismiss_cta")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cultural intelligence section
// ---------------------------------------------------------------------------

function GoodToKnowSection({ insights, t }: { insights: CulturalInsight[]; t: TFn }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground/80">{t("liveTrip", "cultural.section_title")}</h3>
      <div className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-lg bg-muted/40 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">{insight.headline}</p>
            <p className="text-sm text-foreground/80">{insight.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Language phrases section
// ---------------------------------------------------------------------------

function UsefulTodaySection({ phrases, t }: { phrases: LocalPhrase[]; t: TFn }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground/80">{t("liveTrip", "phrases.section_title")}</h3>
      <div className="space-y-2">
        {phrases.map((phrase) => (
          <div key={phrase.id} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">
                {LOCAL_PHRASE_CATEGORY_LABELS[phrase.category] ?? phrase.category}
              </p>
              <p className="text-sm font-medium text-foreground">{phrase.phrase}</p>
              {phrase.transliteration && (
                <p className="text-xs text-muted-foreground italic">{phrase.transliteration}</p>
              )}
              <p className="text-xs text-foreground/70 mt-0.5">{phrase.translation}</p>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">{phrase.language_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tomorrow preview
// ---------------------------------------------------------------------------

function TomorrowPreview({
  day,
  t,
}: {
  day: { day: number; title: string; summary: string };
  t: TFn;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 opacity-70">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {t("liveTrip", "tomorrow.title")}
      </p>
      <p className="text-sm font-medium text-foreground">{day.title}</p>
      <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{day.summary}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resurfaced finds section
// ---------------------------------------------------------------------------

function ResurfacedFindsSection({
  candidates,
  tripId,
  t,
}: {
  candidates: ResurfacingCandidate[];
  tripId: string;
  t: TFn;
}) {
  useEffect(() => {
    for (const c of candidates) {
      void trackResurfacing(
        c.capture.id,
        tripId,
        c.match.context.lifecycle,
        c.match.reasons,
        c.match.confidence
      );
      track(ANALYTICS_EVENTS.TRAVEL_FIND_RESURFACED, { confidence: c.match.confidence });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground/80">{t("resurfacing", "section.title")}</h3>
      <p className="text-xs text-muted-foreground">{t("resurfacing", "section.subtitle")}</p>
      <div className="space-y-3">
        {candidates.map((c) => (
          <ResurfacedFindCard key={c.capture.id} candidate={c} tripId={tripId} t={t} />
        ))}
      </div>
    </div>
  );
}
