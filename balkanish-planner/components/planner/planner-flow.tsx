"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { saveItinerary } from "@/lib/actions/itineraries";
import { generateItineraryPdfBlob } from "@/lib/pdf/generate-itinerary-pdf";
import { ItineraryView } from "@/components/planner/itinerary-view";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
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
  const router = useRouter();
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
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
      setItinerarySaved(false);
      track(ANALYTICS_EVENTS.ITINERARY_GENERATED, {
        durationDays: values.durationDays,
        month: values.month,
        budget: values.budget,
        travelStyle: values.travelStyle,
      });
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
      const blob = await generateItineraryPdfBlob(itinerary, submittedInput);
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

  async function handleSaveItinerary() {
    if (!itinerary || !submittedInput) return;
    setIsSavingItinerary(true);
    setSaveError(null);
    const result = await saveItinerary(itinerary, submittedInput);
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

  if (itinerary && submittedInput) {
    return (
      <div className="max-w-3xl print:max-w-none">
        <ItineraryView itinerary={itinerary} />

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
              setItinerary(null);
              setSubmittedInput(null);
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
