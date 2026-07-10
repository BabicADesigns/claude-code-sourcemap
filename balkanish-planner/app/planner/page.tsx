import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerFlow } from "@/components/planner/planner-flow";
import { createSupabaseServerClient, getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, LocalPartner, LogisticsConnection, CulturalInsight, FounderNote } from "@/lib/types";
import { getPartners } from "@/lib/data/partners";
import { getLogisticsConnections } from "@/lib/data/logistics-connections";
import { getCulturalInsights } from "@/lib/data/cultural-insights";
import { getFounderNotes } from "@/lib/data/founder-notes";

export const metadata: Metadata = {
  title: "AI Planner",
  description: "Tell us your travel style, and the Balkanish AI Planner builds a day-by-day itinerary, just for you.",
};

export default async function PlannerPage() {
  let profile: Profile | null = null;
  let partners: LocalPartner[] = [];
  let connections: LogisticsConnection[] = [];
  let culturalInsights: CulturalInsight[] = [];
  let founderNotes: FounderNote[] = [];

  const [partnersResult, connectionsResult, culturalInsightsResult, founderNotesResult] =
    await Promise.allSettled([
      getPartners(),
      getLogisticsConnections(),
      getCulturalInsights(),
      getFounderNotes(),
    ]);
  if (partnersResult.status === "fulfilled") partners = partnersResult.value;
  if (connectionsResult.status === "fulfilled") connections = connectionsResult.value;
  if (culturalInsightsResult.status === "fulfilled") culturalInsights = culturalInsightsResult.value;
  if (founderNotesResult.status === "fulfilled") founderNotes = founderNotesResult.value;

  if (isSupabaseConfigured()) {
    const user = await getCurrentUser();
    if (user) {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      profile = data;
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="AI Planner"
        title="Your trip, planned the Balkanish way"
        description="Duration, season, budget, and style — tell us what matters, and we'll build a day-by-day plan with hidden gems, food, and culture worked in."
      />
      <div className="container py-8 sm:py-12">
        <PlannerFlow
          profile={profile}
          initialPartners={partners}
          initialConnections={connections}
          initialCulturalInsights={culturalInsights}
          initialFounderNotes={founderNotes}
        />
      </div>
    </div>
  );
}
