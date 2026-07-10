import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ASPECT_RATIO_CLASSES, type ImageAsset, type ImageCredit, type FoundersPick, type LocalHero, type BalkanishStory } from "@/lib/types";
import { resolveCaption } from "@/lib/media/caption";
import type { Locale } from "@/lib/i18n/config";

/**
 * Shared hero-height tiers (docs/image-direction-v2.md §4 audit flagged Hidden Gems and Food
 * Finds detail heroes as hand-tuned to two different, undocumented values). Pages pick a tier
 * instead of hand-tuning their own — `full` for a homepage/landing hero, `detail` for a
 * destination/food-find/culture-note detail page. Culture Notes deliberately uses neither — its
 * in-flow essay treatment with no full-bleed hero is intentional, not an oversight.
 */
export const HERO_HEIGHT = {
  full: "h-[62vh] min-h-[460px] sm:h-[72vh]",
  detail: "h-[38vh] min-h-[280px] sm:h-[50vh] sm:min-h-[360px]",
} as const;

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

/** The quiet "Photo: name · source" attribution real travel magazines tuck into a hero's corner — pass the credit off an ImageAsset. `copyright`, when set, surfaces as a hover title rather than cluttering the badge itself. */
export function PhotoCredit({ credit, className }: { credit: ImageCredit; className?: string }) {
  return (
    <span
      title={credit.copyright}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-charcoal/30 px-2.5 py-1 font-sans text-[10px] uppercase tracking-wide text-cream/80 backdrop-blur-sm",
        className
      )}
    >
      Photo: {credit.photographer} · {credit.source}
    </span>
  );
}

/**
 * Gallery layout for a mixed set of landscape/portrait/square images — CSS multi-column masonry
 * instead of a fixed grid with a hardcoded aspect ratio, so a portrait or square image doesn't get
 * force-cropped or leave an empty gap next to a landscape neighbour (requirement: no hardcoded
 * aspect-ratio assumptions). `locale` resolves any multilingual captions to plain text up front,
 * keeping this component itself a plain presentational client of lib/media/caption.
 */
export function MasonryGallery({
  images,
  locale,
  className,
}: {
  images: ImageAsset[];
  locale: Locale;
  className?: string;
}) {
  if (images.length === 0) return null;
  return (
    <div className={cn("columns-1 gap-4 sm:columns-2", className)}>
      {images.map((image, i) => {
        const caption = resolveCaption(image.caption, locale);
        return (
          <figure key={i} className="mb-4 break-inside-avoid">
            <div
              className={cn(
                "relative overflow-hidden rounded-xl",
                ASPECT_RATIO_CLASSES[image.aspect_ratio ?? "landscape"]
              )}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              {image.location && (
                <LocationTag label={image.location} className="absolute left-3 top-3 z-10" />
              )}
              <PhotoCredit credit={image.credit} className="absolute bottom-3 right-3 z-10" />
            </div>
            {caption && (
              <figcaption className="px-1 pt-2 font-serif text-sm italic text-foreground/70">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
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

// ---------------------------------------------------------------------------
// Phase 16 — Community Intelligence & Founder's Picks editorial components
// ---------------------------------------------------------------------------

/**
 * An elegant card for a founder's personal recommendation — distinct from general editorial copy
 * by its personal voice, handwritten sign-off, and portrait/portrait-less variants.
 */
export function FoundersPickCard({
  pick,
  className,
}: {
  pick: FoundersPick;
  className?: string;
}) {
  const signature = pick.signature_override ?? pick.founder?.signature ?? pick.founder?.name;
  return (
    <div className={cn("rounded-xl border border-accent/30 bg-accent/5 p-6 sm:p-7", className)}>
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-accent">
        Founder&apos;s Pick
      </p>
      <h3 className="mt-2 font-display text-xl text-sage-dark sm:text-2xl">{pick.title}</h3>
      <p className="mt-3 font-serif leading-relaxed text-foreground/85">{pick.body}</p>
      <div className="mt-5 flex items-center gap-3">
        {pick.founder?.photo && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
            <Image
              src={pick.founder.photo.url}
              alt={pick.founder.photo.alt}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
        )}
        <div className="min-w-0">
          {signature && (
            <p className="font-script text-lg italic text-sage-dark">{signature}</p>
          )}
          {pick.location && (
            <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
              {pick.location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** A compact character study card for a local hero — no external links to avoid becoming a business directory. */
export function LocalHeroCard({
  hero,
  className,
}: {
  hero: LocalHero;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-4 rounded-xl border border-border bg-card p-5", className)}>
      {hero.photo && (
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
          <Image
            src={hero.photo.url}
            alt={hero.photo.alt}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
      )}
      <div className="min-w-0">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">{hero.profession}</p>
        <h4 className="mt-0.5 font-display text-lg text-sage-dark">{hero.name}</h4>
        <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/80">{hero.story}</p>
      </div>
    </div>
  );
}

/** An editorial story card linking to the full narrative — shows hero image, category, and excerpt. */
export function StoryCard({
  story,
  locale,
  className,
}: {
  story: BalkanishStory;
  locale: Locale;
  className?: string;
}) {
  const title = story.title[locale] ?? story.title.en;
  const excerpt = story.excerpt ? (story.excerpt[locale] ?? story.excerpt.en) : undefined;
  return (
    <Link href={`/stories/${story.slug}`} className={cn("group block rounded-xl border border-border bg-card overflow-hidden", className)}>
      {story.hero_image && (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={story.hero_image.url}
            alt={story.hero_image.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <Badge variant="secondary" className="text-xs">{story.category.replace("_", " ")}</Badge>
        <h3 className="mt-2 font-display text-lg text-sage-dark">{title}</h3>
        {excerpt && (
          <p className="mt-1.5 font-serif text-sm leading-relaxed text-foreground/75 line-clamp-3">{excerpt}</p>
        )}
      </div>
    </Link>
  );
}
