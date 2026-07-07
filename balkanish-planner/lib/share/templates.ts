/**
 * Share Template Registry
 *
 * Adding a new template:
 * 1. Add a new ShareTemplateId value to lib/share/types.ts
 * 2. Add the template entry here with supported formats
 * 3. Add a case in TripShareCard (components/share/trip-share-card.tsx) for the new template
 * 4. Add i18n keys to all 4 locale share.json files
 *
 * The registry maps IDs to metadata; rendering logic lives in TripShareCard only.
 */

import type { ShareTemplate } from "@/lib/share/types";

export const SHARE_TEMPLATES: ShareTemplate[] = [
  {
    id: "JOURNEY_SUMMARY",
    labelKey: "templates.journeySummary",
    formats: ["story", "feed", "postcard"],
  },
  {
    id: "BALKAN_STORY",
    labelKey: "templates.balkanStory",
    formats: ["story", "feed", "postcard"],
  },
  {
    id: "POSTCARD",
    labelKey: "templates.postcard",
    formats: ["postcard", "feed"],
  },
];

export const DEFAULT_TEMPLATE_ID: import("@/lib/share/types").ShareTemplateId =
  "JOURNEY_SUMMARY";
