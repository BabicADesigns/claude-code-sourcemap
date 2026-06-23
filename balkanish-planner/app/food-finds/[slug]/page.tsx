import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFoodFindBySlug, getFoodFinds } from "@/lib/data/food-finds";

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
  return { title: food.name, description: food.story, openGraph: { images: [food.hero_image_url] } };
}

export default async function FoodFindDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const food = await getFoodFindBySlug(slug);
  if (!food) notFound();

  return (
    <article>
      <div className="relative h-[34vh] min-h-[240px] w-full sm:h-[42vh] sm:min-h-[300px]">
        <Image src={food.hero_image_url} alt={food.name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
        <div className="container absolute inset-0 flex flex-col items-start justify-end gap-2 pb-6 text-cream sm:pb-10">
          <p className="font-sans text-xs uppercase tracking-widest text-cream/80">{food.region}</p>
          <h1 className="font-display text-3xl font-semibold sm:text-5xl">{food.name}</h1>
        </div>
      </div>

      <div className="container grid gap-10 py-10 sm:gap-12 sm:py-14 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2 lg:space-y-10">
          <section>
            <h2 className="font-display text-2xl text-sage-dark">The Story</h2>
            <p className="mt-3 font-serif leading-relaxed text-foreground/85">{food.story}</p>
          </section>
          <section>
            <h2 className="font-display text-2xl text-sage-dark">History</h2>
            <p className="mt-3 font-serif leading-relaxed text-foreground/85">{food.history}</p>
          </section>
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
        </aside>
      </div>
    </article>
  );
}
