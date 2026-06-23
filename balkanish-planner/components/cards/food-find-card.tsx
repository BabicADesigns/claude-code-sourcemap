import Link from "next/link";
import Image from "next/image";
import type { FoodFind } from "@/lib/types";

export function FoodFindCard({ foodFind }: { foodFind: FoodFind }) {
  return (
    <Link
      href={`/food-finds/${foodFind.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={foodFind.hero_image_url}
          alt={foodFind.name}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{foodFind.region}</p>
        <h3 className="font-display text-2xl leading-snug text-sage-dark">{foodFind.name}</h3>
        <p className="line-clamp-3 font-serif text-sm text-foreground/80">{foodFind.story}</p>
      </div>
    </Link>
  );
}
