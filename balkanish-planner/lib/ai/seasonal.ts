/**
 * Phase 17 — Seasonal Intelligence Helpers
 *
 * Pure helper functions for querying SeasonalData attached to destinations.
 * No AI calls — all data comes from the curated editorial dataset.
 */

import type { SeasonalData } from "@/lib/types";

export function isBestMonth(data: SeasonalData, month: number): boolean {
  return data.best_months.includes(month);
}

export function isAvoidMonth(data: SeasonalData, month: number): boolean {
  return data.avoid_months?.includes(month) ?? false;
}

function monthToSeason(month: number): keyof SeasonalData["seasonal_highlights"] {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/**
 * Returns a human-readable seasonal summary for a destination and travel month.
 * Falls back to neutral copy when no editorial seasonal_data exists.
 */
export function seasonalSummary(data: SeasonalData, month: number): string {
  if (isBestMonth(data, month)) {
    const season = monthToSeason(month);
    return data.seasonal_highlights[season] ?? "One of the best times to visit.";
  }
  if (isAvoidMonth(data, month)) {
    return data.avoid_reason ?? "Consider visiting at a different time of year.";
  }
  return "A pleasant time to visit, outside the busiest season.";
}

export function rainydayHints(data: SeasonalData): string[] {
  return data.rainy_day_ideas ?? [];
}

/**
 * Derives a 0–1 seasonal fitness score for a given destination and month.
 * Used by recommendation-score.ts as the season_fit sub-score.
 */
export function seasonFit(data: SeasonalData | null | undefined, month: number): number {
  if (!data) return 0.5;
  if (isBestMonth(data, month)) return 1;
  if (isAvoidMonth(data, month)) return 0.1;
  return 0.55;
}
