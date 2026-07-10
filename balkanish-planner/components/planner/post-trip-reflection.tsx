"use client";

import { useState, useTransition, useCallback } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { track } from "@/lib/analytics";
import {
  buildReflectionItemKeys,
  buildTripLearningCandidates,
  computeReflectionTimingWindow,
  type ReflectionEligibilityResult,
} from "@/lib/ai/post-trip-reflection";
import {
  saveReflectionOverallFeeling,
  saveReflectionPaceAndPlanning,
  saveReflectionReturnIntent,
  saveReflectionPrivateNote,
  saveReflectionItem,
  confirmLearningCandidate,
  rejectLearningCandidate,
  deferLearningCandidate,
  dismissReflection,
  completeReflection,
} from "@/lib/actions/post-trip-reflection";
import { getTodayDateString } from "@/lib/ai/live-trip";
import type {
  TripLifecycleState,
  TripReflection,
  TripReflectionItem,
  TripLearningCandidateDecision,
  LiveTripItemState,
  OverallFeeling,
  PaceReflection,
  PlanningComfort,
  ReturnIntent,
  ItemReflection,
  TripLearningCandidate,
} from "@/lib/types";
import type { ItineraryDay } from "@/lib/ai/itinerary";
import type { Namespace } from "@/lib/i18n/dictionaries";

const NS: Namespace = "reflection";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function itemStateMap(liveStates: LiveTripItemState[]): Record<string, import("@/lib/types").LiveItemStatus> {
  return Object.fromEntries(liveStates.map((s) => [s.item_key, s.status]));
}

function reflectionItemMap(items: TripReflectionItem[]): Record<string, ItemReflection> {
  return Object.fromEntries(items.map((i) => [i.item_key, i.value]));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PostTripReflectionProps {
  tripId: string;
  days: ItineraryDay[];
  departureDateString: string | null;
  durationDays: number;
  lifecycle: TripLifecycleState;
  eligibility: ReflectionEligibilityResult;
  existingReflection: TripReflection | null;
  existingItems: TripReflectionItem[];
  existingDecisions: TripLearningCandidateDecision[];
  liveStates: LiveTripItemState[];
}

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------

type Step = "overall" | "pace" | "items" | "memory" | "done";
const STEPS: Step[] = ["overall", "pace", "items", "memory", "done"];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PostTripReflection({
  tripId,
  days,
  departureDateString,
  durationDays,
  eligibility,
  existingReflection,
  existingItems,
  existingDecisions,
  liveStates,
}: PostTripReflectionProps) {
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();

  // Derive initial step from existing reflection state
  const initialStep: Step = (() => {
    if (!existingReflection) return "overall";
    if (existingReflection.status === "COMPLETED") return "done";
    if (existingReflection.status === "DISMISSED") return "overall";
    if (existingReflection.overall_feeling && !existingReflection.pace_reflection) return "pace";
    if (existingReflection.pace_reflection) return "items";
    return "overall";
  })();

  const [step, setStep] = useState<Step>(initialStep);
  const [reflection, setReflection] = useState<Partial<TripReflection>>(existingReflection ?? {});
  const [ratingMap, setRatingMap] = useState<Record<string, ItemReflection>>(
    reflectionItemMap(existingItems)
  );
  const [candidates, setCandidates] = useState<TripLearningCandidate[]>([]);
  const [decisions, setDecisions] = useState<Record<string, import("@/lib/types").CandidateDecision>>(
    Object.fromEntries(existingDecisions.map((d) => [d.candidate_key, d.decision]))
  );
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnIntentDestination, setReturnIntentDestination] = useState(
    existingReflection?.return_intent_destination ?? ""
  );
  const [privateNote, setPrivateNote] = useState(existingReflection?.private_note ?? "");

  // Timing window (client-side, for framing copy)
  const todayString = typeof window !== "undefined" ? getTodayDateString() : new Date().toISOString().slice(0, 10);
  const timingWindow = departureDateString
    ? computeReflectionTimingWindow(departureDateString, durationDays, todayString)
    : "PAST_TRIP";

  const timingKey = timingWindow.toLowerCase() as "just_returned" | "recent" | "past_trip";

  // Build reflection item slots
  const liveStateMap = itemStateMap(liveStates);
  const reflectionSlots = buildReflectionItemKeys(days, liveStateMap);

  // ---------------------------------------------------------------------------
  // Step handlers — all hooks must be defined before any conditional return
  // ---------------------------------------------------------------------------

  const handleError = useCallback((msg?: string) => {
    setError(msg ?? t(NS, "errors.save_failed"));
  }, [t]);

  const handleOverallFeeling = useCallback(
    (feeling: OverallFeeling) => {
      startTransition(async () => {
        setError(null);
        const res = await saveReflectionOverallFeeling(tripId, feeling);
        if (res.error) { handleError(res.error); return; }
        setReflection((r) => ({ ...r, overall_feeling: feeling }));
        track("Reflection Step Completed", { step: "overall" });
        setStep("pace");
      });
    },
    [tripId, handleError]
  );

  const handlePaceAndPlanning = useCallback(
    (pace: PaceReflection, planning: PlanningComfort) => {
      startTransition(async () => {
        setError(null);
        const res = await saveReflectionPaceAndPlanning(tripId, pace, planning);
        if (res.error) { handleError(res.error); return; }
        setReflection((r) => ({ ...r, pace_reflection: pace, planning_comfort: planning }));
        track("Reflection Step Completed", { step: "pace" });
        setStep("items");
      });
    },
    [tripId, handleError]
  );

  const handleItemRating = useCallback(
    (itemKey: string, value: ItemReflection) => {
      startTransition(async () => {
        setError(null);
        const res = await saveReflectionItem(tripId, itemKey, value);
        if (res.error) { handleError(res.error); return; }
        setRatingMap((m) => ({ ...m, [itemKey]: value }));
      });
    },
    [tripId, handleError]
  );

  const handleItemsNext = useCallback(() => {
    // Derive candidates deterministically from current state
    const ratingItems: TripReflectionItem[] = Object.entries(ratingMap).map(([item_key, value]) => ({
      id: "",
      user_id: "",
      trip_id: tripId,
      item_key,
      value,
      created_at: "",
      updated_at: "",
    }));

    const derived = buildTripLearningCandidates({
      tripId,
      days,
      overallFeeling: (reflection.overall_feeling as OverallFeeling | undefined) ?? null,
      paceReflection: (reflection.pace_reflection as PaceReflection | undefined) ?? null,
      planningComfort: (reflection.planning_comfort as PlanningComfort | undefined) ?? null,
      reflectionItems: ratingItems,
    });

    setCandidates(derived);
    track("Reflection Step Completed", { step: "items" });
    setStep("memory");
  }, [tripId, days, ratingMap, reflection]);

  const handleReturnIntent = useCallback(
    (intent: ReturnIntent) => {
      startTransition(async () => {
        setError(null);
        const res = await saveReflectionReturnIntent(
          tripId,
          intent,
          intent === "YES" || intent === "MAYBE" ? returnIntentDestination || null : null
        );
        if (res.error) { handleError(res.error); return; }
        setReflection((r) => ({ ...r, return_intent: intent }));
      });
    },
    [tripId, returnIntentDestination, handleError]
  );

  const handleConfirmCandidate = useCallback(
    (candidate: TripLearningCandidate) => {
      startTransition(async () => {
        setError(null);
        const res = await confirmLearningCandidate(tripId, candidate);
        if (res.error) { handleError(res.error); return; }
        setDecisions((d) => ({ ...d, [candidate.candidate_key]: "CONFIRMED" }));
        track("Learning Candidate Confirmed", { domain: candidate.domain });
        track("Reflection Memory Promoted", { domain: candidate.domain });
      });
    },
    [tripId, handleError]
  );

  const handleRejectCandidate = useCallback(
    (candidate: TripLearningCandidate) => {
      startTransition(async () => {
        setError(null);
        const res = await rejectLearningCandidate(tripId, candidate.candidate_key, candidate);
        if (res.error) { handleError(res.error); return; }
        setDecisions((d) => ({ ...d, [candidate.candidate_key]: "REJECTED" }));
        track("Learning Candidate Rejected", { domain: candidate.domain });
      });
    },
    [tripId, handleError]
  );

  const handleDeferCandidate = useCallback(
    (candidate: TripLearningCandidate) => {
      startTransition(async () => {
        setError(null);
        const res = await deferLearningCandidate(tripId, candidate.candidate_key);
        if (res.error) { handleError(res.error); return; }
        setDecisions((d) => ({ ...d, [candidate.candidate_key]: "DEFERRED" }));
        track("Learning Candidate Deferred", { domain: candidate.domain });
      });
    },
    [tripId, handleError]
  );

  const handleComplete = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await completeReflection(tripId);
      if (res.error) { handleError(res.error); return; }
      track("Reflection Completed", {});
      setStep("done");
    });
  }, [tripId, handleError]);

  const handleDismiss = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const res = await dismissReflection(tripId);
      if (res.error) { handleError(res.error); return; }
      track("Reflection Dismissed", {});
      setDismissConfirmOpen(false);
    });
  }, [tripId, handleError]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!eligibility.eligible) {
    return (
      <div className="max-w-lg rounded-lg border border-border bg-muted/30 px-6 py-8">
        <p className="text-sm text-muted-foreground">{t(NS, "page.not_eligible")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      {/* Timing frame */}
      {step === "overall" && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-sm font-medium text-foreground/90">{t(NS, `timing.${timingKey}`)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t(NS, `timing.${timingKey}_body`)}</p>
        </div>
      )}

      {/* Step progress */}
      <StepIndicator currentStep={step} t={t} />

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* --- STEP: Overall feeling --- */}
      {step === "overall" && (
        <OverallFeelingStep
          current={(reflection.overall_feeling as OverallFeeling | undefined) ?? null}
          onSelect={handleOverallFeeling}
          pending={isPending}
          t={t}
        />
      )}

      {/* --- STEP: Pace & planning --- */}
      {step === "pace" && (
        <PaceStep
          currentPace={(reflection.pace_reflection as PaceReflection | undefined) ?? null}
          currentPlanning={(reflection.planning_comfort as PlanningComfort | undefined) ?? null}
          onSubmit={handlePaceAndPlanning}
          pending={isPending}
          t={t}
        />
      )}

      {/* --- STEP: Item reflection --- */}
      {step === "items" && (
        <ItemsStep
          slots={reflectionSlots}
          ratings={ratingMap}
          onRate={handleItemRating}
          onNext={handleItemsNext}
          pending={isPending}
          t={t}
        />
      )}

      {/* --- STEP: Memory candidates --- */}
      {step === "memory" && (
        <MemoryStep
          candidates={candidates}
          decisions={decisions}
          returnIntent={(reflection.return_intent as ReturnIntent | undefined) ?? null}
          returnIntentDestination={returnIntentDestination}
          onReturnIntentChange={setReturnIntentDestination}
          onReturnIntent={handleReturnIntent}
          privateNote={privateNote}
          onPrivateNoteChange={setPrivateNote}
          onSaveNote={() => {
            startTransition(async () => {
              await saveReflectionPrivateNote(tripId, privateNote);
            });
          }}
          onConfirm={handleConfirmCandidate}
          onReject={handleRejectCandidate}
          onDefer={handleDeferCandidate}
          onComplete={handleComplete}
          pending={isPending}
          t={t}
        />
      )}

      {/* --- STEP: Done --- */}
      {step === "done" && (
        <DoneStep t={t} />
      )}

      {/* Dismiss option (available until completed) */}
      {step !== "done" && (
        <div className="pt-2">
          {dismissConfirmOpen ? (
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-sm font-medium">{t(NS, "dismiss.confirm_title")}</p>
              <p className="text-sm text-muted-foreground">{t(NS, "dismiss.confirm_body")}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDismiss}
                  disabled={isPending}
                  className="text-sm text-destructive hover:text-destructive/80 transition-colors"
                >
                  {t(NS, "dismiss.confirm_cta")}
                </button>
                <button
                  onClick={() => setDismissConfirmOpen(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(NS, "dismiss.cancel_cta")}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setDismissConfirmOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(NS, "dismiss.cta")}
            </button>
          )}
        </div>
      )}

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground/60">{t(NS, "privacy.note")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type TFn = ReturnType<typeof useLocale>["t"];

function StepIndicator({ currentStep, t }: { currentStep: Step; t: TFn }) {
  const stepKeys: Array<{ key: Step; label: string }> = [
    { key: "overall", label: t(NS, "steps.overall") },
    { key: "pace", label: t(NS, "steps.pace") },
    { key: "items", label: t(NS, "steps.items") },
    { key: "memory", label: t(NS, "steps.memory") },
    { key: "done", label: t(NS, "steps.done") },
  ];

  return (
    <div className="flex items-center gap-2" aria-label="Reflection progress">
      {stepKeys.map(({ key, label }, idx) => {
        const currentIdx = STEPS.indexOf(currentStep);
        const isActive = key === currentStep;
        const isDone = idx < currentIdx;

        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={`text-xs font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : isDone
                  ? "text-primary"
                  : "text-muted-foreground/40"
              }`}
            >
              {label}
            </span>
            {idx < stepKeys.length - 1 && (
              <span className="text-muted-foreground/30 text-xs">·</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OverallFeelingStep({
  current,
  onSelect,
  pending,
  t,
}: {
  current: OverallFeeling | null;
  onSelect: (f: OverallFeeling) => void;
  pending: boolean;
  t: TFn;
}) {
  const options: OverallFeeling[] = ["LOVED_IT", "GOOD_TRIP", "MIXED", "NOT_MY_TRIP", "PREFER_NOT_TO_SAY"];
  const keyMap: Record<OverallFeeling, string> = {
    LOVED_IT: "overall.loved_it",
    GOOD_TRIP: "overall.good_trip",
    MIXED: "overall.mixed",
    NOT_MY_TRIP: "overall.not_my_trip",
    PREFER_NOT_TO_SAY: "overall.prefer_not_to_say",
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">{t(NS, "overall.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(NS, "overall.subtitle")}</p>
      </div>
      <div className="flex flex-col gap-2">
        {options.map((feeling) => (
          <button
            key={feeling}
            onClick={() => onSelect(feeling)}
            disabled={pending}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
              current === feeling
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border hover:border-primary/40 hover:bg-muted/30 text-foreground/80"
            }`}
          >
            {t(NS, keyMap[feeling])}
          </button>
        ))}
      </div>
    </div>
  );
}

function PaceStep({
  currentPace,
  currentPlanning,
  onSubmit,
  pending,
  t,
}: {
  currentPace: PaceReflection | null;
  currentPlanning: PlanningComfort | null;
  onSubmit: (pace: PaceReflection, planning: PlanningComfort) => void;
  pending: boolean;
  t: TFn;
}) {
  const [pace, setPace] = useState<PaceReflection | null>(currentPace);
  const [planning, setPlanning] = useState<PlanningComfort | null>(currentPlanning);

  const paceOptions: PaceReflection[] = ["TOO_SLOW", "JUST_RIGHT", "A_LITTLE_FULL", "TOO_FULL", "UNKNOWN"];
  const paceKeys: Record<PaceReflection, string> = {
    TOO_SLOW: "pace.too_slow",
    JUST_RIGHT: "pace.just_right",
    A_LITTLE_FULL: "pace.a_little_full",
    TOO_FULL: "pace.too_full",
    UNKNOWN: "pace.unknown",
  };

  const planningOptions: PlanningComfort[] = ["MORE_STRUCTURE", "CURRENT_LEVEL", "MORE_FLEXIBILITY", "UNKNOWN"];
  const planningKeys: Record<PlanningComfort, string> = {
    MORE_STRUCTURE: "pace.more_structure",
    CURRENT_LEVEL: "pace.current_level",
    MORE_FLEXIBILITY: "pace.more_flexibility",
    UNKNOWN: "pace.planning_unknown",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">{t(NS, "pace.title")}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {paceOptions.map((p) => (
          <button
            key={p}
            onClick={() => setPace(p)}
            disabled={pending}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
              pace === p
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border hover:border-primary/40 hover:bg-muted/30 text-foreground/80"
            }`}
          >
            {t(NS, paceKeys[p])}
          </button>
        ))}
      </div>

      <div>
        <h3 className="text-base font-semibold text-foreground">{t(NS, "pace.planning_title")}</h3>
        <div className="mt-2 flex flex-col gap-2">
          {planningOptions.map((p) => (
            <button
              key={p}
              onClick={() => setPlanning(p)}
              disabled={pending}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                planning === p
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/40 hover:bg-muted/30 text-foreground/80"
              }`}
            >
              {t(NS, planningKeys[p])}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (pace && planning) onSubmit(pace, planning);
        }}
        disabled={!pace || !planning || pending}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function ItemsStep({
  slots,
  ratings,
  onRate,
  onNext,
  pending,
  t,
}: {
  slots: Array<{ item_key: string; suggested_value: ItemReflection }>;
  ratings: Record<string, ItemReflection>;
  onRate: (key: string, value: ItemReflection) => void;
  onNext: () => void;
  pending: boolean;
  t: TFn;
}) {
  const ratingOptions: ItemReflection[] = ["LOVED", "LIKED", "NEUTRAL", "WOULD_SKIP", "NOT_EXPERIENCED"];
  const ratingKeys: Record<ItemReflection, string> = {
    LOVED: "items.loved",
    LIKED: "items.liked",
    NEUTRAL: "items.neutral",
    WOULD_SKIP: "items.would_skip",
    NOT_EXPERIENCED: "items.not_experienced",
  };

  function slotLabel(itemKey: string): string {
    const match = itemKey.match(/^day(\d+):(.+)$/);
    if (!match) return itemKey;
    const [, day, slot] = match;
    const slotLabel = t(NS, `items.slot_${slot === "food" ? "food" : slot}`);
    return `Day ${day} — ${slotLabel}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-semibold text-foreground">{t(NS, "items.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t(NS, "items.subtitle")}</p>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t(NS, "memory.empty")}</p>
      ) : (
        <div className="space-y-4">
          {slots.map(({ item_key, suggested_value }) => {
            const current = ratings[item_key] ?? suggested_value;
            return (
              <div key={item_key} className="space-y-2">
                <p className="text-sm font-medium text-foreground/90">{slotLabel(item_key)}</p>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => onRate(item_key, r)}
                      disabled={pending}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        current === r
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      {t(NS, ratingKeys[r])}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={pending}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}

function MemoryStep({
  candidates,
  decisions,
  returnIntent,
  returnIntentDestination,
  onReturnIntentChange,
  onReturnIntent,
  privateNote,
  onPrivateNoteChange,
  onSaveNote,
  onConfirm,
  onReject,
  onDefer,
  onComplete,
  pending,
  t,
}: {
  candidates: TripLearningCandidate[];
  decisions: Record<string, import("@/lib/types").CandidateDecision>;
  returnIntent: ReturnIntent | null;
  returnIntentDestination: string;
  onReturnIntentChange: (v: string) => void;
  onReturnIntent: (i: ReturnIntent) => void;
  privateNote: string;
  onPrivateNoteChange: (v: string) => void;
  onSaveNote: () => void;
  onConfirm: (c: TripLearningCandidate) => void;
  onReject: (c: TripLearningCandidate) => void;
  onDefer: (c: TripLearningCandidate) => void;
  onComplete: () => void;
  pending: boolean;
  t: TFn;
}) {
  const returnOptions: ReturnIntent[] = ["YES", "MAYBE", "NO", "PREFER_NOT_TO_SAY"];
  const returnKeys: Record<ReturnIntent, string> = {
    YES: "return.yes",
    MAYBE: "return.maybe",
    NO: "return.no",
    PREFER_NOT_TO_SAY: "return.prefer_not_to_say",
  };

  const confidenceLabels: Record<import("@/lib/types").CandidateConfidenceBasis, string> = {
    HIGH: t(NS, "memory.candidate_high"),
    MEDIUM: t(NS, "memory.candidate_medium"),
    LOW: t(NS, "memory.candidate_low"),
  };

  return (
    <div className="space-y-8">
      {/* Return intent */}
      <div className="space-y-3">
        <h2 className="text-xl font-serif font-semibold text-foreground">{t(NS, "return.title")}</h2>
        <div className="flex flex-col gap-2">
          {returnOptions.map((intent) => (
            <button
              key={intent}
              onClick={() => onReturnIntent(intent)}
              disabled={pending}
              className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors ${
                returnIntent === intent
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border hover:border-primary/40 hover:bg-muted/30 text-foreground/80"
              }`}
            >
              {t(NS, returnKeys[intent])}
            </button>
          ))}
        </div>
        {(returnIntent === "YES" || returnIntent === "MAYBE") && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {t(NS, "return.destination_prompt")}
            </label>
            <input
              type="text"
              value={returnIntentDestination}
              onChange={(e) => onReturnIntentChange(e.target.value)}
              onBlur={() => returnIntent && onReturnIntent(returnIntent)}
              placeholder={t(NS, "return.destination_placeholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}
      </div>

      {/* Memory candidates */}
      {candidates.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">{t(NS, "memory.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t(NS, "memory.subtitle")}</p>
          </div>
          <div className="space-y-3">
            {candidates.map((c) => {
              const decision = decisions[c.candidate_key];
              return (
                <div
                  key={c.candidate_key}
                  className={`rounded-lg border p-4 transition-colors ${
                    decision === "CONFIRMED"
                      ? "border-primary/40 bg-primary/5"
                      : decision === "REJECTED"
                      ? "border-destructive/20 bg-muted/30 opacity-60"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-foreground/90">{c.evidence_summary}</p>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      {confidenceLabels[c.confidence_basis]}
                    </span>
                  </div>
                  {!decision && (
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => onConfirm(c)}
                        disabled={pending}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        {t(NS, "memory.confirm_cta")}
                      </button>
                      <button
                        onClick={() => onReject(c)}
                        disabled={pending}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {t(NS, "memory.reject_cta")}
                      </button>
                      <button
                        onClick={() => onDefer(c)}
                        disabled={pending}
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        {t(NS, "memory.defer_cta")}
                      </button>
                    </div>
                  )}
                  {decision === "CONFIRMED" && (
                    <p className="text-xs text-primary mt-1">{t(NS, "memory.confirm_cta")} ✓</p>
                  )}
                  {decision === "REJECTED" && (
                    <p className="text-xs text-muted-foreground mt-1">{t(NS, "memory.reject_cta")}</p>
                  )}
                </div>
              );
            })}
          </div>
          {candidates.length === 0 && (
            <p className="text-sm text-muted-foreground">{t(NS, "memory.empty")}</p>
          )}
        </div>
      )}

      {/* Private note */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">{t(NS, "note.title")}</h3>
        <p className="text-sm text-muted-foreground">{t(NS, "note.subtitle")}</p>
        <textarea
          value={privateNote}
          onChange={(e) => onPrivateNoteChange(e.target.value)}
          onBlur={onSaveNote}
          placeholder={t(NS, "note.placeholder")}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <p className="text-xs text-muted-foreground/60">{t(NS, "note.privacy_label")}</p>
      </div>

      <button
        onClick={onComplete}
        disabled={pending}
        className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {t(NS, "steps.done")}
      </button>
    </div>
  );
}

function DoneStep({ t }: { t: TFn }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-foreground">{t(NS, "complete.title")}</h2>
      <p className="text-sm text-muted-foreground">{t(NS, "complete.body")}</p>
      <div className="flex gap-4">
        <a href="/planner" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          {t(NS, "complete.cta_planner")}
        </a>
        <a href="/my-trips" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          {t(NS, "complete.cta_trips")}
        </a>
      </div>
    </div>
  );
}
