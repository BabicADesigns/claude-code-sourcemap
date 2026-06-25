import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { CultureNoteCard } from "@/components/cards/culture-note-card";
import { AuntieAdvice } from "@/components/brand/content-blocks";
import { FeatureLead } from "@/components/brand/editorial";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { getCultureNotes } from "@/lib/data/culture-notes";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSavedEntityIds } from "@/lib/data/favorites";

export const metadata: Metadata = {
  title: "Culture Notes",
  description: "Short editorial stories about Balkan life, language, and hospitality.",
};

export default async function CultureNotesPage() {
  const [notes, user] = await Promise.all([getCultureNotes(), getCurrentUser()]);
  const savedIds = user ? await getSavedEntityIds(user.id, "culture_note") : new Set<string>();
  const [leadNote, ...restNotes] = notes;

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
          {leadNote && (
            <FeatureLead
              href={`/culture-notes/${leadNote.slug}`}
              src={leadNote.hero_image_url}
              alt={leadNote.title}
              eyebrow={leadNote.region ?? undefined}
              title={leadNote.title}
              description={leadNote.excerpt}
              className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
            />
          )}
          {restNotes.map((note) => (
            <CultureNoteCard key={note.id} note={note} initialSaved={savedIds.has(note.id)} />
          ))}
        </div>
        <NewsletterSignup sourcePage="culture-notes" className="mt-10 sm:mt-14" />
      </div>
    </div>
  );
}
