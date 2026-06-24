import Link from "next/link";
import type { FoodFind } from "@/lib/types";
import { EditorialImage } from "@/components/brand/editorial";
import { SaveButton } from "@/components/save/save-button";

export function FoodFindCard({
  foodFind,
  initialSaved = false,
}: {
  foodFind: FoodFind;
  initialSaved?: boolean;
}) {
  return (
    <Link
      href={`/food-finds/${foodFind.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <EditorialImage
        src={foodFind.hero_image_url}
        alt={foodFind.name}
        className="aspect-[4/3]"
        sizes="(min-width: 1024px) 33vw, 100vw"
        imageClassName="transition-transform duration-500 group-hover:scale-105"
      >
        <SaveButton
          entityType="food_find"
          entityId={foodFind.id}
          initialSaved={initialSaved}
          className="absolute right-3 top-3 z-20"
        />
      </EditorialImage>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{foodFind.region}</p>
        <h3 className="font-display text-xl leading-snug text-sage-dark sm:text-2xl">{foodFind.name}</h3>
        <p className="line-clamp-2 font-serif text-sm text-foreground/80 sm:line-clamp-3">{foodFind.story}</p>
      </div>
    </Link>
  );
}
