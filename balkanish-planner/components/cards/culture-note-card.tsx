import Link from "next/link";
import Image from "next/image";
import type { CultureNote } from "@/lib/types";

export function CultureNoteCard({ note }: { note: CultureNote }) {
  return (
    <Link
      href={`/culture-notes/${note.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={note.hero_image_url}
          alt={note.title}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        {note.region && (
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{note.region}</p>
        )}
        <h3 className="font-display text-2xl leading-snug text-sage-dark">{note.title}</h3>
        <p className="line-clamp-3 font-serif text-sm italic text-foreground/80">{note.excerpt}</p>
      </div>
    </Link>
  );
}
