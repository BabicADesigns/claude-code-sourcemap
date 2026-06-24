"use client";

import { useMemo } from "react";
import type { GeneratedItinerary } from "@/lib/ai/itinerary";
import { buildMapModel } from "@/lib/maps/itinerary-map-model";
import { createMapProjection } from "@/lib/maps/projection";

const VIEW_WIDTH = 400;
const VIEW_HEIGHT = 320;
const PADDING = 36;

/**
 * Route map for a generated itinerary: numbered overnight stops joined by a solid route
 * line, with day trips drawn as smaller markers off a dashed connector — "stay here" vs
 * "visit here" at a glance. Pure on-brand SVG, no map-tile dependency.
 */
export function ItineraryMap({ itinerary }: { itinerary: GeneratedItinerary }) {
  const model = useMemo(() => buildMapModel(itinerary), [itinerary]);

  if (model.stops.length === 0) return null;

  const projection = createMapProjection([...model.stops, ...model.dayTrips], VIEW_WIDTH, VIEW_HEIGHT, PADDING);
  const routePoints = model.stops.map((stop) => projection.project(stop));
  const routePath = routePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="mt-8 sm:mt-10">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">Route overview</p>

      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-cream/50 p-3 sm:p-5">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Route map: ${model.stops.map((stop) => stop.name).join(" → ")}${
            model.dayTrips.length > 0 ? `, with day trips to ${model.dayTrips.map((t) => t.name).join(", ")}` : ""
          }`}
        >
          {routePoints.length > 1 && (
            <path d={routePath} fill="none" stroke="#385048" strokeWidth={2} strokeLinecap="round" />
          )}

          {model.dayTrips.map((trip) => {
            const fromStop = model.stops.find((stop) => stop.slug === trip.fromStopSlug);
            if (!fromStop) return null;
            const from = projection.project(fromStop);
            const to = projection.project(trip);
            return (
              <line
                key={`${trip.slug}-${trip.day}-line`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#C4A096"
                strokeWidth={1.5}
                strokeDasharray="3 4"
              />
            );
          })}

          {model.dayTrips.map((trip) => {
            const p = projection.project(trip);
            return (
              <g key={`${trip.slug}-${trip.day}-marker`}>
                <circle cx={p.x} cy={p.y} r={6} fill="#F5EEE6" stroke="#C4A096" strokeWidth={2} />
                <circle cx={p.x} cy={p.y} r={2} fill="#C4A096" />
              </g>
            );
          })}

          {model.stops.map((stop) => {
            const p = projection.project(stop);
            return (
              <g key={stop.slug}>
                <circle cx={p.x} cy={p.y} r={11} fill="#385048" stroke="#F5EEE6" strokeWidth={2} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#F5EEE6">
                  {stop.order}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        {model.stops.map((stop) => (
          <li key={stop.slug} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-dark font-sans text-xs font-semibold text-cream">
              {stop.order}
            </span>
            <p className="font-serif text-sm text-foreground/85">
              <span className="font-semibold text-sage-dark">Base: {stop.name}</span> —{" "}
              {stop.dayStart === stop.dayEnd ? `Day ${stop.dayStart}` : `Days ${stop.dayStart}–${stop.dayEnd}`}
            </p>
          </li>
        ))}
        {model.dayTrips.map((trip) => (
          <li key={`${trip.slug}-${trip.day}`} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-rose"
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose" />
            </span>
            <p className="font-serif text-sm text-foreground/85">
              <span className="font-semibold text-rose">Day trip: {trip.name}</span> — Day {trip.day}, from{" "}
              {trip.fromStopName} ({trip.driveTime})
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
