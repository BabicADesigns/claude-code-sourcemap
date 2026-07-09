# Product Operating Model

Balkanish Planner — single source of truth for what this product is and how it works for people.

---

## Product Promise

A trusted Balkan local in your pocket — someone who knows which cliff to sit on, which bakery opens at 6am, and which "famous" spot to skip entirely. The system is smart. The experience feels calm, editorial, and personal.

---

## Primary User

A traveller planning or living a trip to the Balkans who:
- Has moderate travel experience (not a first-time backpacker, not a luxury agent).
- Researches across many tabs before a trip and loses track of what they found.
- Wants real local recommendations, not aggregator averages.
- May have mixed language preference (EN/DE/IT/HR).
- Uses mobile primarily when in-trip; desktop for planning.

---

## Canonical User Journey

### Stage 1: FIRST VISIT
**Where**: `/` (homepage)
**What they do**: Browse editorial content (hidden gems, food finds), discover the AI planner.
**Decision point**: Sign up to save → `/sign-up`.
**Current gap**: No onboarding flow post-signup; user lands on blank `/my-balkans`.

### Stage 2: FIRST TRIP (PLANNING)
**Where**: `/planner`
**What they do**: Fill wizard (dates, style, interests, budget) → receive AI itinerary → save it.
**Decision point**: Save trip (triggers auth if not signed in).
**Available surfaces**: Trip Companion (`/trips/[id]/companion`) for pre-trip checklist.
**Current gap**: No prompt to visit Trip Companion after saving.

### Stage 3: ACTIVE TRIP (PRE_TRIP → IN_TRIP)
**Where**: `/trips/[id]/today` (Live Trip)
**What they do**: Check today's agenda, mark activities, receive cultural intelligence, see resurfaced finds.
**Lifecycle gates**: "Live Trip" button appears on trip card for PRE_TRIP / DEPARTURE_DAY / IN_TRIP.
**Current gap**: Button labeled "Today" — not descriptive enough.

### Stage 4: POST TRIP (COMPLETED)
**Where**: `/trips/[id]/reflection`
**What they do**: Rate days, review highlights, generate travel memory, record learnings.
**Lifecycle gate**: "Reflect on this trip" button on trip card for COMPLETED lifecycle.
**Current gap**: Button labeled "Remember this trip" — inconsistent with page label "Trip Reflection".

### Stage 5: RETURNING TRAVELLER
**Where**: `/my-balkans`, `/my-balkans/finds`, `/planner`
**What they do**: Review saved finds, capture new inspiration, plan next trip.
**Intelligence loop**: Saved finds resurface when relevant to future trips (Phase 28).
**Current gap**: No prompt guiding returning users from My Balkans into a new planning cycle.

---

## Major Surfaces

### Discovery Layer (no auth required)
| Surface | Purpose | Primary CTA |
|---|---|---|
| Hidden Gems (`/hidden-gems`) | Browse curated destinations | Save |
| Food Finds (`/food-finds`) | Browse food recommendations | Save |
| Culture Notes (`/culture-notes`) | Browse culture tips | Save |
| Secret Swap (`/secret-swap`) | Find quieter alternatives to popular spots | Explore |
| Matchmaker (`/matchmaker`) | Match travel style to destinations | Match |
| Guides (`/guides`) | Premium travel guides | View |

### Planning Layer
| Surface | Purpose | Primary CTA |
|---|---|---|
| AI Planner (`/planner`) | Generate AI itinerary | Generate |
| Postcards (`/postcards`) | Create digital postcard | Create |

### Personal Layer (auth required)
| Surface | Purpose | Primary CTA |
|---|---|---|
| My Balkans (`/my-balkans`) | All saves in one view | Browse sections |
| My Finds (`/my-balkans/finds`) | Capture and manage inspiration | Add Find |
| My Trips (`/my-trips`) | Trip management hub | Live Trip / Reflect |

### Per-Trip Layer (auth + trip required)
| Surface | Purpose | Lifecycle |
|---|---|---|
| Trip Companion (`/trips/[id]/companion`) | Pre-trip readiness checklist | PLANNING → PRE_TRIP |
| Live Trip (`/trips/[id]/today`) | Day-view companion | PRE_TRIP → IN_TRIP |
| Trip Reflection (`/trips/[id]/reflection`) | Post-trip memory capture | COMPLETED |

---

## Intelligence Principles

### 1. The system is smart; the experience is calm.
Internal complexity (resurfacing scores, confidence derivation, grounding layers) must never leak into user-facing copy. Users see results, not mechanisms.

### 2. Conservative surfacing.
The resurfacing engine shows at most 2 candidates. The planner shows up to 3 AI-grounded destinations per day. Quantity is never the signal; quality is.

### 3. No continuous tracking.
No GPS polling. No movement history. Coordinate matching uses only the trip itinerary points the user already saved. Resurfacing history logs user-initiated actions only.

### 4. Privacy-first providers.
`TravelDistanceProvider` and `TravelNotificationProvider` interfaces exist but are not wired to any vendor. Push notifications and routing APIs are reserved for future phases without hardcoding vendors.

### 5. User-confirmed intelligence.
Inspiration captures are resolved via AI + user confirmation — ambiguous matches require explicit user action before resurfacing. The user is always in control of what the system knows about their intentions.

---

## Founder Dependencies

Items that currently depend on the founder's identity or active involvement:

| Area | Dependency | Risk |
|---|---|---|
| Header brand name | "BabicADesigns" displayed in site header | Breaks product persona; shows studio name instead of product |
| Footer copyright | "© 2026 BabicADesigns" | Acceptable — correct legal attribution |
| Footer easter egg | "Created with Love and Vegeta." | Cultural marker; low risk; regional users understand |
| Admin routes | No access control beyond EDITOR_EMAILS env var | Requires founder to manage access list manually |
| Content moderation | AI discoveries promoted/dismissed by founder via `/admin/discoveries` | Bottleneck; can't scale |
| PDF email delivery | Email provider configuration via env vars | Infrastructure dependency; not founder-blocking |

---

## Analytics Instrumentation (Phase 29 state)

Events instrumented as of Phase 28:

| Area | Events |
|---|---|
| AI Planner | Itinerary generated, saved |
| PDF Delivery | PDF downloaded, emailed, generated |
| Sharing | Share asset created, share link viewed |
| Travel Finds | Find resurfaced, find viewed, find added to day, remind later, dismissed |
| Inspiration Capture | Capture created, capture resolved |
| Auth | Sign in, sign up, sign out |

**Gap**: No funnel instrumentation. Can't track First Visit → First Trip conversion rate or Stage 1 → Stage 5 journey completion.

---

## Operational Decisions (Phase 28)

| Decision | Reason |
|---|---|
| No push notifications | `TravelNotificationProvider` boundary reserved; no vendor hardcoded |
| No real-time GPS | Privacy model forbids continuous location tracking |
| In-product resurfacing only | Sufficient for Phase 28; cron + push reserved for future phase |
| Max 2 resurfaced finds shown | Fatigue control is the trust signal |
| Max 9 CTA buttons per trip card | **Unresolved debt** — P0 fix in Phase 29 |
