import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DestinationCard } from "@/components/cards/destination-card";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
import { BalkanishTruth } from "@/components/brand/content-blocks";
import {
  EditorialImage,
  PullQuote,
  WaveDivider,
  FeatureLead,
  TravelStamp,
  LocationTag,
  GuidebookReference,
  PhotoCredit,
} from "@/components/brand/editorial";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { DESTINATION_CATEGORY_LABELS } from "@/lib/types";
import { getDestinations } from "@/lib/data/destinations";
import { getFoodFinds } from "@/lib/data/food-finds";
import { getCultureNotes } from "@/lib/data/culture-notes";
import { getSecretSwaps } from "@/lib/data/secret-swaps";

export default async function HomePage() {
  const [destinations, foodFinds, cultureNotes, secretSwaps] = await Promise.all([
    getDestinations(),
    getFoodFinds(),
    getCultureNotes(),
    getSecretSwaps(),
  ]);

  const featuredGems = destinations.filter((d) => d.is_featured).slice(0, 3);
  const featuredFood = foodFinds.filter((f) => f.is_featured).slice(0, 3);
  const featuredCulture = cultureNotes.filter((c) => c.is_featured).slice(0, 3);
  const featuredSwap = secretSwaps[0];
  const [leadGem, ...restGems] = featuredGems;
  const postcardPick = featuredGems[featuredGems.length - 1] ?? destinations[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-cipka bg-repeat opacity-60" aria-hidden="true" />
        <div className="relative">
          <EditorialImage
            src="https://picsum.photos/seed/balkanish-hero/1920/1080"
            alt="Stone coastline along the Adriatic at golden hour"
            priority
            vignette
            className="h-[62vh] min-h-[460px] w-full sm:h-[72vh]"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-charcoal/75 via-charcoal/25 to-transparent" />
            <div className="container absolute inset-0 z-20 flex flex-col items-start justify-end gap-4 pb-12 text-cream sm:gap-5 sm:pb-16">
              <p className="font-script text-sm italic text-rose sm:text-base">The Balkanish AI Way</p>
              <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] text-balance sm:text-6xl lg:text-7xl">
                Travel the Balkans like someone invited you.
              </h1>
              <p className="max-w-xl font-serif text-base text-cream/90 sm:text-lg">
                The places locals actually go, the dishes they argue about, and an AI planner
                that writes like it&rsquo;s been there — not like it Googled it.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild size="lg">
                  <Link href="/planner">Plan My Trip with AI</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-cream text-cream hover:bg-cream/10">
                  <Link href="/hidden-gems">Browse Hidden Gems</Link>
                </Button>
              </div>
            </div>
          </EditorialImage>
        </div>
      </section>

      {/* Featured Hidden Gems — one lead feature, two supporting cards, magazine-style */}
      <SectionShell
        index={1}
        eyebrow="Hidden Gems"
        title="The places that never make the brochure"
        href="/hidden-gems"
        linkLabel="See all hidden gems"
      >
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
          {leadGem && (
            <FeatureLead
              href={`/hidden-gems/${leadGem.slug}`}
              src={leadGem.hero_image.url}
              alt={leadGem.hero_image.alt}
              eyebrow={DESTINATION_CATEGORY_LABELS[leadGem.category]}
              title={leadGem.name}
              description={leadGem.summary}
              credit={leadGem.hero_image.credit}
              className="lg:col-span-2"
            />
          )}
          <div className="flex flex-col gap-5 sm:gap-6">
            {restGems.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </div>
      </SectionShell>

      <div className="container">
        <BalkanishTruth>Some places are destinations. Some places are invitations.</BalkanishTruth>
      </div>

      {/* Featured Food Finds */}
      <SectionShell
        index={2}
        eyebrow="Food Finds"
        title="Dishes worth a two-hour lunch"
        href="/food-finds"
        linkLabel="See all food finds"
        tone="muted"
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {featuredFood.map((f) => (
            <FoodFindCard key={f.id} foodFind={f} />
          ))}
        </div>
      </SectionShell>

      {/* A pause between sections — editorial rhythm, not another card grid */}
      {featuredCulture[0] && (
        <div className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl">
            <PullQuote centered attribution={featuredCulture[0].title}>
              {featuredCulture[0].excerpt}
            </PullQuote>
          </div>
          <WaveDivider className="mx-auto mt-10 w-20" />
        </div>
      )}

      {/* Featured Culture Notes */}
      <SectionShell
        index={3}
        eyebrow="Culture Notes"
        title="Short stories that explain everything"
        href="/culture-notes"
        linkLabel="Read more culture notes"
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {featuredCulture.map((c) => (
            <CultureNoteCard key={c.id} note={c} />
          ))}
        </div>
      </SectionShell>

      {/* A tactile interlude — a postcard from the road, not another grid */}
      {postcardPick && (
        <section className="overflow-hidden border-y border-border bg-cream/40 py-14 sm:py-20">
          <div className="container grid items-center gap-10 lg:grid-cols-[1fr_360px] lg:gap-14">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-accent">Postcards</p>
              <h2 className="mt-1 max-w-md font-display text-2xl text-sage-dark sm:text-4xl">
                Some places are worth mailing home about
              </h2>
              <GuidebookReference source="Balkanish Field Notes" className="mt-5 max-w-md">
                Every destination on this site doubles as a postcard — pick a mood, write a line worth
                keeping, and send it the slow way.
              </GuidebookReference>
              <Button asChild variant="link" className="mt-4 px-0">
                <Link href="/postcards">Make your own postcard →</Link>
              </Button>
            </div>
            <div className="relative mx-auto w-full max-w-xs rotate-2 rounded-sm border-[6px] border-cream bg-cream shadow-[0_16px_40px_-12px_rgba(28,25,23,0.4)] transition-transform duration-300 hover:rotate-0">
              <TravelStamp className="absolute -right-3 -top-3 z-30" />
              <EditorialImage
                src={postcardPick.hero_image.url}
                alt={postcardPick.hero_image.alt}
                vignette
                className="aspect-[4/5] rounded-[2px]"
              >
                <div className="absolute bottom-3 left-3 z-20 flex flex-col items-start gap-1.5">
                  <LocationTag label={postcardPick.name} />
                  <PhotoCredit credit={postcardPick.hero_image.credit} />
                </div>
              </EditorialImage>
            </div>
          </div>
        </section>
      )}

      {/* Featured Secret Swap */}
      {featuredSwap && (
        <SectionShell
          index={4}
          eyebrow="Secret Swap"
          title="Loved the famous spot? Try this instead."
          href="/secret-swap"
          linkLabel="Find your own swap"
          tone="muted"
        >
          <div className="grid items-center gap-6 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 sm:gap-8 sm:p-10">
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                Instead of {featuredSwap.famous_name}
              </p>
              <h3 className="mt-2 font-display text-2xl text-sage-dark sm:text-3xl">{featuredSwap.alternative.name}</h3>
              <p className="mt-4 font-serif text-foreground/85">{featuredSwap.why_text}</p>
              <Button asChild variant="link" className="mt-4 px-0">
                <Link href="/secret-swap">Explore Secret Swap →</Link>
              </Button>
            </div>
            <EditorialImage
              src={featuredSwap.alternative.hero_image.url}
              alt={featuredSwap.alternative.hero_image.alt}
              vignette
              className="aspect-[4/3] rounded-xl"
            >
              <PhotoCredit credit={featuredSwap.alternative.hero_image.credit} className="absolute bottom-3 left-3 z-20" />
            </EditorialImage>
          </div>
        </SectionShell>
      )}

      <div className="container py-10 sm:py-14">
        <NewsletterSignup sourcePage="homepage" className="mx-auto max-w-2xl" />
      </div>

      {/* AI Planner CTA */}
      <section className="border-t border-border bg-sage-dark py-14 text-cream sm:py-20">
        <div className="container flex flex-col items-center gap-5 text-center">
          <p className="font-script text-sm italic text-rose">Make AI feel human.</p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
            An AI planner that argues for pomalo, not against it
          </h2>
          <p className="max-w-xl font-serif text-cream/85">
            Tell us your dates, budget, and travel style. We&rsquo;ll build the day-by-day like a
            friend who&rsquo;s already done the trip — hidden gems, restaurants, and culture notes
            included, gaps for getting lost intentional.
          </p>
          <Button asChild size="lg" variant="accent">
            <Link href="/planner">Plan My Trip</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function SectionShell({
  eyebrow,
  title,
  href,
  linkLabel,
  tone = "default",
  index,
  children,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  tone?: "default" | "muted";
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <section className={tone === "muted" ? "bg-muted/40 py-12 sm:py-16" : "py-12 sm:py-16"}>
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-accent">
              {typeof index === "number" && (
                <span className="mr-2 text-muted-foreground">No. {String(index).padStart(2, "0")}</span>
              )}
              {eyebrow}
            </p>
            <h2 className="mt-1 font-display text-2xl text-sage-dark sm:text-4xl">{title}</h2>
          </div>
          <Link href={href} className="font-sans text-sm text-primary underline-offset-4 hover:underline">
            {linkLabel} →
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}
