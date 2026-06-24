"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SavedItinerary } from "@/lib/types";
import { TRAVEL_STYLE_LABELS } from "@/lib/types";
import { deleteItinerary } from "@/lib/actions/itineraries";
import { ItineraryView } from "@/components/planner/itinerary-view";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function SavedItineraries({ itineraries }: { itineraries: SavedItinerary[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const openItinerary = itineraries.find((i) => i.id === openId) ?? null;

  async function handleDelete(id: string) {
    setPendingId(id);
    await deleteItinerary(id);
    setPendingId(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {itineraries.map((saved) => (
          <div
            key={saved.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <div>
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                {saved.duration_days} days · {saved.month} · {TRAVEL_STYLE_LABELS[saved.travel_style]}
              </p>
              <h3 className="mt-1 font-display text-xl text-sage-dark">{saved.itinerary_json.trip_title}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenId(saved.id)}>
                View
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/planner">Regenerate</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pendingId === saved.id}
                onClick={() => handleDelete(saved.id)}
              >
                {pendingId === saved.id ? "Removing…" : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {openItinerary && (
            <>
              <DialogHeader>
                <DialogTitle>{openItinerary.itinerary_json.trip_title}</DialogTitle>
                <DialogDescription>
                  {openItinerary.duration_days} days · {openItinerary.month} ·{" "}
                  {TRAVEL_STYLE_LABELS[openItinerary.travel_style]}
                </DialogDescription>
              </DialogHeader>
              <div className="mb-4 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
              <ItineraryView itinerary={openItinerary.itinerary_json} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
