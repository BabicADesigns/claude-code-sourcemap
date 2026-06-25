import { Svg, Path, Line, Circle, Text as SvgText, G } from "@react-pdf/renderer";
import type { GeneratedItinerary } from "@/lib/ai/itinerary";
import { buildMapModel } from "@/lib/maps/itinerary-map-model";
import { createMapProjection } from "@/lib/maps/projection";

const VIEW_WIDTH = 480;
const VIEW_HEIGHT = 280;
const PADDING = 32;

/** Native vector mirror of components/planner/itinerary-map.tsx, built with @react-pdf/renderer's Svg primitives so the PDF needs no rasterized image. */
export function ItineraryMapPdf({ itinerary }: { itinerary: GeneratedItinerary }) {
  const model = buildMapModel(itinerary);
  if (model.stops.length === 0) return null;

  const projection = createMapProjection([...model.stops, ...model.dayTrips], VIEW_WIDTH, VIEW_HEIGHT, PADDING);
  const routePoints = model.stops.map((stop) => projection.project(stop));
  const routePath = routePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  return (
    <Svg width={VIEW_WIDTH} height={VIEW_HEIGHT} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
      {routePoints.length > 1 && <Path d={routePath} stroke="#385048" strokeWidth={2} fill="none" />}

      {model.dayTrips.map((trip) => {
        const fromStop = model.stops.find((stop) => stop.slug === trip.fromStopSlug);
        if (!fromStop) return null;
        const from = projection.project(fromStop);
        const to = projection.project(trip);
        return (
          <Line
            key={`${trip.slug}-${trip.day}-line`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#C4A096"
            strokeWidth={1.5}
            strokeDasharray="3,4"
          />
        );
      })}

      {model.dayTrips.map((trip) => {
        const p = projection.project(trip);
        return (
          <G key={`${trip.slug}-${trip.day}-marker`}>
            <Circle cx={p.x} cy={p.y} r={6} fill="#F5EEE6" stroke="#C4A096" strokeWidth={2} />
            <Circle cx={p.x} cy={p.y} r={2} fill="#C4A096" />
          </G>
        );
      })}

      {model.stops.map((stop) => {
        const p = projection.project(stop);
        return (
          <G key={stop.slug}>
            <Circle cx={p.x} cy={p.y} r={11} fill="#385048" stroke="#F5EEE6" strokeWidth={2} />
            {/* @ts-expect-error react-pdf's SVGTextProps type omits fontSize, but its SVG text layout reads it directly off props */}
            <SvgText x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fill="#F5EEE6">
              {stop.order}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
