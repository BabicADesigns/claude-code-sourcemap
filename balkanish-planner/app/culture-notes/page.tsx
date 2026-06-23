import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
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
        title="Short stories from the Balkans"
        description="Why Croatians never rush coffee, what pomalo really means, and other small truths."
      />
      <div className="container py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <CultureNoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>
    </div>
  );
}
