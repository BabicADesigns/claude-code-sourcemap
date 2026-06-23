import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { FoodFindCard } from "@/components/cards/food-find-card";
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
        title="Dishes with a story"
        description="Pašticada, peka, soparnik and more — the history, the pairing, and where locals actually go."
      />
      <div className="container py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {foodFinds.map((food) => (
            <FoodFindCard key={food.id} foodFind={food} />
          ))}
        </div>
      </div>
    </div>
  );
}
