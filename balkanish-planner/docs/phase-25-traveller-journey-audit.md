# Phase 25 — Traveller Journey Audit

Audit date: 2026-07-07

This document traces the complete authenticated traveller journey from first visit to post-trip reflection, verifying that each step is reachable, connected to real persistence, and free of dead routes or disconnected UI.

---

## Journey Map

```
[Homepage] → [Planner wizard] → [Itinerary result] → [Save]
                                                          ↓
[My Trips] → [Trip Companion] → [Live Trip Today] → [Post-Trip Reflection]
               (/companion)         (/today)            (/reflection)
```

---

## Step 1: Homepage → Planner

**Route:** `/` → `/planner`  
**Nav link:** Site header "Plan" link  
**Status:** CONNECTED

The planner page (`/planner`) renders `<PlannerFlow>` which embeds the full multi-step wizard. No auth required to generate.

---

## Step 2: Planner → Itinerary Result

**Route:** `POST /api/planner` (client-side fetch from planner-flow)  
**Status:** CONNECTED (CRITICAL fix applied — now requires auth when Supabase is configured)

The wizard submits to `/api/planner`. On success, the planner-flow component receives `itineraries` (conservative/balanced/explorer) and renders `<ItineraryView>`.

**Degradation path:** If `OPENAI_API_KEY` is unset, `isOpenAIConfigured()` returns false. The API still returns a valid itinerary with a deterministic skeleton (no prose). Silent degradation — see P25-M02.

---

## Step 3: Itinerary Result → Save

**Server action:** `saveItinerary` in `lib/actions/itineraries.ts`  
**Status:** CONNECTED

The save button in `<ItineraryView>` calls `saveItinerary(itinerary, input)`. Requires auth. The action:
1. Inserts into `generated_itineraries` with `user_id: user.id`
2. Fires memory signals best-effort (void async, caught internally)
3. Increments `save_count` on discovered destination candidates
4. `revalidatePath("/my-balkans")` and `revalidatePath("/my-trips")`

**Missing link:** After saving, the user stays on `/planner` with no navigation prompt to `/my-trips`. The saved trip is accessible by navigating manually. This is a UX gap but not a broken route.

---

## Step 4: My Trips Dashboard

**Route:** `/my-trips`  
**Auth:** Requires sign-in (redirects to `/sign-in`)  
**Status:** CONNECTED

`getSavedItineraries(user.id)` fetches all trips owned by the user, ordered by `created_at DESC`. Each trip card links to companion, today, and reflection via hardcoded `/trips/${id}/companion`, `/trips/${id}/today`, `/trips/${id}/reflection` links.

**Verification:** `getSavedItineraryById(user.id, tripId)` enforces ownership at the data layer. If a user navigates to another user's tripId, `getSavedItineraryById` returns null and the page shows `notFound()`.

---

## Step 5: Trip Companion (/companion)

**Route:** `/trips/[tripId]/companion`  
**Auth:** Requires sign-in + ownership  
**Status:** CONNECTED

The companion page:
1. Loads the trip via `getSavedItineraryById(user.id, tripId)` — ownership enforced
2. Builds checklist templates via `buildTripReadiness` (deterministic)
3. Upserts templates so new rules are added without overwriting user state
4. Renders `<TripCompanion>` with departure date control and checklist

Server actions (`markReadinessItemDone`, `saveReadinessItemNotes`, `saveTripDepartureDate`) all re-fetch `getCurrentUser()` and own the ownership check via `user.id` in DB queries.

**Setting departure date** is the critical gate for lifecycle progression. Without it, the trip stays in `PLANNING` state and Today/Reflection views show "not active yet" messaging.

---

## Step 6: Live Trip Today (/today)

**Route:** `/trips/[tripId]/today`  
**Auth:** Requires sign-in + ownership  
**Status:** CONNECTED

The today view:
1. Computes today's day number from `departure_date` + `duration_days`
2. Loads live item states (`getLiveTripItemStates`)
3. Loads cultural insights and local phrases for today's destination(s)
4. Renders `<LiveTripToday>` with slot controls

**Lifecycle gate:** If lifecycle is PLANNING or PRE_TRIP, the today view renders a "not your travel day yet" message via `computeLifecycle`. This is a correct non-error state.

**Slot actions** (`markDaySlotDone`, `markDaySlotSkipped`, etc.) revalidate `/trips/${tripId}/today`.

---

## Step 7: Post-Trip Reflection (/reflection)

**Route:** `/trips/[tripId]/reflection`  
**Auth:** Requires sign-in + ownership  
**Status:** CONNECTED

The reflection page:
1. Checks `isTripReflectionEligible(lifecycle, departureDateString, days)`
2. If not eligible: renders ineligibility message (component-level guard, after all hooks)
3. If eligible: renders `<PostTripReflection>` with multi-step flow

Reflection multi-step flow:
1. **Overall feeling** — saved via `saveReflectionOverallFeeling`
2. **Pace + planning comfort** — saved via `saveReflectionPaceAndPlanning`
3. **Return intent** — saved via `saveReflectionReturnIntent`
4. **Private note** — saved via `saveReflectionPrivateNote` (never exposed publicly)
5. **Item ratings** — per slot, saved via `saveReflectionItem`
6. **Learning candidates** — derived deterministically from above, confirmed/rejected via `confirmLearningCandidate` / `rejectLearningCandidate`
7. **Complete** — `completeReflection` sets status to COMPLETED

Confirmed learning candidates are promoted to `travel_memory_signals` via `recordTravelMemorySignal`.

---

## Step 8: Memory Loop Closes

**Route:** `/account` (TravelMemoryPanel)  
**Status:** CONNECTED

Memory signals from the reflection appear in the `<TravelMemoryPanel>` on the account page. Users can confirm/reject individual signals. Rejected signals get a 90-day cooldown. Reset clears all signals.

Active signals are injected into future planner generation via `getActiveMemorySignals(user.id)` in the API route, building the `memoryContext.signals` array which feeds into `buildMemoryBriefBlock` for the AI brief.

**The loop is closed:** reflection → memory promotion → planner personalization.

---

## Dead Routes / Disconnected Features

| Feature | Status | Notes |
|---------|--------|-------|
| `/share/[id]` | NOT EXIST | No public sharing route implemented |
| `/guides/[slug]` | NOT EXIST | Guide detail page not implemented; `GuideCard` links nowhere yet |
| Premium guide purchase | NOT EXIST | No payment integration |
| Matchmaker result persistence | DISCONNECTED | Quiz results not saved (P25-M03) |
| PDF cover images | MOCK_ONLY | PDF image architecture exists but uses picsum.photos placeholders |

---

## Navigation Gaps (UX, not blocking)

1. After saving an itinerary, no redirect or toast with "View in My Trips" link
2. The `/trips/[tripId]/today` and `/reflection` pages link back to `/my-trips` but the `/companion` page does not (only links to the itinerary)
3. No breadcrumb or step indicator connects companion → today → reflection for a traveller learning the flow
