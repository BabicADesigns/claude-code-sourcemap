import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
import { AuntieAdvice } from "@/components/brand/content-blocks";
import { getCultureNotes } from "@/lib/data/culture-notes";

export const metadata: Metadata = {
  title: "Culture Notes",
  description: "Short editorial stories about Balkan life, language, and hospitality.",
};

export default async function CultureNotesPage() {
  const notes = await getCultureNotes();

  return (
    <div>
      <PageHeader
        eyebrow="Culture Notes"
        title="Short stories that explain everything"
        description="Why coffee takes an hour, what pomalo actually means, and other small truths nobody puts in a guidebook."
      />
      <div className="container py-8 sm:py-12">
        <AuntieAdvice>
          Every family has one aunt who&rsquo;s always right about where to eat and never explains how she knows.
        </AuntieAdvice>
        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {notes.map((note) => (
            <CultureNoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>
    </div>
  );
}
