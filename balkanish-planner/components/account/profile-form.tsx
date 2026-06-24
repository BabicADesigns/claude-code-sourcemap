"use client";

import { useState, type FormEvent } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateProfile } from "@/lib/actions/profile";
import { TRAVEL_STYLE_LABELS, type Profile, type TravelStyle } from "@/lib/types";

export function ProfileForm({ email, profile }: { email: string; profile: Profile | null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [country, setCountry] = useState(profile?.country ?? "");
  const [travelStyle, setTravelStyle] = useState<TravelStyle | "">(profile?.travel_style ?? "");
  const [favoriteRegion, setFavoriteRegion] = useState(profile?.favorite_region ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      </div>

      {error && <p className="mt-4 font-sans text-sm text-destructive">{error}</p>}
      {saved && !error && <p className="mt-4 font-sans text-sm text-accent">Saved.</p>}

      <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
