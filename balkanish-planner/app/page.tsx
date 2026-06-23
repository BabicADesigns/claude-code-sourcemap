import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DestinationCard } from "@/components/cards/destination-card";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
import { BalkanishTruth } from "@/components/brand/content-blocks";
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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-cipka bg-repeat opacity-60" aria-hidden="true" />
        <div className="relative">
          <div className="relative h-[62vh] min-h-[460px] w-full sm:h-[72vh]">
            <Image
              src="https://picsum.photos/seed/balkanish-hero/1920/1080"
              alt="Stone coastline along the Adriatic at golden hour"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/25 to-transparent" />
            <div className="container absolute inset-0 flex flex-col items-start justify-end gap-4 pb-12 text-cream sm:gap-5 sm:pb-16">
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
          </div>
        </div>
      </section>

      {/* Featured Hidden Gems */}
      <SectionShell
        eyebrow="Hidden Gems"
        title="The places that never make the brochure"
        href="/hidden-gems"
        linkLabel="See all hidden gems"
      >
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {featuredGems.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      </SectionShell>

      <div className="container">
        <BalkanishTruth>Some places are destinations. Some places are invitations.</BalkanishTruth>
      </div>

      {/* Featured Food Finds */}
      <SectionShell
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

      {/* Featured Culture Notes */}
      <SectionShell
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

      {/* Featured Secret Swap */}
      {featuredSwap && (
        <SectionShell
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
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={featuredSwap.alternative.hero_image_url}
                alt={featuredSwap.alternative.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </SectionShell>
      )}

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
  children,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  tone?: "default" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section className={tone === "muted" ? "bg-muted/40 py-12 sm:py-16" : "py-12 sm:py-16"}>
      <div className="container">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
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
