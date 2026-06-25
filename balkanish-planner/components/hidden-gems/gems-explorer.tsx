"use client";

import { useMemo, useState } from "react";
import { DESTINATION_CATEGORY_LABELS, type Destination, type DestinationCategory } from "@/lib/types";
import { DestinationCard } from "@/components/cards/destination-card";
import { cn } from "@/lib/utils";

const categories: (DestinationCategory | "all")[] = [
  "all",
  "island_secrets",
  "quiet_escapes",
  "romantic_spots",
  "nature",
  "family_friendly",
  "local_favorites",
];

export function GemsExplorer({
  destinations,
  savedIds = [],
}: {
  destinations: Destination[];
  savedIds?: string[];
}) {
  const [active, setActive] = useState<DestinationCategory | "all">("all");

  const filtered = useMemo(
    () => (active === "all" ? destinations : destinations.filter((d) => d.category === active)),
    [active, destinations]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActive(category)}
            aria-pressed={active === category}
            className={cn(
              "rounded-full border px-4 py-2 font-sans text-sm transition-colors",
              active === category
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-foreground/75 hover:border-primary/60"
            )}
          >
            {category === "all" ? "All" : DESTINATION_CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <p className="mt-4 font-sans text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "destination" : "destinations"}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {filtered.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            initialSaved={savedIds.includes(destination.id)}
          />
        ))}
      </div>
    </div>
  );
}
