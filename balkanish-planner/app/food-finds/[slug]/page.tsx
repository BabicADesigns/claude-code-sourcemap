import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFoodFindBySlug, getFoodFinds } from "@/lib/data/food-finds";
import { cn } from "@/lib/utils";
import { EditorialImage, PullQuote, HandwrittenNote, PhotoCredit, HERO_HEIGHT } from "@/components/brand/editorial";
import { LocalWisdom } from "@/components/brand/content-blocks";
import { SaveButton } from "@/components/save/save-button";
import { TrackView } from "@/components/analytics/track-view";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSavedEntityIds } from "@/lib/data/favorites";
import { getServerLocale } from "@/lib/i18n/server";
import { resolveCaption } from "@/lib/media/caption";

export async function generateStaticParams() {
  const foodFinds = await getFoodFinds();
  return foodFinds.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const food = await getFoodFindBySlug(slug);
  if (!food) return {};
  return { title: food.name, description: food.story, openGraph: { images: [food.hero_image.url] } };
}

export default async function FoodFindDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const food = await getFoodFindBySlug(slug);
  if (!food) notFound();

  const [user, locale] = await Promise.all([getCurrentUser(), getServerLocale()]);
  const isSaved = user ? (await getSavedEntityIds(user.id, "food_find")).has(food.id) : false;
  const heroCaption = resolveCaption(food.hero_image.caption, locale);

  return (
    <article>
      <TrackView event={ANALYTICS_EVENTS.FOOD_FIND_VIEW} props={{ slug: food.slug }} />
      <EditorialImage
        src={food.hero_image.url}
        alt={food.hero_image.alt}
        priority
        vignette
        className={cn(HERO_HEIGHT.detail, "w-full")}
      >
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
        <SaveButton
          entityType="food_find"
          entityId={food.id}
          initialSaved={isSaved}
          className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6"
        />
        <div className="container absolute inset-0 z-20 flex flex-col items-start justify-end gap-2 pb-6 text-cream sm:pb-10">
          <p className="font-sans text-xs uppercase tracking-widest text-cream/80">{food.region}</p>
          <h1 className="font-display text-3xl font-semibold sm:text-5xl">{food.name}</h1>
          <PhotoCredit credit={food.hero_image.credit} className="mt-1" />
        </div>
      </EditorialImage>
      {heroCaption && (
        <p className="container mt-2 font-serif text-sm italic text-foreground/70">{heroCaption}</p>
      )}

      <div className="container grid gap-10 py-10 sm:gap-12 sm:py-14 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2 lg:space-y-10">
          <PullQuote attribution={food.name}>{food.story}</PullQuote>

          <section>
            <h2 className="font-display text-2xl text-sage-dark">The Story Behind the Dish</h2>
            <p className="mt-3 font-serif leading-relaxed text-foreground/85 first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-sage-dark sm:first-letter:text-6xl">
              {food.history}
            </p>
          </section>

          {food.ritual && (
            <section>
              <h2 className="font-display text-2xl text-sage-dark">The Ritual</h2>
              <p className="mt-3 font-serif leading-relaxed text-foreground/85">{food.ritual}</p>
            </section>
          )}

          {food.local_anecdote && <LocalWisdom context={food.region}>{food.local_anecdote}</LocalWisdom>}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Drink Pairing</h3>
            <p className="mt-2 font-display text-xl text-sage-dark">{food.drink_pairing}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Where To Try It</h3>
            <p className="mt-2 font-serif text-foreground/85">{food.where_to_try}</p>
          </div>
          <HandwrittenNote>This isn&rsquo;t fast food. Budget the time.</HandwrittenNote>
        </aside>
      </div>
    </article>
  );
}
