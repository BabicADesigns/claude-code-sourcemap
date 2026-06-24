import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ImageCredit } from "@/lib/types";

/** Recurring horizontal motif: a faint Adriatic wave line, used between sections instead of the lace divider when a lighter touch is wanted. */
export function WaveDivider({ className }: { className?: string }) {
  return <div className={cn("wave-divider", className)} aria-hidden="true" />;
}

/**
 * Wraps a next/image `fill` image with the editorial colour grade + grain
 * treatment (warm Mediterranean light, quiet vignette) so placeholder
 * photography reads as a considered, consistent photo system rather than
 * generic stock. Use anywhere a hero/card image currently sits inside a
 * relative-positioned wrapper.
 */
export function EditorialImage({
  src,
  alt,
  className,
  imageClassName,
  priority,
  sizes,
  vignette = false,
  children,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  vignette?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("editorial-frame", vignette && "editorial-frame--vignette", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
      />
      {children}
    </div>
  );
}

/** Asymmetric "lead feature + grid" pattern: one large image-and-overlay card, used to break up uniform card grids on list pages. */
export function FeatureLead({
  href,
  src,
  alt,
  eyebrow,
  title,
  description,
  credit,
  className,
}: {
  href: string;
  src: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description: string;
  credit?: ImageCredit;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group block", className)}>
      <EditorialImage
        src={src}
        alt={alt}
        vignette
        className="aspect-[4/3] rounded-xl sm:aspect-[16/10]"
        imageClassName="transition-transform duration-500 group-hover:scale-105"
        sizes="(min-width: 1024px) 66vw, 100vw"
      >
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 text-cream sm:p-8">
          {eyebrow && (
            <Badge variant="accent" className="w-fit">
              {eyebrow}
            </Badge>
          )}
          <h3 className="mt-3 font-display text-2xl sm:text-4xl">{title}</h3>
          <p className="mt-2 max-w-md font-serif text-sm text-cream/90 sm:text-base">{description}</p>
          {credit && <PhotoCredit credit={credit} className="mt-3 w-fit" />}
        </div>
      </EditorialImage>
    </Link>
  );
}

/** Editorial pull quote — a large, set-apart line used to break up long-form pages. */
export function PullQuote({
  children,
  attribution,
  centered = false,
  className,
}: {
  children: React.ReactNode;
  attribution?: string;
  centered?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        centered ? "py-1 text-center" : "border-l-2 border-accent py-1 pl-5 sm:pl-7",
        className
      )}
    >
      <blockquote className="font-display text-2xl italic leading-snug text-sage-dark sm:text-3xl">
        <span className="mr-1 text-accent">&ldquo;</span>
        {children}
        <span className="text-accent">&rdquo;</span>
      </blockquote>
      {attribution && (
        <figcaption className="mt-2 font-sans text-xs uppercase tracking-widest text-muted-foreground">
          {attribution}
        </figcaption>
      )}
    </figure>
  );
}

/** "What locals know" callout — a short list of insider tells, tagged with a location-marker motif. */
export function WhatLocalsKnow({
  tips,
  className,
}: {
  tips: string[];
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-secondary/40 bg-secondary/10 p-6 sm:p-7", className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-sage-dark">
          <MapPin className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-sage-dark">What Locals Know</p>
      </div>
      <ul className="mt-4 space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex gap-2.5 font-serif leading-relaxed text-foreground/85">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
            {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A handwritten-margin-note accent for a small, easily-missed detail worth flagging. */
export function HandwrittenNote({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "-rotate-1 font-script text-base italic text-rose sm:text-lg",
        className
      )}
    >
      {children}
    </p>
  );
}

/** A small postage-stamp-style mark — used on postcards and as a destination-page accent. */
export function TravelStamp({ label = "BALKANISH", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-16 w-14 rotate-3 flex-col items-center justify-center gap-0.5 border-2 border-dashed border-sage-dark/50 bg-cream/90 text-sage-dark shadow-sm",
        className
      )}
      aria-hidden="true"
    >
      <span className="font-sans text-[8px] font-semibold uppercase tracking-widest">{label}</span>
      <span className="h-3 w-3 rounded-full border border-sage-dark/40" />
      <span className="font-script text-[10px] italic">par avion</span>
    </div>
  );
}

/** A circular postal cancellation mark — pairs with TravelStamp to complete the mailed-postcard illusion. */
export function Postmark({ label = "BALKANISH POST", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-sage-dark/40 text-sage-dark/80 mix-blend-multiply",
        className
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-1 rounded-full border border-dashed border-sage-dark/30" />
      <span className="-rotate-[12deg] px-1 text-center font-sans text-[6.5px] font-semibold uppercase leading-tight tracking-widest">
        {label}
      </span>
    </div>
  );
}

/** Vintage postcard framing — deckled border, faint corner stamp, slight tilt. */
export function PostcardFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-sm border-[6px] border-cream bg-cream shadow-[0_8px_30px_-8px_rgba(28,25,23,0.35)]",
        className
      )}
    >
      <TravelStamp className="absolute -right-3 -top-3 z-10" />
      {children}
    </div>
  );
}

/** A small recurring motif: a location pin + place name, for use over images or near headings. */
export function LocationTag({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-cream/40 bg-charcoal/30 px-3 py-1 font-sans text-[11px] uppercase tracking-widest text-cream backdrop-blur-sm",
        className
      )}
    >
      <MapPin className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

/** The quiet "Photo: name · source" attribution real travel magazines tuck into a hero's corner — pass the credit off an ImageAsset. */
export function PhotoCredit({ credit, className }: { credit: ImageCredit; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-charcoal/30 px-2.5 py-1 font-sans text-[10px] uppercase tracking-wide text-cream/80 backdrop-blur-sm",
        className
      )}
    >
      Photo: {credit.photographer} · {credit.source}
    </span>
  );
}

/** A faint dotted route-line accent — a quiet map detail used sparingly near destination content. */
export function MapDetailAccent({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground/70", className)} aria-hidden="true">
      <svg width="40" height="12" viewBox="0 0 40 12" className="shrink-0" role="presentation">
        <path d="M0 6 H40" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="36" cy="6" r="2.5" fill="currentColor" />
      </svg>
      <span className="font-sans text-[10px] uppercase tracking-widest">{label}</span>
    </div>
  );
}

/** A vintage-guidebook-style clipping — a quoted-from-an-old-travel-guide rule, set in serif italic between two faint hairlines. */
export function GuidebookReference({
  children,
  source,
  className,
}: {
  children: React.ReactNode;
  source?: string;
  className?: string;
}) {
  return (
    <div className={cn("border-y border-foreground/15 py-3", className)}>
      <p className="font-serif text-sm italic leading-relaxed text-foreground/70">{children}</p>
      {source && (
        <p className="mt-1.5 font-sans text-[10px] uppercase tracking-widest text-muted-foreground">{source}</p>
      )}
    </div>
  );
}
