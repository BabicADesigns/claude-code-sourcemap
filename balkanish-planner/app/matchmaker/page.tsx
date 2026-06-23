import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { QuizFlow } from "@/components/matchmaker/quiz-flow";

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
      <div className="container py-12">
        <QuizFlow />
      </div>
    </div>
  );
}
