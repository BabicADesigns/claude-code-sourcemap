/**
 * Share Brand Configuration
 *
 * Centralizes all product attribution for generated share assets.
 *
 * NAMING NOTE: "Balkanish" as a standalone word has an existing use by an
 * external lifestyle/merch brand. This product is the "Balkanish Travel Planner".
 * Attribution copy uses the full product name to avoid brand confusion.
 * The exact strings are configurable so a future owner can rebrand without
 * touching renderer or component code.
 *
 * HOW TO REBRAND ALL SHARE ASSETS:
 * Change the values in DEFAULT_SHARE_BRAND_CONFIG (or supply a custom config
 * to ShareModal). No renderer or component logic needs to change.
 */

export interface ShareBrandConfig {
  /** Full product name, used in headlines and alt text */
  productName: string;
  /** Attribution line on generated images, max ~50 chars */
  attributionLine: string;
  /** Shorter form for tight spaces */
  shortAttribution: string;
  /** Website URL label shown on share assets */
  websiteLabel: string;
  /** Canonical website URL (not displayed, used in link metadata) */
  websiteUrl: string;
  /** Path to a logo asset (relative or data URI). Null = use LogoMark SVG. */
  logoAsset: string | null;
  /** Optional small brand mark text (e.g. "★") to render near attribution */
  shareMark: string | null;
  /** Owner/operator brand name — null means do not show separately */
  ownerBrand: string | null;
  /** When false the attribution line is omitted entirely */
  attributionEnabled: boolean;
  /** Selects visual template variant for brand components */
  templateVariant: "warm" | "minimal" | "editorial";
}

export const DEFAULT_SHARE_BRAND_CONFIG: ShareBrandConfig = {
  productName: "Balkanish Travel Planner",
  attributionLine: "Planned with Balkanish Travel Planner",
  shortAttribution: "Balkanish Travel Planner",
  websiteLabel: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
    : "balkanish.babicadesigns.blog",
  websiteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://balkanish.babicadesigns.blog",
  logoAsset: null,
  shareMark: null,
  ownerBrand: null,
  attributionEnabled: true,
  templateVariant: "warm",
};
