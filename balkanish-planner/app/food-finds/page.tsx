import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FoodFindCard } from "@/components/cards/food-find-card";
import { CoffeeRule } from "@/components/brand/content-blocks";
import { getFoodFinds } from "@/lib/data/food-finds";

export const metadata: Metadata = {
  title: "Food Finds",
  description: "An editorial guide to Balkan dishes, their history, and where to actually try them.",
};

export default async function FoodFindsPage() {
  const foodFinds = await getFoodFinds();

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
          {foodFinds.map((food) => (
            <FoodFindCard key={food.id} foodFind={food} />
          ))}
        </div>
      </div>
    </div>
  );
}
