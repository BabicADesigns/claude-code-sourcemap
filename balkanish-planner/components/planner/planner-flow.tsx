"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BUDGET_TIER_LABELS,
  BUDGET_TIERS,
  INTEREST_OPTIONS,
  defaultVariantForPace,
  plannerInputSchema,
  type GeneratedItinerary,
  type PlannerInput,
} from "@/lib/ai/itinerary";
import {
  COUNTRIES,
  PLANNER_STYLE_LABELS,
  ROUTE_VARIANT_LABELS,
  TRAVEL_MOOD_LABELS,
  CUISINE_PREFERENCE_LABELS,
  TRIP_PACE_LABELS,
  type PlannerStyle,
  type RouteVariant,
  type TripPace,
  type TravelMood,
  type CuisinePreference,
  type Profile,
} from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { saveItinerary } from "@/lib/actions/itineraries";
import { generateItineraryPdfBlob } from "@/lib/pdf/generate-itinerary-pdf";
import { ItineraryView } from "@/components/planner/itinerary-view";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const plannerStyleEntries = Object.entries(PLANNER_STYLE_LABELS) as [PlannerStyle, string][];
const paceEntries = Object.entries(TRIP_PACE_LABELS) as [TripPace, string][];
const routeVariantEntries = Object.entries(ROUTE_VARIANT_LABELS) as [RouteVariant, string][];

function buildDefaultValues(profile?: Profile | null): PlannerInput {
  return {
    durationDays: 7,
    month: "June",
    budget: profile?.budget_preference ?? "mid_range",
    country: null,
    pace: profile?.travel_pace ?? "balanced",
    plannerStyle: "slow_travel",
    interests: [INTEREST_OPTIONS[0]],
    discoveryQuery: "",
    travel_mood: undefined,
    cuisine_preferences: (profile?.cuisine_preferences as CuisinePreference[] | undefined) ?? [],
  };
}

const STEP_KEYS = ["destination", "tripLength", "style", "interests", "vibe", "review"] as const;

const STEP_FIELDS: (keyof PlannerInput)[][] = [
  ["country"],
  ["durationDays", "month", "pace"],
  ["plannerStyle", "budget"],
  ["interests"],
  [], // travel_mood and cuisine_preferences are optional — no required validation
  [],
];

const travelMoodEntries = Object.entries(TRAVEL_MOOD_LABELS) as [TravelMood, string][];
const cuisinePreferenceEntries = Object.entries(CUISINE_PREFERENCE_LABELS) as [CuisinePreference, string][];

function OptionCard({
  selected,
  label,
  description,
  onClick,
}: {
  selected: boolean;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected ? "border-accent bg-accent/10" : "border-border hover:border-accent/40"
      )}
    >
      <p className="font-sans text-sm font-medium text-foreground">{label}</p>
      {description && <p className="mt-1 font-serif text-xs text-foreground/70">{description}</p>}
    </button>
  );
}

export function PlannerFlow({ profile }: { profile?: Profile | null } = {}) {
  const router = useRouter();
  const { t, tList, locale } = useLocale();
  const [step, setStep] = useState(0);
  const [itineraries, setItineraries] = useState<Record<RouteVariant, GeneratedItinerary> | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<RouteVariant>("balanced");
  const [submittedInput, setSubmittedInput] = useState<PlannerInput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingItinerary, setIsSavingItinerary] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [itinerarySaved, setItinerarySaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<PlannerInput>({
    resolver: zodResolver(plannerInputSchema),
    defaultValues: buildDefaultValues(profile),
  });

  const selectedInterests = watch("interests");
  const selectedCuisine = watch("cuisine_preferences") ?? [];
  const values = watch();

  const monthLabels = tList("planner", "months");
  const months = MONTHS_EN.map((month, i) => ({ value: month, label: monthLabels[i] ?? month }));
  const reviewMonthLabel = monthLabels[MONTHS_EN.indexOf(values.month as (typeof MONTHS_EN)[number])] ?? values.month;
  const PACE_HINTS: Record<TripPace, string> = {
    relaxed: t("planner", "tripLengthStep.paceHints.relaxed"),
    balanced: t("planner", "tripLengthStep.paceHints.balanced"),
    active: t("planner", "tripLengthStep.paceHints.active"),
  };

  function toggleInterest(interest: string) {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    setValue("interests", next, { shouldValidate: true });
  }

  function toggleCuisine(pref: CuisinePreference) {
    const current = selectedCuisine as CuisinePreference[];
    const next = current.includes(pref)
      ? current.filter((c) => c !== pref)
      : [...current, pref];
    setValue("cuisine_preferences", next);
  }

  async function goNext() {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEP_KEYS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(submitted: PlannerInput) {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted),
      });
      if (!res.ok) throw new Error(t("planner", "errors.generateFailed"));
      const data = await res.json();
      setItineraries(data.itineraries);
      setSelectedVariant(defaultVariantForPace(submitted.pace));
      setSubmittedInput(submitted);
      setItinerarySaved(false);
      track(ANALYTICS_EVENTS.ITINERARY_GENERATED, {
        durationDays: submitted.durationDays,
        month: submitted.month,
        budget: submitted.budget,
        plannerStyle: submitted.plannerStyle,
        pace: submitted.pace,
        country: submitted.country ?? "any",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("planner", "errors.generic"));
    } finally {
      setIsGenerating(false);
    }
  }

  const activeItinerary = itineraries?.[selectedVariant] ?? null;

  async function exportPdf() {
    if (!activeItinerary || !submittedInput) return;
    setIsExporting(true);
    try {
      const blob = await generateItineraryPdfBlob(activeItinerary, submittedInput, locale);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(activeItinerary.trip_title)}-balkanish-itinerary.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSaveItinerary() {
    if (!activeItinerary || !submittedInput) return;
    setIsSavingItinerary(true);
    setSaveError(null);
    const result = await saveItinerary(activeItinerary, submittedInput);
    setIsSavingItinerary(false);
    if (result.error) {
      if (result.error.toLowerCase().includes("sign in")) {
        router.push("/sign-in");
        return;
      }
      setSaveError(result.error);
      return;
    }
    setItinerarySaved(true);
  }

  if (itineraries && submittedInput && activeItinerary) {
    return (
      <div className="max-w-3xl print:max-w-none">
        <Tabs
          value={selectedVariant}
          onValueChange={(v) => setSelectedVariant(v as RouteVariant)}
          className="print:hidden"
        >
          <TabsList>
            {routeVariantEntries.map(([value, label]) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 print:mt-0">
          <ItineraryView itinerary={activeItinerary} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 sm:mt-10 print:hidden">
          <Button onClick={exportPdf} disabled={isExporting}>
            {isExporting ? t("planner", "result.preparingPdf") : t("planner", "result.exportPdf")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            {t("planner", "result.print")}
          </Button>
          <Button variant="outline" onClick={handleSaveItinerary} disabled={isSavingItinerary}>
            {isSavingItinerary
              ? t("planner", "result.saving")
              : itinerarySaved
                ? t("planner", "result.saved")
                : t("planner", "result.save")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setItineraries(null);
              setSubmittedInput(null);
              setStep(0);
            }}
          >
            {t("planner", "result.planAnotherTrip")}
          </Button>
        </div>
        {saveError && <p className="mt-3 font-sans text-sm text-destructive print:hidden">{saveError}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Progress value={((step + 1) / STEP_KEYS.length) * 100} />
        <div className="mt-3 flex items-center justify-between font-sans text-xs uppercase tracking-widest text-muted-foreground">
          <span>{t("planner", "stepIndicator", { current: step + 1, total: STEP_KEYS.length })}</span>
          <span>{t("planner", `steps.${STEP_KEYS[step]}`)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <div>
            <Label>{t("planner", "destinationStep.heading")}</Label>
            <p className="mt-1 font-serif text-sm text-foreground/70">{t("planner", "destinationStep.description")}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <>
                    <OptionCard
                      selected={field.value === null}
                      label={t("planner", "destinationStep.noPreference")}
                      description={t("planner", "destinationStep.noPreferenceDescription")}
                      onClick={() => field.onChange(null)}
                    />
                    {COUNTRIES.map((country) => (
                      <OptionCard
                        key={country}
                        selected={field.value === country}
                        label={country}
                        onClick={() => field.onChange(country)}
                      />
                    ))}
                  </>
                )}
              />
            </div>

            <div className="mt-6">
              <Label htmlFor="discoveryQuery">{t("planner", "discoveryStep.label")}</Label>
              <p className="mt-1 font-serif text-sm text-foreground/70">{t("planner", "discoveryStep.description")}</p>
              <Input
                id="discoveryQuery"
                className="mt-2"
                placeholder={t("planner", "discoveryStep.placeholder")}
                {...register("discoveryQuery")}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="durationDays">{t("planner", "tripLengthStep.durationLabel")}</Label>
              <Input
                id="durationDays"
                type="number"
                min={2}
                max={21}
                className="mt-2"
                {...register("durationDays", { valueAsNumber: true })}
              />
              {errors.durationDays && (
                <p className="mt-1 font-sans text-xs text-destructive">{errors.durationDays.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="month">{t("planner", "tripLengthStep.monthLabel")}</Label>
              <Controller
                control={control}
                name="month"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="month" className="mt-2">
                      <SelectValue placeholder={t("planner", "tripLengthStep.monthPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>{t("planner", "tripLengthStep.paceLabel")}</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Controller
                  control={control}
                  name="pace"
                  render={({ field }) => (
                    <>
                      {paceEntries.map(([value, label]) => (
                        <OptionCard
                          key={value}
                          selected={field.value === value}
                          label={label}
                          description={PACE_HINTS[value]}
                          onClick={() => field.onChange(value)}
                        />
                      ))}
                    </>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Label>{t("planner", "styleStep.travelStyleLabel")}</Label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="plannerStyle"
                render={({ field }) => (
                  <>
                    {plannerStyleEntries.map(([value, label]) => (
                      <OptionCard
                        key={value}
                        selected={field.value === value}
                        label={label}
                        onClick={() => field.onChange(value)}
                      />
                    ))}
                  </>
                )}
              />
            </div>

            <div className="mt-6">
              <Label>{t("planner", "styleStep.budgetLabel")}</Label>
              <div className="mt-3 grid gap-3">
                <Controller
                  control={control}
                  name="budget"
                  render={({ field }) => (
                    <>
                      {BUDGET_TIERS.map((tier) => (
                        <OptionCard
                          key={tier}
                          selected={field.value === tier}
                          label={BUDGET_TIER_LABELS[tier]}
                          onClick={() => field.onChange(tier)}
                        />
                      ))}
                    </>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <Label>{t("planner", "interestsStep.label")}</Label>
            <p className="mt-1 font-serif text-sm text-foreground/70">{t("planner", "interestsStep.description")}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((interest) => (
                <label key={interest} className="flex items-center gap-3 font-serif text-sm text-foreground/90">
                  <Checkbox
                    checked={selectedInterests.includes(interest)}
                    onCheckedChange={() => toggleInterest(interest)}
                  />
                  {interest}
                </label>
              ))}
            </div>
            {errors.interests && <p className="mt-1 font-sans text-xs text-destructive">{errors.interests.message}</p>}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <Label>{t("planner", "vibeStep.moodLabel")}</Label>
              <p className="mt-1 font-serif text-sm text-foreground/70">{t("planner", "vibeStep.moodDescription")}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name="travel_mood"
                  render={({ field }) => (
                    <>
                      <OptionCard
                        label={t("planner", "vibeStep.noMood")}
                        selected={field.value === undefined || field.value === null}
                        onClick={() => field.onChange(undefined)}
                      />
                      {travelMoodEntries.map(([value, label]) => (
                        <OptionCard
                          key={value}
                          label={label}
                          selected={field.value === value}
                          onClick={() => field.onChange(value)}
                        />
                      ))}
                    </>
                  )}
                />
              </div>
            </div>

            <div>
              <Label>{t("planner", "vibeStep.cuisineLabel")}</Label>
              <p className="mt-1 font-serif text-sm text-foreground/70">{t("planner", "vibeStep.cuisineDescription")}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {cuisinePreferenceEntries.map(([value, label]) => (
                  <label key={value} className="flex items-center gap-3 font-serif text-sm text-foreground/90">
                    <Checkbox
                      checked={(selectedCuisine as CuisinePreference[]).includes(value)}
                      onCheckedChange={() => toggleCuisine(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <Label>{t("planner", "reviewStep.heading")}</Label>
            <dl className="mt-4 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 sm:p-5">
              <ReviewRow
                label={t("planner", "reviewStep.destinationLabel")}
                value={values.country ?? t("planner", "reviewStep.noPreferenceLong")}
              />
              <ReviewRow
                label={t("planner", "reviewStep.tripLengthLabel")}
                value={t("planner", "reviewStep.tripLengthValue", {
                  days: values.durationDays,
                  month: reviewMonthLabel,
                })}
              />
              <ReviewRow label={t("planner", "reviewStep.paceLabel")} value={TRIP_PACE_LABELS[values.pace]} />
              <ReviewRow
                label={t("planner", "reviewStep.travelStyleLabel")}
                value={PLANNER_STYLE_LABELS[values.plannerStyle]}
              />
              <ReviewRow label={t("planner", "reviewStep.budgetLabel")} value={BUDGET_TIER_LABELS[values.budget]} />
              <ReviewRow label={t("planner", "reviewStep.interestsLabel")} value={values.interests.join(", ")} />
              {values.travel_mood && (
                <ReviewRow
                  label={t("planner", "reviewStep.moodLabel")}
                  value={TRAVEL_MOOD_LABELS[values.travel_mood]}
                />
              )}
              {(values.cuisine_preferences as CuisinePreference[] | undefined)?.length ? (
                <ReviewRow
                  label={t("planner", "reviewStep.cuisineLabel")}
                  value={(values.cuisine_preferences as CuisinePreference[]).map((c) => CUISINE_PREFERENCE_LABELS[c]).join(", ")}
                />
              ) : null}
              {values.discoveryQuery?.trim() && (
                <ReviewRow label={t("planner", "reviewStep.discoveryLabel")} value={values.discoveryQuery} />
              )}
            </dl>
            <p className="mt-4 font-serif text-sm text-foreground/70">{t("planner", "reviewStep.variantsNote")}</p>
          </div>
        )}

        {error && <p className="mt-6 font-sans text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack}>
              {t("planner", "nav.back")}
            </Button>
          )}
          {step < STEP_KEYS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              {t("planner", "nav.continue")}
            </Button>
          ) : (
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? t("planner", "nav.generating") : t("planner", "nav.generate")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-serif text-sm text-foreground/85">{value}</dd>
    </div>
  );
}
