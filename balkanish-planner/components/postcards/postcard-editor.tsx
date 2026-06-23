"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { mockDestinations } from "@/lib/data/destinations-mock";
import { LogoMark } from "@/components/brand/logo-mark";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";

const moods = ["Wanderlust", "Nostalgic", "Joyful", "Peaceful", "Romantic", "Adventurous"];

const suggestedQuotes = [
  "Pomalo. Slowly, but surely.",
  "Some places don't need a reason to stay one more day.",
  "The best table is the one that turns lunch into dinner.",
  "Wish you were slow, not just here.",
];

export function PostcardEditor() {
  const [destinationSlug, setDestinationSlug] = useState(mockDestinations[0].slug);
  const [mood, setMood] = useState(moods[0]);
  const [quote, setQuote] = useState(suggestedQuotes[0]);
  const [isExporting, setIsExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const destination = mockDestinations.find((d) => d.slug === destinationSlug) ?? mockDestinations[0];

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
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
      <div className="flex flex-col gap-6">
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Select value={destinationSlug} onValueChange={setDestinationSlug}>
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
          <Select value={mood} onValueChange={setMood}>
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
            onChange={(e) => setQuote(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedQuotes.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuote(q)}
                className="rounded-full border border-border px-3 py-1 font-sans text-xs text-muted-foreground transition-colors hover:border-primary/60"
              >
                {q.length > 28 ? `${q.slice(0, 28)}…` : q}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={downloadPostcard} disabled={isExporting}>
          {isExporting ? "Preparing…" : "Download postcard"}
        </Button>
      </div>

      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-md shadow-lg"
        >
          <Image
            src={destination.hero_image_url}
            alt={destination.name}
            fill
            className="object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/10 to-transparent" />

          <p className="absolute left-6 top-6 font-sans text-xs uppercase tracking-widest text-cream/90">{mood}</p>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="font-display text-2xl italic leading-snug text-cream sm:text-3xl">&ldquo;{quote}&rdquo;</p>
            <div className="mt-4 flex items-center gap-2">
              <LogoMark size={22} color="#F0E6D3" />
              <p className="font-sans text-xs uppercase tracking-widest text-cream/90">
                {destination.name} · Balkanish
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
