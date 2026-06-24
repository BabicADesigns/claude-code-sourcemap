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
  TRIP_PACE_LABELS,
  type PlannerStyle,
  type RouteVariant,
  type TripPace,
} from "@/lib/types";
import { cn, slugify } from "@/lib/utils";
import { saveItinerary } from "@/lib/actions/itineraries";
import { generateItineraryPdfBlob } from "@/lib/pdf/generate-itinerary-pdf";
import { ItineraryView } from "@/components/planner/itinerary-view";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const plannerStyleEntries = Object.entries(PLANNER_STYLE_LABELS) as [PlannerStyle, string][];
const paceEntries = Object.entries(TRIP_PACE_LABELS) as [TripPace, string][];
const routeVariantEntries = Object.entries(ROUTE_VARIANT_LABELS) as [RouteVariant, string][];

const PACE_HINTS: Record<TripPace, string> = {
  relaxed: "Fewer stops, more time to linger",
  balanced: "A steady mix of moving and staying",
  active: "More ground covered, fuller days",
};

const defaultValues: PlannerInput = {
  durationDays: 7,
  month: "June",
  budget: "mid_range",
  country: null,
  pace: "balanced",
  plannerStyle: "slow_travel",
  interests: [INTEREST_OPTIONS[0]],
};

const STEPS = ["Destination", "Trip length & pace", "Style & budget", "Interests", "Review"] as const;

const STEP_FIELDS: (keyof PlannerInput)[][] = [
  ["country"],
  ["durationDays", "month", "pace"],
  ["plannerStyle", "budget"],
  ["interests"],
  [],
];

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

export function PlannerFlow() {
  const router = useRouter();
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
    defaultValues,
  });

  const selectedInterests = watch("interests");
  const values = watch();

  function toggleInterest(interest: string) {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    setValue("interests", next, { shouldValidate: true });
  }

  async function goNext() {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
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
      if (!res.ok) throw new Error("The planner couldn't put this trip together. Please try again.");
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
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  const activeItinerary = itineraries?.[selectedVariant] ?? null;

  async function exportPdf() {
    if (!activeItinerary || !submittedInput) return;
    setIsExporting(true);
    try {
      const blob = await generateItineraryPdfBlob(activeItinerary, submittedInput);
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
            {isExporting ? "Preparing PDF…" : "Export Premium PDF — €14.99"}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="outline" onClick={handleSaveItinerary} disabled={isSavingItinerary}>
            {isSavingItinerary ? "Saving…" : itinerarySaved ? "Saved to My Balkans" : "Save to My Balkans"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setItineraries(null);
              setSubmittedInput(null);
              setStep(0);
            }}
          >
            Plan another trip
          </Button>
        </div>
        {saveError && <p className="mt-3 font-sans text-sm text-destructive print:hidden">{saveError}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <div className="mt-3 flex items-center justify-between font-sans text-xs uppercase tracking-widest text-muted-foreground">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {step === 0 && (
          <div>
            <Label>Where in the Balkans?</Label>
            <p className="mt-1 font-serif text-sm text-foreground/70">
              Pick a country to focus on, or leave it open and we&rsquo;ll draw from the whole region.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <>
                    <OptionCard
                      selected={field.value === null}
                      label="No preference"
                      description="Across the Balkans"
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
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="durationDays">Trip length (days)</Label>
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
              <Label htmlFor="month">Travel month</Label>
              <Controller
                control={control}
                name="month"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="month" className="mt-2">
                      <SelectValue placeholder="Choose a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Pace</Label>
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
            <Label>Travel style</Label>
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
              <Label>Budget</Label>
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
            <Label>Interests</Label>
            <p className="mt-1 font-serif text-sm text-foreground/70">
              Pick a few — these shape the hidden gems and day trips we surface.
            </p>
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
          <div>
            <Label>Review your trip</Label>
            <dl className="mt-4 grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 sm:p-5">
              <ReviewRow label="Destination" value={values.country ?? "No preference — across the Balkans"} />
              <ReviewRow label="Trip length" value={`${values.durationDays} days in ${values.month}`} />
              <ReviewRow label="Pace" value={TRIP_PACE_LABELS[values.pace]} />
              <ReviewRow label="Travel style" value={PLANNER_STYLE_LABELS[values.plannerStyle]} />
              <ReviewRow label="Budget" value={BUDGET_TIER_LABELS[values.budget]} />
              <ReviewRow label="Interests" value={values.interests.join(", ")} />
            </dl>
            <p className="mt-4 font-serif text-sm text-foreground/70">
              We&rsquo;ll generate three route options — Conservative, Balanced, and Explorer — so you can compare a
              slower pace against a fuller one.
            </p>
          </div>
        )}

        {error && <p className="mt-6 font-sans text-sm text-destructive">{error}</p>}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Planning your trip…" : "Generate my itinerary"}
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
