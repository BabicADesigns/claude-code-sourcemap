import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  className,
}: {
  href: string;
  src: string;
  alt: string;
  eyebrow?: string;
  title: string;
  description: string;
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
