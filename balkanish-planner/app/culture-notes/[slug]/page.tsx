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
    <article className="container max-w-3xl py-14">
      {note.region && (
        <p className="font-sans text-xs uppercase tracking-widest text-accent">{note.region}</p>
      )}
      <h1 className="mt-2 font-display text-4xl text-sage-dark sm:text-5xl">{note.title}</h1>
      <p className="mt-4 font-serif text-lg italic text-foreground/80">{note.excerpt}</p>

      <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-md">
        <Image src={note.hero_image_url} alt={note.title} fill priority className="object-cover" />
      </div>

      <p className="mt-8 font-serif text-lg leading-relaxed text-foreground/90">{note.body}</p>
    </article>
  );
}
