"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SavedPostcard } from "@/lib/types";
import { deletePostcard } from "@/lib/actions/postcards";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";

export function SavedPostcards({ postcards }: { postcards: SavedPostcard[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setPendingId(id);
    await deletePostcard(id);
    setPendingId(null);
    router.refresh();
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {postcards.map((postcard) => (
        <div
          key={postcard.id}
          className="flex -rotate-1 flex-col gap-3 rounded-sm border-[6px] border-cream bg-cream p-4 shadow-[0_8px_24px_-8px_rgba(28,25,23,0.35)] ring-1 ring-inset ring-charcoal/5 transition-transform hover:rotate-0"
        >
          <div className="flex items-center gap-2">
            <LogoMark size={18} />
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{postcard.mood}</p>
          </div>
          <p className="font-script text-xl italic leading-snug text-charcoal">&ldquo;{postcard.quote}&rdquo;</p>
          <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
            {postcard.destination_name} · Balkanish
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1 self-start"
            disabled={pendingId === postcard.id}
            onClick={() => handleDelete(postcard.id)}
          >
            {pendingId === postcard.id ? "Removing…" : "Remove"}
          </Button>
        </div>
      ))}
    </div>
  );
}
