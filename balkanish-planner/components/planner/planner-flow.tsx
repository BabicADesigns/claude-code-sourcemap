"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BUDGET_TIER_LABELS,
  BUDGET_TIERS,
  INTEREST_OPTIONS,
  plannerInputSchema,
  type GeneratedItinerary,
  type PlannerInput,
} from "@/lib/ai/itinerary";
import { TRAVEL_STYLE_LABELS, type TravelStyle } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const travelStyleEntries = Object.entries(TRAVEL_STYLE_LABELS) as [TravelStyle, string][];

const defaultValues: PlannerInput = {
  durationDays: 7,
  month: "June",
  budget: "mid_range",
  travelStyle: "slow_and_soulful",
  interests: [INTEREST_OPTIONS[0]],
};

export function PlannerFlow() {
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [submittedInput, setSubmittedInput] = useState<PlannerInput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlannerInput>({
    resolver: zodResolver(plannerInputSchema),
    defaultValues,
  });

  const selectedInterests = watch("interests");

  function toggleInterest(interest: string) {
    const next = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    setValue("interests", next, { shouldValidate: true });
  }

  async function onSubmit(values: PlannerInput) {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("The planner couldn't put this trip together. Please try again.");
      const data = await res.json();
      setItinerary(data.itinerary);
      setSubmittedInput(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function exportPdf() {
    if (!itinerary || !submittedInput) return;
    setIsExporting(true);
    try {
      const [{ pdf }, { ItineraryPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/planner/itinerary-pdf"),
      ]);
      const blob = await pdf(
        <ItineraryPdfDocument itinerary={itinerary} input={submittedInput} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(itinerary.trip_title)}-balkanish-itinerary.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  if (itinerary && submittedInput) {
    return (
      <div className="max-w-3xl">
        <p className="font-sans text-xs uppercase tracking-widest text-accent">Your itinerary</p>
        <h2 className="mt-2 font-display text-4xl text-sage-dark">{itinerary.trip_title}</h2>
        <p className="mt-3 font-serif text-foreground/85">{itinerary.overview}</p>

        <div className="mt-8 flex flex-col gap-6">
          {itinerary.days.map((day) => (
            <div key={day.day} className="rounded-md border border-border p-5">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Day {day.day}</p>
              <h3 className="mt-1 font-display text-2xl text-sage-dark">{day.title}</h3>
              <p className="mt-2 font-serif text-sm text-foreground/85">{day.summary}</p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Morning</dt>
                  <dd className="font-serif text-sm text-foreground/85">{day.morning}</dd>
                </div>
                <div>
                  <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Afternoon</dt>
                  <dd className="font-serif text-sm text-foreground/85">{day.afternoon}</dd>
                </div>
                <div>
                  <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Evening</dt>
                  <dd className="font-serif text-sm text-foreground/85">{day.evening}</dd>
                </div>
                <div>
                  <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Food highlight</dt>
                  <dd className="font-serif text-sm text-foreground/85">{day.food_highlight}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <PlannerListSection title="Hidden gems" items={itinerary.hidden_gems} />
          <PlannerListSection title="Restaurants worth the detour" items={itinerary.restaurant_picks} />
          <PlannerListSection title="Culture notes" items={itinerary.culture_notes} />
          <PlannerListSection title="Packing list" items={itinerary.packing_list} />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button onClick={exportPdf} disabled={isExporting}>
            {isExporting ? "Preparing PDF…" : "Export Premium PDF — €14.99"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setItinerary(null);
              setSubmittedInput(null);
            }}
          >
            Plan another trip
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
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

        <div>
          <Label htmlFor="budget">Budget</Label>
          <Controller
            control={control}
            name="budget"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="budget" className="mt-2">
                  <SelectValue placeholder="Choose a budget" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {BUDGET_TIER_LABELS[tier]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="travelStyle">Travel style</Label>
          <Controller
            control={control}
            name="travelStyle"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="travelStyle" className="mt-2">
                  <SelectValue placeholder="Choose a style" />
                </SelectTrigger>
                <SelectContent>
                  {travelStyleEntries.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="mt-6">
        <Label>Interests</Label>
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

      {error && <p className="mt-6 font-sans text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-8" disabled={isGenerating}>
        {isGenerating ? "Planning your trip…" : "Generate my itinerary"}
      </Button>
    </form>
  );
}

function PlannerListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-display text-xl text-sage-dark">{title}</h4>
      <ul className="mt-3 flex flex-col gap-2 font-serif text-sm text-foreground/85">
        {items.map((item, i) => (
          <li key={i}>— {item}</li>
        ))}
      </ul>
    </div>
  );
}
