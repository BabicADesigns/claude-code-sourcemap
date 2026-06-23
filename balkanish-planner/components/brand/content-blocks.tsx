import type { LucideIcon } from "lucide-react";
import { Coffee, Quote, Clock, Wine, Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

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
