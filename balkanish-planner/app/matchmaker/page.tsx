import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QuizFlow } from "@/components/matchmaker/quiz-flow";
import { PomaloMoment } from "@/components/brand/content-blocks";

export const metadata: Metadata = {
  title: "Balkanish Matchmaker",
  description: "A 10-question travel personality quiz. Find out which Balkan destination matches your travel soul.",
};

export default function MatchmakerPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Balkanish Matchmaker"
        title="Which destination matches your travel soul?"
        description="Ten questions. No wrong answers. Just an honest read on the kind of trip you actually want."
      />
      <div className="container py-8 sm:py-12">
        <PomaloMoment>There&rsquo;s no score for finishing fast. Take the quiz like you&rsquo;d take the trip.</PomaloMoment>
        <div className="mt-8 sm:mt-10">
          <QuizFlow />
        </div>
      </div>
    </div>
  );
}
