"use client";

import { useEffect } from "react";
import { track, type AnalyticsEventName } from "@/lib/analytics";

/** Fires a Plausible pageview-style event once on mount — for detail pages that want a typed event instead of the generic pageview. */
export function TrackView({ event, props }: { event: AnalyticsEventName; props?: Record<string, string> }) {
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
