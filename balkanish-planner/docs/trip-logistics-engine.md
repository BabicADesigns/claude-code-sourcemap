# Trip Logistics Engine (Phase 19)

The Trip Logistics Engine adds route practicality scoring, transport preference personalization, and "getting around" UI to the Balkanish AI Planner. It surfaces how hard it actually is to get from stop to stop — without fabricating live schedules or booking data.

---

## Architecture overview

The engine separates three fundamentally different kinds of information:

| Layer | Type | Source | Confidence |
|-------|------|--------|-----------|
| Stable editorial | Road distance, drive-time estimate, border crossing basics | Curated `logistics_connections` table | `EDITORIAL_STABLE` |
| Planning estimate | Haversine-computed distance × road factor | Runtime math | `EDITORIAL_ESTIMATE` |
| Verify before travel | Ferry info, seasonal road closures, border document requirements | Editorial + seasonal notes | `VERIFY_BEFORE_TRAVEL` |
| Live provider | Real-time schedules, live prices | _Never used unless a live integration exists_ | `LIVE_PROVIDER` |

**Critical constraint:** `LIVE_PROVIDER` confidence must never be assigned to a segment unless there is a genuine live data integration. It is not used anywhere in Phase 19 — it exists as a typed reserved value for a future live-data layer.

---

## Data model

### `LogisticsConnection` (database + types)

Stored in Supabase `logistics_connections` table (migration `0016_phase19_logistics.sql`). Each row represents a directional route between two destination slugs.

Key fields:
- `from_destination_slug` / `to_destination_slug` — identify the endpoints
- `primary_mode` — `TransportMode` enum value (car, ferry, bus, etc.)
- `practicality` — `RoutePracticality` JSONB: `{ rating, reason, confidence }`
- `ferry_info` — optional `FerryInfo` JSONB (operator, booking tip, advance-booking flag)
- `border_info` — optional `BorderInfo` JSONB (crossing point, typical wait, disclaimer)
- `camper_info` — optional `CamperRoadInfo` JSONB (narrow road warning, scenic notes, parking)
- `active: false, demo_only: true` for all current fixtures

### `TravelSegment` (runtime, never persisted)

Computed client-side after itinerary generation. Not saved to the database — travel segments are always recomputed from the current connections + haversine fallback when an itinerary is displayed.

```typescript
interface TravelSegment {
  from_destination_slug: string;
  from_destination_name: string;
  to_destination_slug: string;
  to_destination_name: string;
  primary_mode: TransportMode;
  distance_km: number;
  drive_time_estimate?: string;
  practicality: RoutePracticality;
  editorial_note?: string;
  ferry_info?: FerryInfo;
  border_info?: BorderInfo;
  is_estimated: boolean;  // true = haversine-computed, no editorial connection found
}
```

---

## Route practicality scoring

`lib/ai/route-practicality.ts` is the heart of the engine.

### `evaluateRoutePracticality()`

Given a haversine distance (km), optional editorial connection, and transport preferences, returns a `RoutePracticality` with a human-readable `reason`. If an editorial `LogisticsConnection` exists, its stored practicality is used directly. If not, the haversine fallback applies:

| Road km estimate | Rating |
|-----------------|--------|
| ≤ 50 km | EASY |
| ≤ 120 km | MANAGEABLE |
| ≤ 220 km | LONG_DAY |
| ≤ 350 km | COMPLEX |
| > 350 km | NOT_RECOMMENDED |

Road km = haversine km × 1.4 (road factor). Travel time is estimated by mode using simple speed assumptions (car: 70 km/h, camper: 55 km/h, bus: 55 km/h, ferry: 25 km/h, etc.). All haversine-computed segments are marked `is_estimated: true` and display a "Planning estimate" label in the UI.

**Important:** haversine × 1.4 is not accurate. It does not account for mountain roads, ferries, border wait times, or one-way routing. It is good enough to indicate effort level (EASY vs. LONG_DAY) for planning purposes only.

### `buildTravelSegmentsForItinerary()`

Takes a grounded itinerary's `stops` and `legDistancesKm` arrays, looks up editorial connections for each consecutive stop pair, and returns an array of `TravelSegment`. Called client-side in `planner-flow.tsx` after generation.

### `buildLogisticsContextForBrief()`

Formats a logistics context string included in the AI prompt brief. Gives the AI awareness of approximate travel distances between stops so it can weight its narrative toward realistic daily movement.

### `inferDayType()`

Based on total distance moved and whether a day trip exists, classifies a day as `EXPERIENCE_DAY`, `TRANSFER_DAY`, `MIXED_DAY`, or `REST_DAY`. Not yet surfaced in UI (reserved for future Day Type badges).

---

## Transport preference personalization

Users can optionally specify how they plan to travel. This surfaces in:
- The planner wizard vibe step (step 4, alongside mood + cuisine)
- The `PlannerInput.transport_preferences` field (Zod schema)
- The AI brief (`transport_style` key in personalization block)
- The user's profile `transport_preferences` column (persisted)

### Available preferences

| Value | Label |
|-------|-------|
| `own_car` | Own car |
| `rental_car` | Rental car |
| `public_transport_preferred` | Public transport |
| `avoid_driving` | Avoid driving |
| `camper_motorhome` | Camper / motorhome |
| `motorcycle` | Motorcycle |
| `cycling_focused` | Cycling |
| `ferry_friendly` | Ferry-friendly |
| `avoid_ferries` | Avoid ferries |

Transport preferences are hints, not hard constraints. The route practicality engine uses them to slightly adjust scoring comments (e.g., noting camper road suitability) but does not filter out destinations.

---

## Ferry and island readiness

`FerryInfo` is a structured JSONB type — it carries operator name, frequency hint, booking tip, advance-booking flag, vehicle capability, and a `last_verified_season` field. **No live schedule data is ever fabricated.** The disclaimer "Ferry schedules change seasonally. Check the operator's website..." is shown wherever ferry info appears.

`advance_booking_required: true` triggers a prominent warning in both the web UI (`TravelSegmentCard`) and the PDF Getting Around section.

---

## Border crossing awareness

`BorderInfo` carries crossing point, typical wait hint, document requirements, and `last_verified_at`. The field is clearly marked as editorially estimated, and a disclaimer is shown: "Border rules change. Always verify current requirements with official sources before you travel."

Border info is treated as `VERIFY_BEFORE_TRAVEL` by design — it is editorial guidance, not official government advice.

---

## UI components

### `TravelSegmentCard` / `TravelSegmentsSection`

`components/logistics/travel-segment.tsx`

Progressive disclosure: the complexity badge (colored dot + label) is immediately visible. Reason text and ferry/border notices appear below. `is_estimated` segments show a "Planning estimate" label at the bottom.

Color mapping:
- EASY → sage dark
- MANAGEABLE → sage
- LONG_DAY → amber
- COMPLEX → orange
- NOT_RECOMMENDED → rose

### `FerryNotice`

`components/logistics/ferry-notice.tsx`

Standalone reusable ferry notice card for contexts outside TravelSegmentCard.

### PDF: Getting Around section

`components/planner/itinerary-pdf.tsx`

Optional page inserted between Local Notes and Local Recommendations when `travelSegments` is provided. Includes the estimate disclaimer at the top, one card per segment, and inline ferry/border notes.

---

## Data layer

### `lib/data/logistics-connections.ts`

- `getLogisticsConnections()` — returns `[]` when Supabase is unconfigured (engine falls back to haversine)
- `getAllLogisticsConnectionsForAdmin()` — falls back to mock data for admin panel
- `findLogisticsConnection()` — utility to look up a connection by slug pair

### `lib/data/logistics-connections-mock.ts`

Six demo connections shipped as seed data:
- dubrovnik → kotor (border crossing demo)
- split → hvar (ferry demo)
- zagreb → plitvice (EASY day trip)
- sarajevo → mostar (EASY, border)
- kotor → budva (EASY coastal)
- belgrade → novi-sad (EASY highway)

All marked `active: false, demo_only: true`. The route practicality engine ignores inactive connections and computes haversine estimates instead.

---

## Admin editorial readiness

`app/admin/logistics/page.tsx` provides a read-only view of all connections (including inactive and demo-only). Connections are managed via Supabase migrations and seed data; no inline editing UI is provided in Phase 19.

Access follows the same editor allow-list pattern as all other admin pages (`isEditorEmail()`).

---

## i18n

A new `logistics` namespace is registered in all 4 locales (en/de/it/hr). It covers:
- Travel segment labels and section copy
- Complexity level labels
- Confidence level labels
- Transport mode labels
- Ferry notice strings (including seasonal disclaimer)
- Border notice strings (including change disclaimer)
- Camper note labels
- Transport preference labels
- PDF section strings

---

## Supabase schema

Migration: `supabase/migrations/0016_phase19_logistics.sql`

- `logistics_connections` table with JSONB columns for practicality, ferry_info, border_info, camper_info, sources
- Row Level Security: public SELECT on active records, service_role full access
- `transport_preferences text[]` column added to `profiles` table
- `updated_at` trigger registered on `logistics_connections`

---

## Key design decisions

**Why client-side segment computation?**
Consistent with Phase 18 partner matching. Both are post-generation enrichment steps that depend on user-facing data already loaded into the planner. Computing client-side avoids threading segments through the itinerary Zod schema and keeps saved itinerary JSON stable across phases.

**Why haversine × 1.4, not actual routing?**
Routing APIs (Google Maps, OSRM) introduce external dependencies, latency, cost, and API key complexity. The 1.4 road factor is a documented approximation that gives travellers a useful planning signal (is this a 45-minute hop or a 4-hour slog?) without requiring live data. The `is_estimated` label and "Planning estimate" badge make the approximation visible.

**Why not persist travel segments?**
Segments are always recomputed from the current connection data + haversine math. Persisting them would create stale data problems as editorial connections are updated. The computation is fast (O(n) for n consecutive stop pairs).

**Why `active: false` for all demo fixtures?**
Keeps the default experience (haversine fallback) consistent for all development environments. Editors activate specific connections when they are ready to serve verified data.
