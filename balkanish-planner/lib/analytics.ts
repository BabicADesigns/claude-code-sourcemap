export const ANALYTICS_EVENTS = {
  DESTINATION_VIEW: "Destination View",
  FOOD_FIND_VIEW: "Food Find View",
  CULTURE_NOTE_VIEW: "Culture Note View",
  SECRET_SWAP_VIEW: "Secret Swap View",
  POSTCARD_DOWNLOAD: "Postcard Download",
  ITINERARY_GENERATED: "Itinerary Generated",
  SAVE_ACTION: "Save Action",
  NEWSLETTER_SIGNUP: "Newsletter Signup",
  PDF_GENERATED: "PDF Generated",
  PDF_DOWNLOADED: "PDF Downloaded",
  PDF_EMAILED: "PDF Emailed",
  // Phase 16 — Community Intelligence & Founder's Picks
  COMMUNITY_NOTE_SUBMITTED: "Community Note Submitted",
  GEM_CONFIRMED: "Gem Confirmed",
  STORY_VIEWED: "Story Viewed",
  LOCAL_HERO_VIEWED: "Local Hero Viewed",
  FOUNDERS_PICK_VIEWED: "Founders Pick Viewed",
  // Phase 23 — Live Trip Mode (privacy-conscious; no location, no PII, no item text)
  LIVE_TRIP_OPENED: "Live Trip Opened",
  TODAY_ITEM_MARKED_DONE: "Today Item Marked Done",
  TODAY_ITEM_SKIPPED: "Today Item Skipped",
  LIGHTER_DAY_PROPOSED: "Lighter Day Proposed",
  LIGHTER_DAY_ACCEPTED: "Lighter Day Accepted",
  OFFLINE_SNAPSHOT_SAVED: "Offline Snapshot Saved",
  TOMORROW_PREVIEW_OPENED: "Tomorrow Preview Opened",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type AnalyticsProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: AnalyticsProps }) => void;
  }
}

/** Fires a Plausible custom event. No-ops on the server and whenever the script hasn't loaded (disabled, blocked, etc). */
export function track(event: AnalyticsEventName, props?: AnalyticsProps) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") return;
  window.plausible(event, props ? { props } : undefined);
}
