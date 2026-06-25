"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SecretSwap } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EditorialImage } from "@/components/brand/editorial";
import { SaveButton } from "@/components/save/save-button";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

export function SwapFinder({ swaps, savedIds = [] }: { swaps: SecretSwap[]; savedIds?: string[] }) {
  const [selectedId, setSelectedId] = useState<string>(swaps[0]?.id ?? "");
  const selected = swaps.find((s) => s.id === selectedId);

  useEffect(() => {
    if (selected) track(ANALYTICS_EVENTS.SECRET_SWAP_VIEW, { id: selected.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  return (
    <div>
      <div className="max-w-sm">
        <label className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
          Pick a famous destination
        </label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Choose a destination" />
          </SelectTrigger>
          <SelectContent>
            {swaps.map((swap) => (
              <SelectItem key={swap.id} value={swap.id}>
                {swap.famous_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:grid-cols-2">
          <EditorialImage
            src={selected.famous_image_url}
            alt={selected.famous_name}
            vignette
            className="aspect-[4/3] rounded-xl"
          >
            <p className="absolute left-3 top-3 z-20 rounded-full bg-charcoal/70 px-3 py-1 font-sans text-xs uppercase tracking-widest text-cream sm:left-4 sm:top-4 sm:px-4">
              The famous spot
            </p>
          </EditorialImage>
          <EditorialImage
            src={selected.alternative.hero_image_url}
            alt={selected.alternative.name}
            vignette
            className="aspect-[4/3] rounded-xl"
          >
            <p className="absolute left-3 top-3 z-20 rounded-full bg-accent px-3 py-1 font-sans text-xs uppercase tracking-widest text-accent-foreground sm:left-4 sm:top-4 sm:px-4">
              Try this instead
            </p>
          </EditorialImage>

          <div className="min-w-0 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-2xl text-sage-dark sm:text-3xl">
                Instead of {selected.famous_name}, try {selected.alternative.name}
              </h2>
              <SaveButton
                entityType="secret_swap"
                entityId={selected.id}
                initialSaved={savedIds.includes(selected.id)}
                variant="pill"
              />
            </div>
            <p className="mt-3 max-w-2xl font-serif text-foreground/85">{selected.why_text}</p>

            <div className="mt-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-left font-sans text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2.5 font-medium text-muted-foreground sm:p-3"> </th>
                    <th className="p-2.5 font-medium text-foreground sm:p-3">{selected.famous_name}</th>
                    <th className="p-2.5 font-medium text-foreground sm:p-3">{selected.alternative.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.comparison_points.map((point) => (
                    <tr key={point.label} className="border-t border-border">
                      <td className="p-2.5 font-medium text-muted-foreground sm:p-3">{point.label}</td>
                      <td className="p-2.5 sm:p-3">{point.famous}</td>
                      <td className="p-2.5 text-sage-dark sm:p-3">{point.alternative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button asChild className="mt-6">
              <Link href={`/hidden-gems/${selected.alternative.slug}`}>
                Explore {selected.alternative.name} →
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
