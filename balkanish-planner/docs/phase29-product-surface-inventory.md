# Phase 29 — Product Surface Inventory

Balkanish Planner · Complete surface map as of Phase 28 completion.

---

## Surface Taxonomy

| Code | Type | Description |
|---|---|---|
| PUB | Public surface | No auth required |
| AUTH | Authenticated surface | Sign-in required; redirects to /sign-in |
| ADMIN | Internal/unlisted | No nav entry; URL-only access |
| API | API route | Not user-facing |

---

## Public Surfaces

### `/` — Homepage
- **Auth**: None
- **Type**: Editorial landing
- **Primary CTA**: "Plan My Trip with AI" → `/planner`
- **Secondary CTA**: "Browse Hidden Gems" → `/hidden-gems`
- **Sections**: Hero, Hidden Gems editorial, Seasonal Destination, Food Finds, Culture Notes, Postcard Spotlight, Secret Swap, Newsletter + AI Planner CTA
- **Empty state**: N/A (content always present; static editorial)
- **i18n**: Partial — hero copy in English; section content static
- **Notes**: No reference to My Balkans, Travel Finds, or resurfacing. First-time users land here.

### `/hidden-gems` — Destinations Index
- **Auth**: None
- **Type**: Content index
- **Primary CTA**: Save to favorites (save button on each card)
- **Empty state**: N/A (static content)
- **i18n**: Nav label translated; content in English

### `/hidden-gems/[slug]` — Destination Detail
- **Auth**: None
- **Type**: Editorial detail page
- **Primary CTA**: Save to favorites, Browse similar
- **i18n**: Content in English

### `/food-finds` — Food Finds Index
- **Auth**: None
- **Type**: Content index
- **Primary CTA**: Save to favorites

### `/food-finds/[slug]` — Food Find Detail
- **Auth**: None
- **Type**: Editorial detail page

### `/culture-notes` — Culture Notes Index
- **Auth**: None
- **Type**: Content index

### `/culture-notes/[slug]` — Culture Note Detail
- **Auth**: None
- **Type**: Editorial detail page

### `/secret-swap` — Secret Swap
- **Auth**: None
- **Type**: Interactive tool (swap explorer)
- **Primary CTA**: Find secret swap

### `/matchmaker` — Trip Matchmaker
- **Auth**: None
- **Type**: Interactive quiz
- **Primary CTA**: Match my trip style

### `/planner` — AI Trip Planner
- **Auth**: Soft (generates without auth; save requires auth)
- **Type**: Wizard (multi-step form + AI generation)
- **Primary CTA**: "Generate Itinerary"
- **Secondary CTA**: "Save Trip" (requires sign-in)
- **i18n**: Fully translated (en/de/it/hr)

### `/postcards` — Postcard Creator
- **Auth**: None for view; auth to save
- **Type**: Creative tool
- **Primary CTA**: Create a postcard

### `/guides` — Travel Guides
- **Auth**: None
- **Type**: Content index (premium guides)

### `/sign-in` — Sign In
- **Auth**: None
- **Type**: Auth form
- **Post-auth**: Redirects to previous page or `/my-balkans`

### `/sign-up` — Sign Up
- **Auth**: None
- **Type**: Auth form
- **Post-auth**: Redirects to `/my-balkans` (no onboarding flow)

### `/auth/callback` — OAuth Callback
- **Auth**: System
- **Type**: Auth redirect handler

---

## Authenticated Surfaces

### `/account` — Account Settings
- **Auth**: Required
- **Type**: Profile management
- **Sections**: Profile fields (name, preferred language), preferences
- **Empty state**: N/A
- **i18n**: Partial

### `/my-balkans` — Personal Dashboard
- **Auth**: Required
- **Type**: Aggregated saves dashboard
- **Sections**: Hidden Gems (saved), Food Finds (saved), Culture Notes (saved), Secret Swaps (saved), Postcards (saved), My Balkan Finds, AI Itineraries
- **CTA model**: Per-section Browse CTAs on empty; per-card save/manage CTAs when populated
- **Empty state**: Each section has its own empty state with link to browse
- **i18n**: Section labels hardcoded English in page file; cards i18n'd
- **Overlap**: Hidden Gems and Food Finds also appear in `/my-trips`

### `/my-balkans/finds` — Inspiration Captures (My Finds)
- **Auth**: Required
- **Type**: Collection manager + capture input
- **Layout**: 2-column (finds list + sticky capture sidebar)
- **Sections**: Waiting for you (NEEDS_CONFIRMATION/AMBIGUOUS), Saved finds (resolved), Needs a note (UNRESOLVED)
- **CTA model**: Capture input sidebar; find-level actions on cards
- **Empty state**: `FindsEmpty` component (separate empty state)
- **i18n**: Namespace `finds`; section labels hardcoded English

### `/my-trips` — Trip Management Dashboard
- **Auth**: Required
- **Type**: Trip-centric dashboard
- **Sections**: Recent Trip, All Trips, Hidden Gems (saved), Food Finds (saved), Delivery History
- **CTA model**: Per-trip card with 9 action buttons (P0 issue)
- **Empty state**: Per-section, with links to browse/plan
- **Overlap**: Hidden Gems and Food Finds also appear in `/my-balkans`

### `/trips/[tripId]/today` — Live Trip Today
- **Auth**: Required
- **Type**: Day-view live companion
- **Lifecycle gates**: Shown for PRE_TRIP, DEPARTURE_DAY, IN_TRIP
- **Sections**: Day agenda, activity states, cultural intelligence, Resurfaced Finds (Phase 28)
- **i18n**: Namespace `liveTrip` + `resurfacing`

### `/trips/[tripId]/companion` — Trip Companion
- **Auth**: Required
- **Type**: Pre-trip readiness checklist
- **Back nav**: Hardcoded "← Back to My Trips" (not i18n'd — P1 issue)
- **i18n**: Namespace `tripReadiness`

### `/trips/[tripId]/reflection` — Post-Trip Reflection
- **Auth**: Required
- **Type**: Memory capture + learning review
- **Lifecycle gates**: Accessible post-trip (COMPLETED)
- **Back nav**: Hardcoded "← My Trips" + "Today View" (not i18n'd — P1 issue)
- **i18n**: Namespace `reflection`

---

## Admin Surfaces (Unlisted)

These routes exist but have no nav link. Access is URL-only.

| Route | Purpose |
|---|---|
| `/admin/community` | Community content moderation |
| `/admin/cultural` | Cultural intelligence management |
| `/admin/discoveries` | AI-discovered destinations — promote/dismiss |
| `/admin/logistics` | Trip logistics admin |
| `/admin/partners` | Partner content management |

---

## API Routes

| Route | Purpose |
|---|---|
| `/api/planner` | AI itinerary generation endpoint |

---

## Navigation Structure

### Main Nav (always visible, 8 items)
1. Hidden Gems → `/hidden-gems`
2. Food Finds → `/food-finds`
3. Culture Notes → `/culture-notes`
4. Secret Swap → `/secret-swap`
5. Matchmaker → `/matchmaker`
6. Planner → `/planner`
7. Postcards → `/postcards`
8. Guides → `/guides`

### Auth Nav (authenticated only)
- My Balkans → `/my-balkans`
- My Trips → `/my-trips`
- Account → `/account`
- Sign Out

### Unauthenticated
- Sign In → `/sign-in`

### CTA (always visible)
- "Plan My Trip" → `/planner`

---

## Lifecycle-Gated Surfaces

| Lifecycle State | Surfaces Available |
|---|---|
| PLANNING | /my-trips, /my-balkans, /planner, /trips/[id]/companion |
| PRE_TRIP | + /trips/[id]/today |
| DEPARTURE_DAY | + /trips/[id]/today |
| IN_TRIP | + /trips/[id]/today |
| COMPLETED | + /trips/[id]/reflection |

---

## Surface Count Summary

| Type | Count |
|---|---|
| Public content | 10 |
| Public auth (sign in/up/callback) | 3 |
| Authenticated dashboards | 3 |
| Per-trip surfaces | 3 |
| Admin (unlisted) | 5 |
| API | 1 |
| **Total** | **25** |
