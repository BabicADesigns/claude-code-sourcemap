import type { LucideIcon } from "lucide-react";
import { Coffee, Quote, Clock, Wine, Sparkles, Heart, Moon, Sunrise, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Destination, SecretSwap } from "@/lib/types";

interface BlockProps {
  children: React.ReactNode;
  className?: string;
  /** Optional small line under the label, e.g. a place name or context. */
  context?: string;
}

function BrandBlock({
  icon: Icon,
  label,
  tone,
  children,
  className,
  context,
}: BlockProps & {
  icon: LucideIcon;
  label: string;
  tone: "sage" | "rose" | "sage-dark" | "cream";
}) {
  const toneClasses: Record<typeof tone, string> = {
    sage: "border-secondary/40 bg-secondary/10",
    rose: "border-accent/50 bg-accent/10",
    "sage-dark": "border-sage-dark/30 bg-sage-dark text-cream",
    cream: "border-border bg-card",
  };
  const labelClasses: Record<typeof tone, string> = {
    sage: "text-sage-dark",
    rose: "text-sage-dark",
    "sage-dark": "text-rose",
    cream: "text-accent",
  };
  const iconWrapClasses: Record<typeof tone, string> = {
    sage: "bg-secondary/20 text-sage-dark",
    rose: "bg-accent/20 text-sage-dark",
    "sage-dark": "bg-cream/10 text-rose",
    cream: "bg-muted text-sage-dark",
  };

  return (
    <div
      className={cn(
        "rounded-xl border px-6 py-6 sm:px-8 sm:py-7",
        toneClasses[tone],
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconWrapClasses[tone])}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className={cn("font-sans text-xs font-semibold uppercase tracking-widest", labelClasses[tone])}>
          {label}
        </p>
      </div>
      <div
        className={cn(
          "mt-4 font-display text-xl leading-snug sm:text-2xl",
          tone === "sage-dark" ? "text-cream" : "text-foreground"
        )}
      >
        {children}
      </div>
      {context && (
        <p
          className={cn(
            "mt-3 font-sans text-xs uppercase tracking-wide",
            tone === "sage-dark" ? "text-cream/60" : "text-muted-foreground"
          )}
        >
          {context}
        </p>
      )}
    </div>
  );
}

/** A short, opinionated, often funny statement of how things actually work here. */
export function BalkanishTruth({ children, className, context }: BlockProps) {
  return (
    <BrandBlock icon={Sparkles} label="Balkanish Truth" tone="rose" className={className} context={context}>
      {children}
    </BrandBlock>
  );
}

/** Practical, locally-sourced knowledge — the kind a guidebook wouldn't think to include. */
export function LocalWisdom({ children, className, context }: BlockProps) {
  return (
    <BrandBlock icon={Quote} label="Local Wisdom" tone="sage" className={className} context={context}>
      {children}
    </BrandBlock>
  );
}

/** The unwritten etiquette of Balkan coffee culture. */
export function CoffeeRule({ children, className, context }: BlockProps) {
  return (
    <BrandBlock icon={Coffee} label="Coffee Rule" tone="cream" className={className} context={context}>
      {children}
    </BrandBlock>
  );
}

/** Unverifiable but always-correct wisdom, delivered the way a relative would. */
export function AuntieAdvice({ children, className, context }: BlockProps) {
  return (
    <BrandBlock icon={Heart} label="Auntie Advice" tone="sage-dark" className={className} context={context}>
      {children}
    </BrandBlock>
  );
}

/** A reminder that slow is the point, not a delay. */
export function PomaloMoment({ children, className, context }: BlockProps) {
  return (
    <BrandBlock icon={Clock} label="Pomalo Moment" tone="sage" className={className} context={context}>
      {children}
    </BrandBlock>
  );
}

/** How a shared drink resolves more than a shared itinerary ever could. */
export function RakijaDiplomacy({ children, className, context }: BlockProps) {
  return (
    <BrandBlock icon={Wine} label="Rakija Diplomacy" tone="rose" className={className} context={context}>
      {children}
    </BrandBlock>
  );
}

interface DestinationBlockProps {
  destination: Destination;
  className?: string;
}

function slowMomentFor(destination: Destination): string {
  if (destination.sunset_score >= 8.5) {
    return `Sunset, wherever the stone meets the water. ${destination.name}'s sunset score is too high to spend it indoors.`;
  }
  if (destination.slow_living_score >= 8.5) {
    return "Mid-afternoon, no plan, one coffee that quietly becomes two. That's the whole itinerary.";
  }
  return `Find the bench nobody else found. ${destination.name} rewards sitting still more than seeing everything.`;
}

/** The destination's best slow moment — derived from its sunset and slow-living scores. */
export function BestSlowMoment({ destination, className }: DestinationBlockProps) {
  return (
    <BrandBlock icon={Moon} label="Best Slow Moment" tone="sage" className={className} context={destination.best_season}>
      {slowMomentFor(destination)}
    </BrandBlock>
  );
}

function earlyReasonFor(destination: Destination): string {
  if (destination.crowd_score <= 3) {
    return `Honestly, not much — ${destination.name} barely fills up even at noon.`;
  }
  return `The hour before the day-trippers arrive, when ${destination.name} still belongs to the people who live there.`;
}

/** A reason to set an alarm — derived from how crowded the destination gets later in the day. */
export function WorthWakingUpFor({ destination, className }: DestinationBlockProps) {
  return (
    <BrandBlock icon={Sunrise} label="Worth Waking Up Early For" tone="rose" className={className}>
      {earlyReasonFor(destination)}
    </BrandBlock>
  );
}

function skipDoFor(destination: Destination, swap?: SecretSwap): { skip: string; doInstead: string } {
  if (swap) {
    return {
      skip: `Fighting the crowds in ${swap.famous_name}`,
      doInstead: `${destination.name} — same coastline, none of the queue.`,
    };
  }
  if (destination.food_score >= 8.5) {
    return {
      skip: "The waterfront menu with photos of the food",
      doInstead: "Whatever the place with the handwritten menu is serving today.",
    };
  }
  return {
    skip: "Rushing through on a day trip",
    doInstead: `Staying one night longer than planned in ${destination.name}.`,
  };
}

/** A direct, opinionated swap — what to skip here, and what to do instead. */
export function SkipThisDoThis({
  destination,
  swap,
  className,
}: DestinationBlockProps & { swap?: SecretSwap }) {
  const { skip, doInstead } = skipDoFor(destination, swap);
  return (
    <BrandBlock icon={ArrowRightLeft} label="Skip This, Do This Instead" tone="sage-dark" className={className}>
      <span className="block font-display text-lg leading-snug text-cream/55 line-through sm:text-xl">{skip}</span>
      <span className="mt-1.5 block">{doInstead}</span>
    </BrandBlock>
  );
}
