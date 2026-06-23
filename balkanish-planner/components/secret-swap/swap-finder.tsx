"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SecretSwap } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function SwapFinder({ swaps }: { swaps: SecretSwap[] }) {
  const [selectedId, setSelectedId] = useState<string>(swaps[0]?.id ?? "");
  const selected = swaps.find((s) => s.id === selectedId);

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
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src={selected.famous_image_url} alt={selected.famous_name} fill className="object-cover" />
            <p className="absolute left-3 top-3 rounded-full bg-charcoal/70 px-3 py-1 font-sans text-xs uppercase tracking-widest text-cream sm:left-4 sm:top-4 sm:px-4">
              The famous spot
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={selected.alternative.hero_image_url}
              alt={selected.alternative.name}
              fill
              className="object-cover"
            />
            <p className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 font-sans text-xs uppercase tracking-widest text-accent-foreground sm:left-4 sm:top-4 sm:px-4">
              Try this instead
            </p>
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl text-sage-dark sm:text-3xl">
              Instead of {selected.famous_name}, try {selected.alternative.name}
            </h2>
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
