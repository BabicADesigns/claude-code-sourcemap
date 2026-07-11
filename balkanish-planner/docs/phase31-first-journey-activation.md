# Phase 31 — First Journey Activation & Contextual Guidance

Balkanish Planner — contextual onboarding layer using existing product state.

Phase 31. This document describes the activation state model, the guidance component system, and the post-save orientation pattern introduced to resolve UX-008 and UX-009.

Core principle: **The product itself must become the onboarding mechanism.** No wizard, no forced tour, no welcome modal.

---

## Problem Statement

### UX-008 — New Authenticated Users Have No Orientation

After sign-up, users land on `/my-balkans` — an empty dashboard with no guidance on what to do. Bounce risk is high because there is no signal about what the product does or where to start.

### UX-009 — Post-Save Trip State Has No CTA

After saving a trip in the AI Planner, users receive no signal about what exists beyond the planning step. The Trip Companion, Live Trip, and reflection features are invisible until the user happens to revisit My Trips near their departure date.

---

## Design Constraints

The following patterns were explicitly rejected:

- ❌ Onboarding wizard or step flow
- ❌ Forced product tour or tooltip chain
- ❌ Welcome modal shown automatically on every visit
- ❌ Confetti or gamification
- ❌ Server-side new-user detection (adds DB roundtrip and complexity)

The system instead derives state from **existing product data** already loaded in each page's server component: authentication, saved content presence, itinerary existence, and trip lifecycle dates.

---

## Activation State Model

**File**: `lib/activation-state.ts`

### Type

```typescript
export type ActivationState =
  | "first_time"
  | "browsing_only"
  | "planning"
  | "active_trip"
  | "completed_trip"
  | "returning";
```

### State Definitions

| State | Condition | Guidance shown |
|---|---|---|
| `first_time` | No saved content, no trips | Welcome on My Balkans + My Trips orientation |
| `browsing_only` | Has saved content, no trips | No guidance (workspace has content) |
| `planning` | Has trips, all PLANNING lifecycle | No guidance (workspace has trips) |
| `active_trip` | Any trip in PRE_TRIP / DEPARTURE_DAY / IN_TRIP | No guidance |
| `completed_trip` | All trips COMPLETED | No guidance (forward handoff on reflection page handles this) |
| `returning` | Mix of lifecycle states | No guidance |

### `computeActivationState()`

Pure function — no I/O. Accepts:
- `savedContentCount: number` — total saves across all content types
- `itineraries: SavedItinerary[]` — user's saved trips
- `todayString: string` — YYYY-MM-DD for lifecycle computation

The function delegates lifecycle computation to the existing `computeLifecycle()` from `lib/ai/live-trip.ts`.

### Per-Workspace Approximation

Both workspace pages load their own canonical data. Neither cross-fetches:
- **My Balkans** passes `itineraries: []` (does not load trips). Guidance appears only when the workspace itself is empty.
- **My Trips** passes `savedContentCount: 0` (does not load saved content). Guidance appears only when the trip workspace is empty.

This approximation is intentional: each workspace's guidance reflects the state of its own canonical content, not global account state.

---

## Guidance Component System

### `components/guidance/my-balkans-guidance.tsx`

**Trigger**: `isEmpty === true` (all 6 My Balkans sections are empty).

**Content**:
- Eyebrow: "Getting started" (i18n key: `guidance.welcomeEyebrow`)
- Title: "Your Balkans workspace is ready." (i18n key: `guidance.myBalkansEmptyTitle`)
- Hint copy describing two starting paths (i18n key: `guidance.myBalkansEmptyHint`)
- Two CTAs:
  - "Browse Hidden Gems" → `/hidden-gems`
  - "Plan Your First Trip" → `/planner`

**Behavior**: Returns `null` when `isEmpty === false`. No animation, no auto-dismiss, no session flag. Disappears naturally once the user saves their first piece of content and the page refetches.

---

### `components/guidance/my-trips-guidance.tsx`

**Trigger**: `state === "first_time"`.

**Content**:
- Eyebrow: "Getting started" (i18n key: `guidance.welcomeEyebrow`)
- Title: "No trips saved yet." (i18n key: `guidance.myTripsEmptyTitle`)
- Hint copy describing the AI Planner (i18n key: `guidance.myTripsEmptyHint`)
- One CTA:
  - "Plan Your First Trip" → `/planner`

**Behavior**: Returns `null` for all states other than `"first_time"`. Disappears naturally once the user saves a trip.

---

## Post-Save Orientation (UX-009)

### Problem

`saveItinerary()` in `lib/actions/itineraries.ts` returned `{ error?: string }` only. The newly created trip ID was computed internally but discarded, making it impossible to deep-link to the saved trip from the planner post-save state.

### Fix

Return type extended to `{ id?: string; error?: string }`. The `tripId` (previously discarded) is now returned.

### Post-Save UI in `planner-flow.tsx`

When `itinerarySaved === true`, a guidance block renders below the save confirmation:

- Title: "Your trip is saved." (`guidance.tripSavedTitle`)
- Hint: "Find it in My Trips whenever you need it…" (`guidance.tripSavedHint`)
- Two CTAs:
  - "View in My Trips" → `/my-trips`
  - "Open Trip Checklist" → `/trips/{id}/companion` (only rendered when `savedTripId` is non-null)

The companion deep-link is the primary new discovery path for the Trip Companion feature.

---

## i18n — Forward Handoff Cleanup

### Problem

Three forward-handoff strings were hardcoded English in server components:
- "Go to Live Trip →" (companion page)
- "Reflect on this trip →" (companion page)  
- "Plan your next trip →" (reflection page)

### Fix

Two new client components added to `components/planner/trip-nav-back.tsx`:

**`TripCompanionForwardHandoff({ href })`** — used by `/trips/[id]/companion`. Derives label from `href`: if it contains `/today` → `navigation.goToLiveTrip`; otherwise → `navigation.reflectOnTrip`.

**`ReflectionForwardHandoff()`** — used by `/trips/[id]/reflection`. Always renders `navigation.planNextTrip`.

New i18n key added to all 4 locales:

| Locale | `navigation.goToLiveTrip` |
|---|---|
| EN | Go to Live Trip → |
| DE | Zur Live-Reise → |
| IT | Vai al Viaggio in Corso → |
| HR | Idi na Aktivno Putovanje → |

(`navigation.reflectOnTrip` and `navigation.planNextTrip` already existed from Phase 29/30.)

---

## i18n Key Registry — Phase 31 Additions

All keys live in the `guidance` namespace of `common.json` (all 4 locales):

| Key | EN value |
|---|---|
| `guidance.welcomeEyebrow` | Getting started |
| `guidance.myBalkansEmptyTitle` | Your Balkans workspace is ready. |
| `guidance.myBalkansEmptyHint` | Save a hidden gem, a food spot, or a culture note worth keeping. Or skip straight to the AI Planner and build your first trip. |
| `guidance.browseHiddenGems` | Browse Hidden Gems |
| `guidance.planYourFirstTrip` | Plan Your First Trip |
| `guidance.myTripsEmptyTitle` | No trips saved yet. |
| `guidance.myTripsEmptyHint` | Tell the AI your dates, travel style, and what matters — it'll build a day-by-day plan with local gems and food worked in. |
| `guidance.tripSavedTitle` | Your trip is saved. |
| `guidance.tripSavedHint` | Find it in My Trips whenever you need it — or open the Trip Checklist to get ready before you go. |
| `guidance.viewInMyTrips` | View in My Trips |
| `guidance.openTripChecklist` | Open Trip Checklist |

---

## Files Changed

### New Files

| File | Purpose |
|---|---|
| `lib/activation-state.ts` | `ActivationState` type + `computeActivationState()` |
| `components/guidance/my-balkans-guidance.tsx` | Empty-state guidance for My Balkans |
| `components/guidance/my-trips-guidance.tsx` | Empty-state guidance for My Trips |

### Modified Files

| File | Change |
|---|---|
| `lib/actions/itineraries.ts` | Return `{ id?, error? }` instead of `{ error? }` |
| `app/my-balkans/page.tsx` | Compute `savedContentCount`; render `MyBalkansGuidance` |
| `app/my-trips/page.tsx` | Compute `activationState`; render `MyTripsGuidance` |
| `components/planner/planner-flow.tsx` | Track `savedTripId`; render post-save orientation block; add `Link` import |
| `components/planner/trip-nav-back.tsx` | Add `TripCompanionForwardHandoff` and `ReflectionForwardHandoff` exports |
| `app/trips/[tripId]/companion/page.tsx` | Replace hardcoded forward handoff with `TripCompanionForwardHandoff` |
| `app/trips/[tripId]/reflection/page.tsx` | Replace hardcoded forward handoff with `ReflectionForwardHandoff`; remove unused `Link` import |
| `locales/en/common.json` | Add `guidance` block; add `navigation.goToLiveTrip` |
| `locales/de/common.json` | Add `guidance` block; add `navigation.goToLiveTrip` |
| `locales/it/common.json` | Add `guidance` block; add `navigation.goToLiveTrip` |
| `locales/hr/common.json` | Add `guidance` block; add `navigation.goToLiveTrip` |

---

## Architecture Decisions

### Why Not a Welcome Modal?

Modals interrupt user intent. A user who navigates to My Balkans via direct URL or bookmark does not want a forced welcome overlay on every visit. Empty-state guidance renders only when the workspace is genuinely empty and disappears naturally as content accumulates.

### Why Not Server-Side "New User" Detection?

Adding a `created_at` freshness check requires a DB roundtrip on every page load and introduces a definition problem ("how new is 'new'?"). Deriving state from the content itself is cheaper and behaviorally equivalent: a workspace with no content is de facto a new workspace.

### Why Not Persist Guidance Dismissal?

Dismissal persistence requires a new DB field or a cookie. The guidance is intrinsically self-dismissing — once the user saves a hidden gem or generates a trip, the workspace is no longer empty and the guidance no longer renders. No explicit dismiss action is needed.

### Why Per-Workspace Approximation Instead of Global State?

Loading itineraries in My Balkans and saved content in My Trips would require cross-workspace data fetching. The guidance is scoped to the workspace it appears in. The approximation produces correct behavior for the cases that matter: new users see guidance in both workspaces; returning users see it in neither.

---

## Relationship to Other Documents

| Document | Relationship |
|---|---|
| `docs/ux-debt-register.md` | UX-008 and UX-009 resolved by Phase 31 |
| `docs/authenticated-workspace-architecture.md` | Phase 31 adds activation layer on top of the Phase 30 workspace split |
| `lib/ai/live-trip.ts` | `computeLifecycle()` is called by `computeActivationState()` |
| `lib/ai/lifecycle-navigation.ts` | `getPrimaryLifecycleAction()` referenced for forward handoff context |
