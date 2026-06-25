"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { mockDestinations } from "@/lib/data/destinations-mock";
import { LogoMark } from "@/components/brand/logo-mark";
import { TravelStamp, Postmark } from "@/components/brand/editorial";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { savePostcard } from "@/lib/actions/postcards";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

const moods = ["Wanderlust", "Nostalgic", "Joyful", "Peaceful", "Romantic", "Adventurous"];

const suggestedQuotes = [
  "Pomalo. Slowly, but surely.",
  "Some places don't need a reason to stay one more day.",
  "The best table is the one that turns lunch into dinner.",
  "Wish you were slow, not just here.",
];

export function PostcardEditor() {
  const router = useRouter();
  const [destinationSlug, setDestinationSlug] = useState(mockDestinations[0].slug);
  const [mood, setMood] = useState(moods[0]);
  const [quote, setQuote] = useState(suggestedQuotes[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const destination = mockDestinations.find((d) => d.slug === destinationSlug) ?? mockDestinations[0];

  function updateDestinationSlug(value: string) {
    setDestinationSlug(value);
    setSaved(false);
  }

  function updateMood(value: string) {
    setMood(value);
    setSaved(false);
  }

  function updateQuote(value: string) {
    setQuote(value);
    setSaved(false);
  }

  async function downloadPostcard() {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slugify(destination.name)}-balkanish-postcard.png`;
      link.click();
      track(ANALYTICS_EVENTS.POSTCARD_DOWNLOAD, { destination: destination.name });
    } finally {
      setIsExporting(false);
    }
  }

  async function saveToMyBalkans() {
    setIsSaving(true);
    setSaveError(null);
    const result = await savePostcard({ destination_name: destination.name, mood, quote });
    setIsSaving(false);
    if (result.error) {
      if (result.error.toLowerCase().includes("sign in")) {
        router.push("/sign-in");
        return;
      }
      setSaveError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-10">
      <div className="flex flex-col gap-6">
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Select value={destinationSlug} onValueChange={updateDestinationSlug}>
            <SelectTrigger id="destination" className="mt-2">
              <SelectValue placeholder="Choose a destination" />
            </SelectTrigger>
            <SelectContent>
              {mockDestinations.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="mood">Mood</Label>
          <Select value={mood} onValueChange={updateMood}>
            <SelectTrigger id="mood" className="mt-2">
              <SelectValue placeholder="Choose a mood" />
            </SelectTrigger>
            <SelectContent>
              {moods.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quote">Your quote</Label>
          <Textarea
            id="quote"
            className="mt-2"
            value={quote}
            maxLength={140}
            onChange={(e) => updateQuote(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedQuotes.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => updateQuote(q)}
                className="rounded-full border border-border px-3 py-1 font-sans text-xs text-muted-foreground transition-colors hover:border-primary/60"
              >
                {q.length > 28 ? `${q.slice(0, 28)}…` : q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        <div
          ref={cardRef}
          className="relative w-full max-w-md -rotate-1 rounded-sm border-[6px] border-cream bg-cream shadow-[0_12px_34px_-10px_rgba(28,25,23,0.4)] ring-1 ring-inset ring-charcoal/5 transition-transform duration-300 hover:rotate-0"
        >
          <TravelStamp className="absolute -right-3 -top-3 z-30" />
          <Postmark className="absolute -right-1 -top-1 z-40" />
          <div className="editorial-frame editorial-frame--vignette relative aspect-[4/5] w-full overflow-hidden">
            <Image
              src={destination.hero_image_url}
              alt={destination.name}
              fill
              className="object-cover"
              crossOrigin="anonymous"
            />
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />

            <p className="absolute left-6 top-6 z-20 font-sans text-xs uppercase tracking-widest text-cream/90">{mood}</p>

            <div className="absolute bottom-0 left-0 right-0 z-20 p-6">
              <p className="-rotate-1 font-script text-2xl italic leading-snug text-cream sm:text-3xl">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-2">
                <LogoMark size={22} color="#F5EEE6" />
                <p className="font-sans text-xs uppercase tracking-widest text-cream/90">
                  {destination.name} · Balkanish
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={downloadPostcard} disabled={isExporting} className="w-full max-w-md">
          {isExporting ? "Preparing…" : "Download postcard"}
        </Button>
        <Button
          onClick={saveToMyBalkans}
          disabled={isSaving}
          variant="outline"
          className="w-full max-w-md"
        >
          {isSaving ? "Saving…" : saved ? "Saved to My Balkans" : "Save to My Balkans"}
        </Button>
        {saveError && <p className="font-sans text-sm text-destructive">{saveError}</p>}
      </div>
    </div>
  );
}
