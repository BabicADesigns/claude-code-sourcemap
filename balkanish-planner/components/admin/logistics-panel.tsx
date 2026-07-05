"use client";

import type { LogisticsConnection, RouteComplexity } from "@/lib/types";
import { ROUTE_COMPLEXITY_LABELS, TRANSPORT_MODE_LABELS } from "@/lib/types";

const COMPLEXITY_BADGE: Record<RouteComplexity, string> = {
  EASY: "bg-sage-dark/10 text-sage-dark",
  MANAGEABLE: "bg-sage/20 text-sage-dark",
  LONG_DAY: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
  COMPLEX: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400",
  NOT_RECOMMENDED: "bg-rose/10 text-rose",
};

export function LogisticsPanel({ connections }: { connections: LogisticsConnection[] }) {
  if (connections.length === 0) {
    return <p className="font-serif text-foreground/80">No logistics connections found.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {connections.map((conn) => (
        <div key={conn.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                {conn.from_destination_slug} → {conn.to_destination_slug}
              </p>
              <h3 className="mt-1 font-display text-xl text-sage-dark">
                {TRANSPORT_MODE_LABELS[conn.primary_mode]} route
              </h3>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-foreground/70">
                {conn.road_distance_km != null && (
                  <span>~{conn.road_distance_km} km</span>
                )}
                {conn.drive_time_estimate && <span>{conn.drive_time_estimate}</span>}
                {conn.transit_time_estimate && <span>Transit: {conn.transit_time_estimate}</span>}
              </div>
              {conn.practicality.reason && (
                <p className="mt-2 font-serif text-sm text-foreground/80">{conn.practicality.reason}</p>
              )}
              {conn.editorial_note && (
                <p className="mt-1 font-serif text-xs italic text-foreground/60">{conn.editorial_note}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {conn.ferry_info && (
                  <span className="rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 font-sans text-xs text-accent">
                    Ferry
                  </span>
                )}
                {conn.border_info && (
                  <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 font-sans text-xs text-muted-foreground">
                    Border crossing
                  </span>
                )}
                {conn.camper_info && (
                  <span className="rounded-full border border-sage/30 bg-sage/5 px-2 py-0.5 font-sans text-xs text-sage-dark">
                    Camper notes
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`shrink-0 rounded-full border px-3 py-1 font-sans text-xs uppercase tracking-widest ${COMPLEXITY_BADGE[conn.practicality.rating]}`}>
                {ROUTE_COMPLEXITY_LABELS[conn.practicality.rating]}
              </span>
              <div className="flex gap-1.5">
                {conn.demo_only && (
                  <span className="rounded-full bg-muted px-2 py-0.5 font-sans text-xs text-muted-foreground">
                    Demo only
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 font-sans text-xs ${conn.active ? "bg-sage/15 text-sage-dark" : "bg-muted text-muted-foreground"}`}>
                  {conn.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-foreground/60">
            <span>Confidence: {conn.practicality.confidence}</span>
            {conn.alternative_modes && conn.alternative_modes.length > 0 && (
              <span>
                Alt modes: {conn.alternative_modes.map((m) => TRANSPORT_MODE_LABELS[m]).join(", ")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
