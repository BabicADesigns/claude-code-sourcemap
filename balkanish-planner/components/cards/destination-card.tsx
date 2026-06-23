import Link from "next/link";
import { DESTINATION_CATEGORY_LABELS, type Destination } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScoreStrip } from "@/components/cards/score-badges";
import { EditorialImage } from "@/components/brand/editorial";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      href={`/hidden-gems/${destination.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <EditorialImage
        src={destination.hero_image_url}
        alt={destination.name}
        className="aspect-[4/3]"
        sizes="(min-width: 1024px) 33vw, 100vw"
        imageClassName="transition-transform duration-500 group-hover:scale-105"
      >
        <Badge variant="accent" className="absolute left-3 top-3 z-20">
          {DESTINATION_CATEGORY_LABELS[destination.category]}
        </Badge>
      </EditorialImage>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
          {destination.region}, {destination.country}
        </p>
        <h3 className="font-display text-xl leading-snug text-sage-dark sm:text-2xl">{destination.name}</h3>
        <p className="line-clamp-2 font-serif text-sm text-foreground/80">{destination.summary}</p>
        <ScoreStrip destination={destination} className="mt-auto pt-2" />
      </div>
    </Link>
  );
}
