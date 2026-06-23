import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PostcardEditor } from "@/components/postcards/postcard-editor";

export const metadata: Metadata = {
  title: "Balkanish Postcards",
  description: "Design a shareable postcard from your Balkans trip — pick a destination, a mood, and a line worth keeping.",
};

export default function PostcardsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Balkanish Postcards"
        title="Send a postcard, the slow way"
        description="Pick a destination, a mood, and a line worth keeping. Download it, send it, frame it."
      />
      <div className="container py-8 sm:py-12">
        <PostcardEditor />
      </div>
    </div>
  );
}
