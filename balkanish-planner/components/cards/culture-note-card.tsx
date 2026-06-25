import Link from "next/link";
import type { CultureNote } from "@/lib/types";
import { EditorialImage } from "@/components/brand/editorial";
import { SaveButton } from "@/components/save/save-button";

export function CultureNoteCard({
  note,
  initialSaved = false,
}: {
  note: CultureNote;
  initialSaved?: boolean;
}) {
  return (
    <Link
      href={`/culture-notes/${note.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <EditorialImage
        src={note.hero_image_url}
        alt={note.title}
        className="aspect-[4/3]"
        sizes="(min-width: 1024px) 33vw, 100vw"
        imageClassName="transition-transform duration-500 group-hover:scale-105"
      >
        <SaveButton
          entityType="culture_note"
          entityId={note.id}
          initialSaved={initialSaved}
          className="absolute right-3 top-3 z-20"
        />
      </EditorialImage>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        {note.region && (
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{note.region}</p>
        )}
        <h3 className="font-display text-xl leading-snug text-sage-dark sm:text-2xl">{note.title}</h3>
        <p className="line-clamp-2 font-serif text-sm italic text-foreground/80 sm:line-clamp-3">{note.excerpt}</p>
      </div>
    </Link>
  );
}
