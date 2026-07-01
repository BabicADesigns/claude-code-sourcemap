"use client";

import { useState, type FormEvent } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "@/lib/actions/profile";
import {
  TRAVEL_STYLE_LABELS,
  TRIP_PACE_LABELS,
  TRAVELER_INTEREST_LABELS,
  MOBILITY_OPTION_LABELS,
  CUISINE_PREFERENCE_LABELS,
  type Profile,
  type TravelStyle,
  type TripPace,
  type TravelerInterest,
  type MobilityOption,
  type CuisinePreference,
} from "@/lib/types";
import { LOCALES, LOCALE_LABELS, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

const BUDGET_OPTIONS = [
  { value: "budget", label: "Budget — hostels & konobas" },
  { value: "mid_range", label: "Mid-range — boutique stays" },
  { value: "premium", label: "Premium — design hotels" },
  { value: "luxury", label: "Luxury — private transfers" },
] as const;

type BudgetPreference = (typeof BUDGET_OPTIONS)[number]["value"];

export function ProfileForm({ email, profile }: { email: string; profile: Profile | null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [travelStyle, setTravelStyle] = useState<TravelStyle | "">(profile?.travel_style ?? "");
  const [favoriteRegion, setFavoriteRegion] = useState(profile?.favorite_region ?? "");
  const [preferredLanguage, setPreferredLanguage] = useState<Locale>(profile?.preferred_language ?? DEFAULT_LOCALE);
  // Phase 17 personalization
  const [travelPace, setTravelPace] = useState<TripPace | "">(profile?.travel_pace ?? "");
  const [budgetPreference, setBudgetPreference] = useState<BudgetPreference | "">(
    (profile?.budget_preference as BudgetPreference | undefined) ?? ""
  );
  const [interests, setInterests] = useState<TravelerInterest[]>((profile?.interests as TravelerInterest[] | undefined) ?? []);
  const [mobility, setMobility] = useState<MobilityOption[]>((profile?.mobility as MobilityOption[] | undefined) ?? []);
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisinePreference[]>(
    (profile?.cuisine_preferences as CuisinePreference[] | undefined) ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleInterest(v: TravelerInterest) {
    setInterests((prev) => (prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v]));
  }
  function toggleMobility(v: MobilityOption) {
    setMobility((prev) => (prev.includes(v) ? prev.filter((m) => m !== v) : [...prev, v]));
  }
  function toggleCuisine(v: CuisinePreference) {
    setCuisinePreferences((prev) => (prev.includes(v) ? prev.filter((c) => c !== v) : [...prev, v]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSaved(false);

    const formData = new FormData();
    formData.set("displayName", displayName);
    formData.set("country", country);
    formData.set("travelStyle", travelStyle);
    formData.set("favoriteRegion", favoriteRegion);
    formData.set("preferredLanguage", preferredLanguage);
    // Phase 17
    formData.set("travel_pace", travelPace);
    formData.set("budget_preference", budgetPreference);
    formData.set("interests", JSON.stringify(interests));
    formData.set("mobility", JSON.stringify(mobility));
    formData.set("cuisine_preferences", JSON.stringify(cuisinePreferences));

    const result = await updateProfile(formData);
    setIsSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm">
      <div className="flex flex-col gap-5">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled className="mt-2" />
        </div>

        <div>
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            className="mt-2"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" className="mt-2" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>

        <div>
          <Label htmlFor="travelStyle">Travel style</Label>
          <Select value={travelStyle} onValueChange={(value) => setTravelStyle(value as TravelStyle)}>
            <SelectTrigger id="travelStyle" className="mt-2">
              <SelectValue placeholder="Pick a travel style" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TRAVEL_STYLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="favoriteRegion">Favorite Balkan region</Label>
          <Input
            id="favoriteRegion"
            className="mt-2"
            placeholder="e.g. Istria, Dalmatia, Montenegrin coast"
            value={favoriteRegion}
            onChange={(e) => setFavoriteRegion(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="preferredLanguage">Preferred language</Label>
          <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as Locale)}>
            <SelectTrigger id="preferredLanguage" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((code) => (
                <SelectItem key={code} value={code}>
                  {LOCALE_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border pt-4">
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Travel preferences</p>
        </div>

        <div>
          <Label htmlFor="travelPace">Default pace</Label>
          <Select value={travelPace} onValueChange={(v) => setTravelPace(v as TripPace)}>
            <SelectTrigger id="travelPace" className="mt-2">
              <SelectValue placeholder="Pick a pace" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(TRIP_PACE_LABELS) as [TripPace, string][]).map(([v, label]) => (
                <SelectItem key={v} value={v}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="budgetPreference">Default budget</Label>
          <Select value={budgetPreference} onValueChange={(v) => setBudgetPreference(v as BudgetPreference)}>
            <SelectTrigger id="budgetPreference" className="mt-2">
              <SelectValue placeholder="Pick a budget tier" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Interests</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.entries(TRAVELER_INTEREST_LABELS) as [TravelerInterest, string][]).map(([v, label]) => (
              <label key={v} className="flex items-center gap-2 font-sans text-sm text-foreground/80">
                <Checkbox checked={interests.includes(v)} onCheckedChange={() => toggleInterest(v)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>How you travel</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.entries(MOBILITY_OPTION_LABELS) as [MobilityOption, string][]).map(([v, label]) => (
              <label key={v} className="flex items-center gap-2 font-sans text-sm text-foreground/80">
                <Checkbox checked={mobility.includes(v)} onCheckedChange={() => toggleMobility(v)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Food & drink preferences</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.entries(CUISINE_PREFERENCE_LABELS) as [CuisinePreference, string][]).map(([v, label]) => (
              <label key={v} className="flex items-center gap-2 font-sans text-sm text-foreground/80">
                <Checkbox checked={cuisinePreferences.includes(v)} onCheckedChange={() => toggleCuisine(v)} />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-4 font-sans text-sm text-destructive">{error}</p>}
      {saved && !error && <p className="mt-4 font-sans text-sm text-accent">Saved.</p>}

      <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
