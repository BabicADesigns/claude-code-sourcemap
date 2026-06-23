import type { LucideIcon } from "lucide-react";
import { MapPin, Users, Hourglass, UtensilsCrossed, BookOpen, Sunset as SunsetIcon } from "lucide-react";
import { DESTINATION_SCORES, type Destination, type ScoreKey } from "@/lib/types";
import { cn } from "@/lib/utils";

const SCORE_ICONS: Record<ScoreKey, LucideIcon> = {
  local_score: MapPin,
  crowd_score: Users,
  slow_living_score: Hourglass,
  food_score: UtensilsCrossed,
  story_score: BookOpen,
  sunset_score: SunsetIcon,
};

/** Compact inline strip for cards — pass a subset of score keys to keep cards short on mobile. */
export function ScoreStrip({
  destination,
  keys = ["local_score", "crowd_score", "sunset_score"],
  className,
}: {
  destination: Destination;
  keys?: ScoreKey[];
  className?: string;
}) {
  const scores = DESTINATION_SCORES.filter((s) => keys.includes(s.key));
  return (
    <div className={cn("flex items-center gap-3 text-xs font-sans text-muted-foreground", className)}>
      {scores.map((score) => {
        const Icon = SCORE_ICONS[score.key];
        return (
          <span key={score.key} className="flex items-center gap-1" title={`${score.label}: ${score.hint}`}>
            <Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {destination[score.key]}
          </span>
        );
      })}
    </div>
  );
}

/** Full 6-metric scorecard for destination detail pages. */
export function ScoreGrid({ destination, className }: { destination: Destination; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {DESTINATION_SCORES.map((score) => {
        const Icon = SCORE_ICONS[score.key];
        return (
          <div key={score.key} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5 text-accent">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <p className="font-sans text-[11px] uppercase tracking-widest text-muted-foreground">{score.label}</p>
            </div>
            <p className="mt-1.5 font-display text-2xl text-sage-dark">
              {destination[score.key]}
              <span className="text-sm font-sans text-muted-foreground"> / 10</span>
            </p>
            <p className="mt-1 font-serif text-xs leading-snug text-foreground/70">{score.hint}</p>
          </div>
        );
      })}
    </div>
  );
}
