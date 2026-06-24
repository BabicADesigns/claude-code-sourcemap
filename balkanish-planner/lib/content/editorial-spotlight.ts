import type { Destination } from "@/lib/types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Parses a free-text best_season string (e.g. "April–June, September–October" or
 * "Late May to mid-June, or September") into the set of months it covers. Range notation
 * ("Month–Month") expands to every month in between; anything else is matched by literal
 * month-name substring, which is forgiving of the "Late X to mid-Y" phrasing the mock copy uses.
 */
function monthsInSeasonText(text: string): Set<number> {
  const months = new Set<number>();
  for (const part of text.split(",").map((p) => p.trim())) {
    const range = part.match(/^([A-Za-z]+)\s*[–-]\s*([A-Za-z]+)/);
    const start = range ? MONTH_NAMES.indexOf(range[1]) : -1;
    const end = range ? MONTH_NAMES.indexOf(range[2]) : -1;
    if (start !== -1 && end !== -1) {
      for (let i = start; ; i = (i + 1) % 12) {
        months.add(i);
        if (i === end) break;
      }
      continue;
    }
    MONTH_NAMES.forEach((name, i) => {
      if (part.includes(name)) months.add(i);
    });
  }
  return months;
}

function withoutExcluded(destinations: Destination[], exclude?: Set<string>): Destination[] {
  return exclude ? destinations.filter((d) => !exclude.has(d.id)) : destinations;
}

/** The homepage's single highest-conviction pick — the is_featured destination with the strongest story score, the one the editors would lead an issue with. */
export function getFeaturedDestination(destinations: Destination[], exclude?: Set<string>): Destination | undefined {
  const pool = withoutExcluded(destinations.filter((d) => d.is_featured), exclude);
  return [...pool].sort((a, b) => b.story_score - a.story_score || a.name.localeCompare(b.name))[0];
}

/** Whichever destination is actually in season right now, parsed from its best_season text — falls back to the highest slow_living_score featured destination if nothing matches the current month. */
export function getSeasonalDestination(
  destinations: Destination[],
  exclude?: Set<string>,
  now: Date = new Date()
): Destination | undefined {
  const currentMonth = now.getMonth();
  const pool = withoutExcluded(destinations, exclude);
  const inSeason = pool.filter((d) => monthsInSeasonText(d.best_season).has(currentMonth));
  const ranked = (inSeason.length > 0 ? inSeason : pool.filter((d) => d.is_featured)).sort(
    (a, b) => b.slow_living_score - a.slow_living_score || a.name.localeCompare(b.name)
  );
  return ranked[0];
}

/** A small curated set distinct from the featured/seasonal leads — supporting picks chosen for a mix of local feel and food strength. */
export function getEditorsPicks(destinations: Destination[], exclude?: Set<string>, count = 3): Destination[] {
  const pool = withoutExcluded(destinations.filter((d) => d.is_featured), exclude);
  return [...pool]
    .sort((a, b) => b.local_score + b.food_score - (a.local_score + a.food_score) || a.name.localeCompare(b.name))
    .slice(0, count);
}

/** The quietest of the quiet — lowest crowd_score among featured destinations, the one place worth spotlighting before everyone else finds it. */
export function getHiddenGemSpotlight(destinations: Destination[], exclude?: Set<string>): Destination | undefined {
  const pool = withoutExcluded(destinations.filter((d) => d.is_featured), exclude);
  return [...pool].sort((a, b) => a.crowd_score - b.crowd_score || a.name.localeCompare(b.name))[0];
}
