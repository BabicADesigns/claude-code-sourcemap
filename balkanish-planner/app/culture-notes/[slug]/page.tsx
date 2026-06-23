import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCultureNoteBySlug, getCultureNotes } from "@/lib/data/culture-notes";
import { EditorialImage, PullQuote, WaveDivider, HandwrittenNote } from "@/components/brand/editorial";

export async function generateStaticParams() {
  const notes = await getCultureNotes();
  return notes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await getCultureNoteBySlug(slug);
  if (!note) return {};
  return { title: note.title, description: note.excerpt, openGraph: { images: [note.hero_image_url] } };
}

export default async function CultureNoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getCultureNoteBySlug(slug);
  if (!note) notFound();

  const wordCount = note.body.split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  return (
    <article className="container max-w-2xl py-10 sm:py-14">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-xs uppercase tracking-widest text-muted-foreground">
        <span className="text-accent">Culture Notes</span>
        {note.region && (
          <>
            <span aria-hidden="true">·</span>
            <span>{note.region}</span>
          </>
        )}
        <span aria-hidden="true">·</span>
        <span>{readMinutes} min read</span>
      </div>
      <h1 className="mt-3 font-display text-3xl leading-[1.1] text-sage-dark sm:text-5xl">{note.title}</h1>

      <EditorialImage
        src={note.hero_image_url}
        alt={note.title}
        priority
        vignette
        className="mt-6 aspect-[16/9] rounded-xl sm:mt-8"
      />

      <PullQuote centered className="mt-8 sm:mt-10">
        {note.excerpt}
      </PullQuote>

      <p className="mt-6 font-serif text-base leading-[1.85] text-foreground/90 first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.85] first-letter:text-sage-dark sm:mt-8 sm:text-lg sm:first-letter:text-6xl">
        {note.body}
      </p>

      <WaveDivider className="mx-auto mt-10 w-16 sm:mt-12" />
      <HandwrittenNote className="mt-4 text-center">Filed under: things nobody explains to visitors.</HandwrittenNote>
    </article>
  );
}
