import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCultureNoteBySlug, getCultureNotes } from "@/lib/data/culture-notes";

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

  return (
    <article className="container max-w-3xl py-10 sm:py-14">
      {note.region && (
        <p className="font-sans text-xs uppercase tracking-widest text-accent">{note.region}</p>
      )}
      <h1 className="mt-2 font-display text-3xl text-sage-dark sm:text-5xl">{note.title}</h1>
      <p className="mt-4 font-serif text-base italic text-foreground/80 sm:text-lg">{note.excerpt}</p>

      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-xl sm:mt-8">
        <Image src={note.hero_image_url} alt={note.title} fill priority className="object-cover" />
      </div>

      <p className="mt-6 font-serif text-base leading-relaxed text-foreground/90 sm:mt-8 sm:text-lg">{note.body}</p>
    </article>
  );
}
