import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerFlow } from "@/components/planner/planner-flow";

export const metadata: Metadata = {
  title: "AI Planner",
  description: "Tell us your travel style, and the Balkanish AI Planner builds a day-by-day itinerary, just for you.",
};

export default function PlannerPage() {
  return (
    <div>
      <PageHeader
        eyebrow="AI Planner"
        title="Your trip, planned the Balkanish way"
        description="Duration, season, budget, and style — tell us what matters, and we'll build a day-by-day plan with hidden gems, food, and culture worked in."
      />
      <div className="container py-8 sm:py-12">
        <PlannerFlow />
      </div>
    </div>
  );
}
