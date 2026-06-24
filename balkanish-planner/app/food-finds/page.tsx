import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { CoffeeRule } from "@/components/brand/content-blocks";
import { FeatureLead } from "@/components/brand/editorial";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { getFoodFinds } from "@/lib/data/food-finds";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSavedEntityIds } from "@/lib/data/favorites";

export const metadata: Metadata = {
  title: "Food Finds",
  description: "An editorial guide to Balkan dishes, their history, and where to actually try them.",
};

export default async function FoodFindsPage() {
  const [foodFinds, user] = await Promise.all([getFoodFinds(), getCurrentUser()]);
  const savedIds = user ? await getSavedEntityIds(user.id, "food_find") : new Set<string>();
  const [leadFood, ...restFood] = foodFinds;

  return (
    <div>
      <PageHeader
        eyebrow="Food Finds"
        title="Dishes worth a two-hour lunch"
        description="Pašticada, peka, soparnik, and the arguments that come with them — the history, the pairing, and where locals actually go."
      />
      <div className="container py-8 sm:py-12">
        <CoffeeRule>If a local says five minutes, make yourself a coffee.</CoffeeRule>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {leadFood && (
            <FeatureLead
              href={`/food-finds/${leadFood.slug}`}
              src={leadFood.hero_image_url}
              alt={leadFood.name}
              eyebrow={leadFood.region}
              title={leadFood.name}
              description={leadFood.story}
              className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
            />
          )}
          {restFood.map((food) => (
            <FoodFindCard key={food.id} foodFind={food} initialSaved={savedIds.has(food.id)} />
          ))}
        </div>
        <NewsletterSignup sourcePage="food-finds" className="mt-10 sm:mt-14" />
      </div>
    </div>
  );
}
