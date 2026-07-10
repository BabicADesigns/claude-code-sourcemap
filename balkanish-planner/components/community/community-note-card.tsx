import { cn } from "@/lib/utils";
import { COMMUNITY_NOTE_CATEGORY_LABELS, type CommunityNote } from "@/lib/types";

const CATEGORY_CLASSES: Record<string, string> = {
  sunset_spot: "bg-accent/10 text-rose",
  parking: "bg-muted text-muted-foreground",
  coffee: "bg-secondary/15 text-sage-dark",
  local_etiquette: "bg-secondary/10 text-sage-dark",
  seasonal: "bg-muted text-muted-foreground",
  food_tip: "bg-accent/10 text-rose",
  transport: "bg-muted text-muted-foreground",
  other: "bg-muted text-muted-foreground",
};

export function CommunityNoteCard({ note, className }: { note: CommunityNote; className?: string }) {
  const categoryLabel = COMMUNITY_NOTE_CATEGORY_LABELS[note.category] ?? note.category;
  const categoryClass = CATEGORY_CLASSES[note.category] ?? CATEGORY_CLASSES.other;
  const author = note.author_name ?? "Anonymous traveller";

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-sm leading-relaxed text-foreground/85">{note.content}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-widest",
            categoryClass
          )}
        >
          {categoryLabel}
        </span>
      </div>
      <p className="mt-2 font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
        {author}
      </p>
    </div>
  );
}
