"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/lib/actions/favorites";
import type { FavoriteEntityType } from "@/lib/types";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

/** Heart/bookmark toggle for the polymorphic favorites system. `icon` sits over photography; `pill` sits on plain backgrounds. */
export function SaveButton({
  entityType,
  entityId,
  initialSaved = false,
  variant = "icon",
  className,
}: {
  entityType: FavoriteEntityType;
  entityId: string;
  initialSaved?: boolean;
  variant?: "icon" | "pill";
  className?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, setIsPending] = useState(false);

  async function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (isPending) return;
    setIsPending(true);
    const result = await toggleFavorite(entityType, entityId);
    setIsPending(false);
    if (result.error) {
      router.push("/sign-in");
      return;
    }
    setSaved(result.saved);
    if (result.saved) track(ANALYTICS_EVENTS.SAVE_ACTION, { entity_type: entityType });
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-pressed={saved}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-sans text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-muted disabled:opacity-60",
          saved && "border-accent text-accent",
          className
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} aria-hidden="true" />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/30 text-cream backdrop-blur-sm transition-colors hover:bg-charcoal/50 disabled:opacity-60",
        className
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current text-accent")} aria-hidden="true" />
    </button>
  );
}
