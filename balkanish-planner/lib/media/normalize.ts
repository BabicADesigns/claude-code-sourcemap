import type { AspectRatio, CultureNote, Destination, FoodFind, ImageAsset, MediaCategory } from "@/lib/types";

/** Credits authored before real photography existed — see docs/image-direction-v2.md's "placeholder honesty" principle. */
const PLACEHOLDER_PHOTOGRAPHERS = new Set(["Unassigned"]);

interface NormalizeDefaults {
  title?: string;
  location?: string;
  category: MediaCategory;
  aspect_ratio?: AspectRatio;
}

/**
 * Backfills the optional Phase 12 metadata fields (title, location, category, aspect_ratio,
 * credit.copyright) for an `ImageAsset` authored before those fields existed, deriving values
 * from data the asset's owner (a destination, food find, culture note) already has — never
 * inventing a fact. Anything the literal already sets explicitly passes through untouched, so
 * hand-curated entries can override any single field without losing the rest of the backfill.
 */
export function normalizeImageAsset(asset: ImageAsset, defaults: NormalizeDefaults): ImageAsset {
  const isPlaceholderCredit = PLACEHOLDER_PHOTOGRAPHERS.has(asset.credit.photographer);
  return {
    ...asset,
    title: asset.title ?? defaults.title,
    location: asset.location ?? defaults.location,
    category: asset.category ?? defaults.category,
    aspect_ratio: asset.aspect_ratio ?? defaults.aspect_ratio ?? "landscape",
    credit: {
      ...asset.credit,
      copyright:
        asset.credit.copyright ??
        (isPlaceholderCredit
          ? "Placeholder — rights holder not yet determined"
          : `© ${asset.credit.photographer}`),
    },
  };
}

export function normalizeDestinationHeroImage(
  asset: ImageAsset,
  destination: { name: string; region: string }
): ImageAsset {
  return normalizeImageAsset(asset, {
    title: destination.name,
    location: destination.region,
    category: "hero",
  });
}

export function normalizeDestinationGalleryImages(
  images: ImageAsset[],
  destination: { name: string; region: string }
): ImageAsset[] {
  return images.map((image, index) =>
    normalizeImageAsset(image, {
      title: `${destination.name} — ${index + 1}`,
      location: destination.region,
      category: "gallery",
    })
  );
}

export function normalizeFoodHeroImage(
  asset: ImageAsset,
  food: { name: string; region: string }
): ImageAsset {
  return normalizeImageAsset(asset, {
    title: food.name,
    location: food.region,
    category: "food",
  });
}

export function normalizeCultureHeroImage(
  asset: ImageAsset,
  note: { title: string; region: string | null }
): ImageAsset {
  return normalizeImageAsset(asset, {
    title: note.title,
    location: note.region ?? undefined,
    category: "culture",
  });
}

/**
 * Synthesizes a minimal placeholder `ImageAsset` from a legacy flat URL column
 * (`hero_image_url` / one entry of `gallery_image_urls`) for rows that predate
 * the Phase 13 `hero_image`/`gallery_images` jsonb columns (migration 0009) —
 * e.g. a real Supabase row written before those columns existed, or seeded
 * without them. Returns undefined when there's no URL to synthesize from,
 * so callers can fall back further rather than fabricate one.
 */
export function synthesizeImageAsset(url: string | null | undefined, label: string): ImageAsset | undefined {
  if (!url) return undefined;
  return {
    url,
    alt: `Editorial placeholder image for ${label} — to be replaced with real on-location photography.`,
    credit: { photographer: "Unassigned", source: "Legacy import" },
  };
}

/** Applies the destination hero/gallery backfill to a full `Destination`, for use at the data-layer boundary. */
export function normalizeDestination(destination: Destination): Destination {
  const label = `${destination.name}, ${destination.region}`;
  const heroImageSource =
    destination.hero_image ??
    synthesizeImageAsset(destination.hero_image_url, label) ??
    synthesizeImageAsset(`https://picsum.photos/seed/${destination.slug}/1200/800`, label);
  const galleryImageSources =
    destination.gallery_images && destination.gallery_images.length > 0
      ? destination.gallery_images
      : (destination.gallery_image_urls ?? [])
          .map((url) => synthesizeImageAsset(url, `${destination.name} — gallery`))
          .filter((image): image is ImageAsset => Boolean(image));

  return {
    ...destination,
    hero_image: normalizeDestinationHeroImage(heroImageSource, destination),
    gallery_images: normalizeDestinationGalleryImages(galleryImageSources, destination),
  };
}

/** Applies the food-find hero backfill to a full `FoodFind`, for use at the data-layer boundary. */
export function normalizeFoodFind(food: FoodFind): FoodFind {
  const label = `${food.name}, ${food.region}`;
  const heroImageSource =
    food.hero_image ??
    synthesizeImageAsset(food.hero_image_url, label) ??
    synthesizeImageAsset(`https://picsum.photos/seed/${food.slug}/1200/800`, label);
  return { ...food, hero_image: normalizeFoodHeroImage(heroImageSource, food) };
}

/** Applies the culture-note hero backfill to a full `CultureNote`, for use at the data-layer boundary. */
export function normalizeCultureNote(note: CultureNote): CultureNote {
  const heroImageSource =
    note.hero_image ??
    synthesizeImageAsset(note.hero_image_url, note.title) ??
    synthesizeImageAsset(`https://picsum.photos/seed/${note.slug}/1200/800`, note.title);
  return { ...note, hero_image: normalizeCultureHeroImage(heroImageSource, note) };
}
