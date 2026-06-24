"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { SavedItinerary } from "@/lib/types";
import { TRAVEL_STYLE_LABELS } from "@/lib/types";
import { deleteItinerary, renameItinerary } from "@/lib/actions/itineraries";
import { ItineraryView } from "@/components/planner/itinerary-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function tripName(saved: SavedItinerary) {
  return saved.title ?? saved.itinerary_json.trip_title;
}

export function SavedItineraries({ itineraries }: { itineraries: SavedItinerary[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const openItinerary = itineraries.find((i) => i.id === openId) ?? null;

  async function handleDelete(id: string) {
    setPendingId(id);
    await deleteItinerary(id);
    setPendingId(null);
    router.refresh();
  }

  function startRename(saved: SavedItinerary) {
    setRenamingId(saved.id);
    setRenameValue(tripName(saved));
  }

  async function confirmRename(id: string) {
    setPendingId(id);
    await renameItinerary(id, renameValue);
    setPendingId(null);
    setRenamingId(null);
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
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                {saved.duration_days} days · {saved.month} · {TRAVEL_STYLE_LABELS[saved.travel_style]}
              </p>
              {renamingId === saved.id ? (
                <div className="mt-1 flex max-w-sm items-center gap-2">
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename(saved.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                  <Button size="sm" disabled={pendingId === saved.id} onClick={() => confirmRename(saved.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startRename(saved)}
                  className="group mt-1 flex items-center gap-2 text-left"
                  aria-label="Rename trip"
                >
                  <h3 className="font-display text-xl text-sage-dark">{tripName(saved)}</h3>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
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
                <DialogTitle>{tripName(openItinerary)}</DialogTitle>
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
