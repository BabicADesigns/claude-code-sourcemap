import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DESTINATION_CATEGORY_LABELS, type Destination } from "@/lib/types";
import { getDestinationBySlug, getDestinations } from "@/lib/data/destinations";
import { getFoodFinds } from "@/lib/data/food-finds";
import { getCultureNotes } from "@/lib/data/culture-notes";
import { getSecretSwaps } from "@/lib/data/secret-swaps";
import { pickTruth } from "@/lib/content/balkanish-truths";
import { Badge } from "@/components/ui/badge";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
import { ScoreGrid } from "@/components/cards/score-badges";
import { BalkanishTruth } from "@/components/brand/content-blocks";
import {
  EditorialImage,
  PullQuote,
  WhatLocalsKnow,
  HandwrittenNote,
  TravelStamp,
  LocationTag,
  MapDetailAccent,
  GuidebookReference,
} from "@/components/brand/editorial";
import { BestSlowMoment, WorthWakingUpFor, SkipThisDoThis } from "@/components/brand/content-blocks";
import { Button } from "@/components/ui/button";

function guidebookLine(destination: Destination): string {
  return `${destination.name} — ${DESTINATION_CATEGORY_LABELS[destination.category].toLowerCase()}, ${destination.region}. Best visited ${destination.best_season.toLowerCase()}.`;
}

function localTips(destination: Destination): string[] {
  const tips: string[] = [
    `Best window: ${destination.best_season} — that's when ${destination.name} feels most like itself.`,
  ];
  tips.push(
    destination.crowd_score <= 4
      ? `Crowd score sits at ${destination.crowd_score}/10 — even in peak season, you won't be fighting for table space.`
      : `Crowd score runs ${destination.crowd_score}/10 — aim for early morning or just after sunset to dodge the day-trip wave.`
  );
  tips.push(
    destination.food_score >= 8.5
      ? `Food score of ${destination.food_score}/10 is a hint: skip the waterfront menu and ask where people actually eat.`
      : `It's not a food capital, but ask anyway — the best meal here is rarely the one with a menu out front.`
  );
  return tips;
}

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return {};
  return {
    title: destination.name,
    description: destination.summary,
    openGraph: { images: [destination.hero_image_url] },
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const [foodFinds, cultureNotes, secretSwaps] = await Promise.all([
    getFoodFinds(),
    getCultureNotes(),
    getSecretSwaps(),
  ]);

  const nearbyFood = foodFinds
    .filter((f) => f.region.includes(destination.region) || destination.region.includes(f.region))
    .slice(0, 3);
  const relatedFood = nearbyFood.length > 0 ? nearbyFood : foodFinds.filter((f) => f.is_featured).slice(0, 3);

  const relatedCulture = cultureNotes
    .filter((c) => !c.region || c.region === destination.region)
    .slice(0, 2);

  const swapForThis = secretSwaps.find((s) => s.alternative_destination_id === destination.id);
  const tips = localTips(destination);

  return (
    <article>
      <EditorialImage
        src={destination.hero_image_url}
        alt={destination.name}
        priority
        vignette
        className="h-[38vh] min-h-[280px] w-full sm:h-[50vh] sm:min-h-[360px]"
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" />
        <LocationTag label={destination.country} className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" />
        <div className="container absolute inset-0 z-20 flex flex-col items-start justify-end gap-2 pb-6 text-cream sm:gap-3 sm:pb-10">
          <Badge variant="accent">{DESTINATION_CATEGORY_LABELS[destination.category]}</Badge>
          <h1 className="font-display text-3xl font-semibold sm:text-6xl">{destination.name}</h1>
          <p className="font-sans text-sm uppercase tracking-widest text-cream/80">
            {destination.region}, {destination.country}
          </p>
        </div>
      </EditorialImage>

      <div className="container grid gap-10 py-10 sm:gap-12 sm:py-14 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2 lg:space-y-10">
          <section>
            <h2 className="font-display text-2xl text-sage-dark">Description</h2>
            <p className="mt-3 font-serif leading-relaxed text-foreground/85">{destination.description}</p>
            <GuidebookReference source="Balkanish Field Notes" className="mt-5">
              {guidebookLine(destination)}
            </GuidebookReference>
          </section>

          <PullQuote centered attribution={`Why We Love ${destination.name}`}>
            {destination.why_we_love_it}
          </PullQuote>

          <BalkanishTruth context={destination.name}>{pickTruth(destination.id)}</BalkanishTruth>

          <WhatLocalsKnow tips={tips} />

          <div className="grid gap-5 sm:grid-cols-2">
            <BestSlowMoment destination={destination} />
            <WorthWakingUpFor destination={destination} />
          </div>

          <SkipThisDoThis destination={destination} swap={swapForThis} />

          <section>
            <h2 className="font-display text-2xl text-sage-dark">The Scorecard</h2>
            <p className="mt-1 font-serif text-sm text-foreground/70">
              Six honest measures, not a star rating designed to flatter everywhere equally.
            </p>
            <ScoreGrid destination={destination} className="mt-4" />
          </section>

          {relatedCulture.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-sage-dark">Culture Notes</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-6">
                {relatedCulture.map((note) => (
                  <CultureNoteCard key={note.id} note={note} />
                ))}
              </div>
            </section>
          )}

          {relatedFood.length > 0 && (
            <section>
              <h2 className="font-display text-2xl text-sage-dark">Nearby Food Finds</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {relatedFood.map((food) => (
                  <FoodFindCard key={food.id} foodFind={food} />
                ))}
              </div>
            </section>
          )}

          {swapForThis && (
            <section className="rounded-xl border border-accent bg-accent/10 p-6">
              <h2 className="font-display text-2xl text-sage-dark">Secret Swap Recommendation</h2>
              <p className="mt-3 font-serif text-foreground/85">
                {destination.name} is the quiet alternative to <strong>{swapForThis.famous_name}</strong>.{" "}
                {swapForThis.why_text}
              </p>
              <Button asChild variant="link" className="mt-2 px-0">
                <Link href="/secret-swap">See the full comparison →</Link>
              </Button>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="relative rounded-xl border border-border bg-card p-6">
            <TravelStamp className="absolute -right-3 -top-3" />
            <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Best Season</h3>
            <p className="mt-2 font-display text-xl text-sage-dark">{destination.best_season}</p>
            <MapDetailAccent label={`${destination.region} · ${destination.country}`} className="mt-3" />
          </div>
          <HandwrittenNote>Locals go off-season for a reason.</HandwrittenNote>
          <Button asChild className="w-full">
            <Link href="/planner">Build an itinerary around {destination.name}</Link>
          </Button>
        </aside>
      </div>
    </article>
  );
}
