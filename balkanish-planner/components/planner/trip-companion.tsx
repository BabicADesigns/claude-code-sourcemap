"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import {
  markReadinessItemDone,
  markReadinessItemPending,
  markReadinessItemSkipped,
  markReadinessItemBooked,
  saveReadinessItemNotes,
  saveTripDepartureDate,
} from "@/lib/actions/trip-readiness";
import {
  type TripReadinessItem,
  type ReadinessTimingWindow,
  type TripCountdownState,
  READINESS_CATEGORY_LABELS,
} from "@/lib/types";
import {
  computeDaysUntilDeparture,
  computeCountdownState,
  currentWindowFromDays,
  isActiveNow,
  buildWhatMattersNow,
} from "@/lib/ai/trip-readiness";

interface TripCompanionProps {
  tripId: string;
  tripTitle: string;
  items: TripReadinessItem[];
  departureDate: string | null;
}

// ---------------------------------------------------------------------------
// Countdown display
// ---------------------------------------------------------------------------

function CountdownBadge({
  state,
  daysUntil,
}: {
  state: TripCountdownState;
  daysUntil: number | null;
}) {
  const { t } = useLocale();
  if (state === "TODAY") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-primary">{t("tripReadiness", "countdown.today")}</span>
      </div>
    );
  }
  if (state === "STARTED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5">
        <span className="text-sm font-medium text-muted-foreground">{t("tripReadiness", "countdown.started")}</span>
      </div>
    );
  }
  if (daysUntil === 1) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5">
        <span className="h-2 w-2 rounded-full bg-destructive" />
        <span className="text-sm font-medium text-destructive">{t("tripReadiness", "countdown.tomorrow")}</span>
      </div>
    );
  }
  if (daysUntil !== null && daysUntil > 0) {
    const isUrgent = daysUntil <= 7;
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ${
          isUrgent ? "bg-destructive/10" : "bg-sage-light/30"
        }`}
      >
        <span className="text-sm font-medium text-foreground">
          {t("tripReadiness", "countdown.future", { days: daysUntil })}
        </span>
      </div>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{pct}% ready</span>
        <span className="text-xs text-muted-foreground">
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Readiness item card
// ---------------------------------------------------------------------------

function ReadinessCard({
  item,
  tripId,
  onOptimisticUpdate,
}: {
  item: TripReadinessItem;
  tripId: string;
  onOptimisticUpdate: (id: string, patch: Partial<TripReadinessItem>) => void;
}) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes ?? "");
  const [notesPending, setNotesPending] = useState(false);

  const isDone = item.status === "DONE";
  const isSkipped = item.status === "SKIPPED";
  const isBooked = item.booking_state === "USER_MARKED_BOOKED";

  function handleToggleDone() {
    const newStatus = isDone ? "PENDING" : "DONE";
    onOptimisticUpdate(item.id, { status: newStatus });
    startTransition(async () => {
      if (isDone) {
        await markReadinessItemPending(item.id, tripId);
      } else {
        await markReadinessItemDone(item.id, tripId);
      }
    });
  }

  function handleSkip() {
    const newStatus = isSkipped ? "PENDING" : "SKIPPED";
    onOptimisticUpdate(item.id, { status: newStatus });
    startTransition(async () => {
      if (isSkipped) {
        await markReadinessItemPending(item.id, tripId);
      } else {
        await markReadinessItemSkipped(item.id, tripId);
      }
    });
  }

  function handleMarkBooked() {
    const newState = isBooked ? "NOT_STARTED" : "USER_MARKED_BOOKED";
    onOptimisticUpdate(item.id, { booking_state: newState });
    startTransition(async () => {
      if (isBooked) {
        // Reset to NOT_STARTED — reuse the action path
        await markReadinessItemBooked(item.id, tripId);
      } else {
        await markReadinessItemBooked(item.id, tripId);
      }
    });
  }

  async function handleSaveNotes() {
    setNotesPending(true);
    await saveReadinessItemNotes(item.id, tripId, notesValue);
    onOptimisticUpdate(item.id, { notes: notesValue.trim() || null });
    setNotesPending(false);
    setShowNotes(false);
  }

  const priorityColor =
    item.priority === "CRITICAL"
      ? "text-destructive"
      : item.priority === "HIGH"
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  const showBookingCta =
    ["ACCOMMODATION", "TRANSPORT", "FERRY", "ACTIVITIES"].includes(item.category) &&
    item.reservation_sensitivity !== "LOW";

  return (
    <div
      className={`rounded-lg border p-4 transition-opacity ${
        isDone || isSkipped
          ? "border-border/40 bg-card/50 opacity-60"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={handleToggleDone}
          disabled={isPending}
          aria-label={isDone ? t("tripReadiness", "actions.markPending") : t("tripReadiness", "actions.markDone")}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
            isDone
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:border-primary"
          }`}
        >
          {isDone && (
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {READINESS_CATEGORY_LABELS[item.category]}
            </span>
            {item.priority !== "LOW" && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className={`text-xs font-medium ${priorityColor}`}>
                  {t("tripReadiness", `priority.${item.priority}`)}
                </span>
              </>
            )}
            {isBooked && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs font-medium text-primary">
                  {t("tripReadiness", "bookingState.USER_MARKED_BOOKED")}
                </span>
              </>
            )}
          </div>

          <p className={`font-medium text-sm leading-snug ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {item.title}
          </p>
          {!isDone && !isSkipped && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
          )}

          {item.notes && (
            <p className="text-xs text-muted-foreground/80 mt-1.5 italic">{item.notes}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showBookingCta && !isBooked && !isDone && (
              <button
                type="button"
                onClick={handleMarkBooked}
                disabled={isPending}
                className="rounded px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {t("tripReadiness", "actions.markBooked")}
              </button>
            )}
            {!isDone && !isSkipped && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("tripReadiness", "actions.markSkipped")}
              </button>
            )}
            {isSkipped && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("tripReadiness", "actions.markPending")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("tripReadiness", "actions.addNote")}
            </button>
          </div>

          {showNotes && (
            <div className="mt-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={2}
                placeholder="Add a note…"
                className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={notesPending}
                  className="rounded px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {t("tripReadiness", "actions.saveNote")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotes(false);
                    setNotesValue(item.notes ?? "");
                  }}
                  className="rounded px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("tripReadiness", "actions.cancelNote")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grouped section
// ---------------------------------------------------------------------------

function TimingSection({
  window,
  items,
  tripId,
  daysUntil,
  onOptimisticUpdate,
}: {
  window: ReadinessTimingWindow;
  items: TripReadinessItem[];
  tripId: string;
  daysUntil: number | null;
  onOptimisticUpdate: (id: string, patch: Partial<TripReadinessItem>) => void;
}) {
  const { t } = useLocale();
  if (items.length === 0) return null;
  const label =
    window === "NOW_URGENT" && daysUntil !== null
      ? t("tripReadiness", "sections.NOW_URGENT", { days: daysUntil })
      : t("tripReadiness", `sections.${window}`);

  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{label}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <ReadinessCard key={item.id} item={item} tripId={tripId} onOptimisticUpdate={onOptimisticUpdate} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Departure date setter
// ---------------------------------------------------------------------------

function DepartureDateSetter({
  tripId,
  current,
}: {
  tripId: string;
  current: string | null;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveTripDepartureDate(tripId, value || null);
      router.refresh();
    });
  }

  function handleClear() {
    setValue("");
    startTransition(async () => {
      await saveTripDepartureDate(tripId, null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          {t("tripReadiness", "setDepartureDateLabel")}
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || value === (current ?? "")}
        className="rounded px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {t("tripReadiness", "setDepartureDateSave")}
      </button>
      {current && (
        <button
          type="button"
          onClick={handleClear}
          disabled={isPending}
          className="rounded px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("tripReadiness", "setDepartureDateClear")}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TIMING_ORDER: ReadinessTimingWindow[] = [
  "DO_NOW",
  "NOW_URGENT",
  "THIS_WEEK",
  "THIS_MONTH",
  "BEFORE_YOU_GO",
  "PLANNING_PHASE",
  "IN_DESTINATION",
  "POST_TRIP",
];

export function TripCompanion({ tripId, tripTitle, items: initialItems, departureDate }: TripCompanionProps) {
  const { t } = useLocale();
  const [items, setItems] = useState<TripReadinessItem[]>(initialItems);

  function optimisticUpdate(id: string, patch: Partial<TripReadinessItem>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  const depDate = departureDate ? new Date(departureDate) : null;
  const daysUntil = computeDaysUntilDeparture(depDate);
  const countdownState = computeCountdownState(daysUntil);
  const currentWindow = currentWindowFromDays(daysUntil);

  const total = items.filter((i) => i.status !== "NA").length;
  const done = items.filter((i) => i.status === "DONE" || i.status === "SKIPPED").length;

  const activeItems = buildWhatMattersNow(items, daysUntil);
  const hasUrgentItems = activeItems.length > 0;

  const grouped = Object.fromEntries(
    TIMING_ORDER.map((w) => [
      w,
      items.filter((i) => i.timing_window === w && i.status !== "NA"),
    ])
  ) as Record<ReadinessTimingWindow, TripReadinessItem[]>;

  return (
    <div className="max-w-2xl">
      {/* Departure date */}
      <div className="mb-8 rounded-lg border border-border/60 p-4">
        <DepartureDateSetter tripId={tripId} current={departureDate} />
        {!departureDate && (
          <p className="text-xs text-muted-foreground mt-2">
            {t("tripReadiness", "setDepartureDatePrompt")}
          </p>
        )}
      </div>

      {/* Countdown + progress */}
      {departureDate && (
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CountdownBadge state={countdownState} daysUntil={daysUntil} />
          <div className="w-full sm:max-w-xs">
            <ProgressBar done={done} total={total} />
          </div>
        </div>
      )}

      {/* What Matters Now */}
      {departureDate && hasUrgentItems && (
        <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-3">
            {t("tripReadiness", "whatMattersNow")}
          </h2>
          <div className="space-y-2">
            {activeItems.slice(0, 5).map((item) => (
              <ReadinessCard
                key={`urgent-${item.id}`}
                item={item}
                tripId={tripId}
                onOptimisticUpdate={optimisticUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {total === done && total > 0 && (
        <p className="mb-8 text-sm font-medium text-sage-dark">
          {t("tripReadiness", "allChecked")}
        </p>
      )}

      {/* Full checklist grouped by timing window */}
      {TIMING_ORDER.map((window) => (
        <TimingSection
          key={window}
          window={window}
          items={grouped[window]}
          tripId={tripId}
          daysUntil={daysUntil}
          onOptimisticUpdate={optimisticUpdate}
        />
      ))}
    </div>
  );
}
