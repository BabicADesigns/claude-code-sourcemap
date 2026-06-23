import Link from "next/link";
import Image from "next/image";
import { DESTINATION_CATEGORY_LABELS, type Destination } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link
      href={`/hidden-gems/${destination.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={destination.hero_image_url}
          alt={destination.name}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge variant="accent" className="absolute left-3 top-3">
          {DESTINATION_CATEGORY_LABELS[destination.category]}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
          {destination.region}, {destination.country}
        </p>
        <h3 className="font-display text-2xl leading-snug text-sage-dark">{destination.name}</h3>
        <p className="line-clamp-2 font-serif text-sm text-foreground/80">{destination.summary}</p>
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs font-sans text-muted-foreground">
          <span>Local score {destination.local_score}/10</span>
          <span aria-hidden="true">·</span>
          <span>Crowd score {destination.crowd_score}/10</span>
        </div>
      </div>
    </Link>
  );
}
