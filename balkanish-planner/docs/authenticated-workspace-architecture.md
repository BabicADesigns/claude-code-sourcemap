# Authenticated Workspace Architecture

Balkanish Planner — canonical ownership model for all authenticated product surfaces.

Phase 30–31. This document is the structural reference for the authenticated layer. It is designed to be legible without founder explanation — for a new developer, a product team, a technical acquirer, or a white-label/regional expansion team.

---

## Workspace Ownership Model

Two top-level authenticated workspaces. Each has one canonical promise and one canonical set of artifact types.

### My Balkans (`/my-balkans`)

**One-sentence promise**: Where I keep my saved Balkan places and travel inspiration.

**Canonical content**:
| Section | Eyebrow | Artifact type | DB table | Canonical home? |
|---|---|---|---|---|
| Hidden Gems | Saved | `Destination` favorites | `favorites` (entity_type = destination) | ✅ Yes |
| Food Finds | Saved | `FoodFind` favorites | `favorites` (entity_type = food_find) | ✅ Yes |
| Culture Notes | Saved | `CultureNote` favorites | `favorites` (entity_type = culture_note) | ✅ Yes |
| Secret Swaps | Saved | `SecretSwap` favorites | `favorites` (entity_type = secret_swap) | ✅ Yes |
| Postcards | Saved | `SavedPostcard` | `saved_postcards` | ✅ Yes |
| My Finds | My Finds | `InspirationCapture` | `inspiration_captures` | ✅ Yes |

**Does not contain**: AI Itineraries. Cross-reference to My Trips via footer link.

**User intent**: Collecting and browsing curated content. No trip-management actions. No lifecycle-gated CTAs.

---

### My Trips (`/my-trips`)

**One-sentence promise**: Where I plan, manage, and reflect on my actual Balkan trips.

**Canonical content**:
| Section | Eyebrow | Artifact type | DB table | Canonical home? |
|---|---|---|---|---|
| Recent Trip | Pick up where you left off | `SavedItinerary` (most recent) | `saved_itineraries` | ✅ Yes |
| All Trips | Saved | `SavedItinerary[]` | `saved_itineraries` | ✅ Yes |
| Delivery History | History | `DeliveryRecord` | `delivery_history` | ✅ Yes |

**Does not contain**: Hidden Gems, Food Finds, Culture Notes, Secret Swaps, Postcards, My Finds. Cross-reference to My Balkans via footer link.

**User intent**: Managing active trip lifecycle — planning, tracking, PDF delivery, reflection. Lifecycle-gated CTAs are present and driven by `computeLifecycle()`.

---

## Route Responsibility Matrix

| Route | Server/Client | Auth required | Primary workspace | Lifecycle-aware |
|---|---|---|---|---|
| `/my-balkans` | Server | ✅ | My Balkans | ❌ |
| `/my-balkans/finds` | Server | ✅ | My Balkans | ❌ |
| `/my-trips` | Server | ✅ | My Trips | ❌ (delegated to card) |
| `/planner` | Client | Optional (save triggers auth) | Planning layer | ❌ |
| `/trips/[id]/companion` | Server | ✅ | Per-trip | ✅ (forward handoff) |
| `/trips/[id]/today` | Server | ✅ | Per-trip | ✅ (lifecycle-gated) |
| `/trips/[id]/reflection` | Server | ✅ | Per-trip | ✅ (eligibility gate) |
| `/account` | Server | ✅ | Account | ❌ |
| `/sign-in` | Client | ❌ | Auth layer | ❌ |
| `/sign-up` | Client | ❌ | Auth layer | ❌ |

---

## Artifact Ownership Matrix

One canonical management surface per artifact type. Secondary surfaces may reference but not manage.

| Artifact | Canonical management surface | Secondary references |
|---|---|---|
| Saved Destination (Hidden Gem) | `/my-balkans` | — |
| Saved Food Find | `/my-balkans` | — |
| Saved Culture Note | `/my-balkans` | — |
| Saved Secret Swap | `/my-balkans` | — |
| Saved Postcard | `/my-balkans` | — |
| Inspiration Capture (My Find) | `/my-balkans/finds` | Count shown in `/my-balkans` |
| AI Itinerary | `/my-trips` | `/planner` (generate only), `/trips/*` (per-trip tools) |
| PDF Document | `/my-trips` (via delivery history) | Per-trip card (download/email/regenerate actions) |
| Trip Readiness Item | `/trips/[id]/companion` | — |
| Live Trip State | `/trips/[id]/today` | — |
| Trip Reflection | `/trips/[id]/reflection` | — |

---

## Lifecycle Navigation Policy

Source of truth: `lib/ai/lifecycle-navigation.ts`

### TripLifecycleState

```
"PLANNING" | "PRE_TRIP" | "DEPARTURE_DAY" | "IN_TRIP" | "COMPLETED"
```

Computed by `computeLifecycle(departureDate, durationDays, todayDateString)` in `lib/ai/live-trip.ts`.

### Primary Action per Lifecycle State

| State | Primary CTA label | i18n key | href | Variant |
|---|---|---|---|---|
| PLANNING | (none) | — | — | — |
| PRE_TRIP | Live Trip | `navigation.liveTrip` | `/trips/[id]/today` | default |
| DEPARTURE_DAY | Live Trip | `navigation.liveTrip` | `/trips/[id]/today` | default |
| IN_TRIP | Live Trip | `navigation.liveTrip` | `/trips/[id]/today` | default |
| COMPLETED | Reflect on this trip | `navigation.reflectOnTrip` | `/trips/[id]/reflection` | outline |

`getPrimaryLifecycleAction(lifecycle, tripId)` returns `LifecycleNavEntry | null`. Callers resolve `labelKey` via `t("common", action.labelKey)`.

### Contextual Forward Handoffs

| Surface | Condition | Forward link |
|---|---|---|
| Trip Companion (`/trips/[id]/companion`) | PRE_TRIP / DEPARTURE_DAY / IN_TRIP | "Go to Live Trip →" |
| Trip Companion (`/trips/[id]/companion`) | COMPLETED | "Reflect on this trip →" |
| Trip Reflection (`/trips/[id]/reflection`) | COMPLETED | "Plan your next trip →" |

Forward handoffs are additive: they appear below the primary content and are not primary actions. They guide journey progression without replacing the page's own purpose.

---

## Navigation Component Model

| Component | File | i18n | Used by |
|---|---|---|---|
| `TripNavBack` | `components/planner/trip-nav-back.tsx` | ✅ | `/trips/[id]/reflection` |
| `TripNavBackSimple` | `components/planner/trip-nav-back.tsx` | ✅ | `/trips/[id]/companion` |
| `TripNavLiveTrip` | `components/planner/trip-nav-back.tsx` | ✅ | `/trips/[id]/today` |
| `TripCompanionForwardHandoff` | `components/planner/trip-nav-back.tsx` | ✅ | `/trips/[id]/companion` |
| `ReflectionForwardHandoff` | `components/planner/trip-nav-back.tsx` | ✅ | `/trips/[id]/reflection` |

All five are client components wrapping `useLocale()`. Server components that need navigation render these client components directly.

**TripNavBack**: Shows `← My Trips` + `Today View` link. Used by reflection page.
**TripNavBackSimple**: Shows `← My Trips` only. Used by companion page.
**TripNavLiveTrip**: Shows `← My Trips` + `Trip Checklist` link. Used by live trip today page.
**TripCompanionForwardHandoff**: Forward handoff below companion content. Label derived from `href` — `/today` → `navigation.goToLiveTrip`; `/reflection` → `navigation.reflectOnTrip`.
**ReflectionForwardHandoff**: Forward handoff below reflection content for COMPLETED lifecycle. Links to `/planner` via `navigation.planNextTrip`.

---

## Lifecycle i18n Key Registry

All lifecycle-related navigation keys live in the `navigation` namespace of `common.json`:

| Key | EN value |
|---|---|
| `navigation.backToMyTrips` | ← My Trips |
| `navigation.todayView` | Today View |
| `navigation.liveTrip` | Live Trip |
| `navigation.reflectOnTrip` | Reflect on this trip |
| `navigation.goToLiveTrip` | Go to Live Trip → |
| `navigation.companion` | Trip Checklist |
| `navigation.planNextTrip` | Plan your next trip |

All 4 locales (en/de/it/hr) carry these keys.

---

## Cross-Reference Pattern

Each workspace references the other via a styled footer link at the bottom of its main page:

**My Balkans** (`/my-balkans`) footer:
> Planning a trip? Your AI itineraries and trip tools are in My Trips →

**My Trips** (`/my-trips`) footer:
> Looking for saved places and dishes? Your saved Balkans are in My Balkans →

This pattern uses `border-t border-border pt-6` + `font-serif text-sm text-foreground/60` + `Link` with `font-medium text-accent hover:underline`. No DashboardSection wrapper. The cross-reference is a navigation pointer, not a content section.

---

## Terminology Decisions

### "My Finds" (canonical user-facing term)

The user-facing label for inspiration captures is **"My Finds"** — both as the dashboard section label and as the `/my-balkans/finds` page title.

Internal code identifiers are **not changed** (no migration required):
- DB table: `inspiration_captures`
- TS type: `InspirationCapture`
- Data functions: `getInspirationCaptures()`, `getInspirationCaptures(userId)`

"Travel Finds" is used only in the resurfacing engine (`lib/resurfacing/`) as an internal namespace. It is never user-facing.

### "Trip Checklist" vs "Trip Companion"

- **Trip Companion**: The page eyebrow and product name for `/trips/[id]/companion`.
- **Trip Checklist**: The navigation link label (i18n key `navigation.companion`) used in `TripNavLiveTrip`.

This distinction is intentional: the nav link is action-oriented ("what you do there"), the eyebrow names the feature.

---

## Journey Boundary Identifiers

The Balkanish Planner user journey has five distinct boundaries. A user crosses each boundary at most once per trip.

| # | Boundary | From state | To state | Where |
|---|---|---|---|---|
| 1 | Sign up | Anonymous | Authenticated | `/sign-up` |
| 2 | First trip saved | No itineraries | Has itinerary | `/planner` → save action |
| 3 | Trip entered | PLANNING | PRE_TRIP | Automatic (date-driven, computed client-side) |
| 4 | Trip started | PRE_TRIP → DEPARTURE_DAY | IN_TRIP | Automatic (date-driven) |
| 5 | Trip completed | IN_TRIP | COMPLETED | Automatic (duration elapsed) |

No funnel analytics exist yet for these boundaries. Phase 31 (onboarding) and Phase 32 (journey analytics) are the planned follow-ons.

---

## Rejected Architectural Decisions

### Rejected: Keep saved content in both workspaces

**Rejected because**: Duplicated artifact ownership creates UX confusion (UX-007), increases data-fetch cost, and requires two maintenance surfaces for the same UI component. One canonical home per artifact type.

### Rejected: Move AI Itineraries to My Balkans

**Rejected because**: Itineraries are trip management artifacts. My Balkans is a content collection workspace. The user mental model for My Trips is "my plans"; the mental model for My Balkans is "my Balkan world". Mixing them weakened both.

### Rejected: Merge My Balkans + My Trips into a single workspace

**Rejected because**: The two workspaces have distinct user intents and different feature densities. My Trips carries lifecycle-aware CTAs (Live Trip, Reflect, PDF delivery). My Balkans carries static save collections. Merging them creates a page with too many competing purposes and makes it harder to add trip-lifecycle features without cluttering the content collection view.

### Rejected: Add "My Finds" to My Trips

**Rejected because**: Finds are inspiration captures tied to the user's Balkans world, not to a specific trip. They resurface during trips but they are not per-trip artifacts. Their canonical home is My Balkans (the collection workspace).

---

## Migration Implications

Phase 30 is a pure frontend restructure. **No database changes** were made.

| Component | Before Phase 30 | After Phase 30 |
|---|---|---|
| `app/my-balkans/page.tsx` | 7 sections (includes AI Itineraries) | 6 sections (no AI Itineraries) |
| `app/my-trips/page.tsx` | 5 sections (includes Hidden Gems + Food Finds) | 3 sections + cross-reference |
| `components/planner/trip-nav-back.tsx` | 2 exports | 3 exports (`TripNavLiveTrip` added) |
| `app/trips/[id]/today/page.tsx` | Hardcoded English nav | `TripNavLiveTrip` i18n component |
| `app/trips/[id]/companion/page.tsx` | No forward handoff | Lifecycle-aware forward handoff |
| `app/trips/[id]/reflection/page.tsx` | No forward handoff | "Plan your next trip →" for COMPLETED |
| `components/my-balkans/saved-itineraries.tsx` | Inline lifecycle if/else | `getPrimaryLifecycleAction()` centralized |
| `lib/ai/lifecycle-navigation.ts` | Did not exist | Created — canonical lifecycle nav policy |

---

## Extension Points

### Adding a new authenticated workspace

1. Create `app/<workspace>/page.tsx` (server component, auth guard, `isSupabaseConfigured` guard).
2. Add cross-reference to/from the adjacent workspace.
3. Add to the Route Responsibility Matrix in this document.
4. Add i18n key to `actions.*` namespace in all 4 locales.
5. Add to `lib/nav.ts` auth nav array (when one is created — currently auth nav is inline in `SiteHeader`).

### Adding a new artifact type to My Balkans

1. Add DB table + RLS (follow migration conventions in `supabase/migrations/`).
2. Add TS type to `lib/types.ts`.
3. Add data function to `lib/data/`.
4. Add to `app/my-balkans/page.tsx` Promise.all fetch + DashboardSection.
5. Update the Artifact Ownership Matrix in this document.

### Adding a new lifecycle stage

1. Update `TripLifecycleState` union in `lib/types.ts`.
2. Update `computeLifecycle()` in `lib/ai/live-trip.ts`.
3. Update `getPrimaryLifecycleAction()` in `lib/ai/lifecycle-navigation.ts`.
4. Update `LIFECYCLE_NAVIGATION_POLICY` documentation record.
5. Add i18n key if a new label is needed.

---

## Relationship to Other Documents

| Document | Relationship |
|---|---|
| `docs/product-operating-model.md` | High-level product model; this document is the technical implementation of the authenticated layer within it |
| `docs/product-terminology-registry.md` | Canonical labels for all user-facing concepts; this document references those labels |
| `docs/ux-debt-register.md` | UX-007 resolved by Phase 30; UX-008 and UX-009 resolved by Phase 31 |
| `docs/phase29-product-surface-inventory.md` | Phase 29 surface inventory; Phase 30 changes are noted as updates to that inventory |
| `docs/phase31-first-journey-activation.md` | Phase 31 activation layer; describes `ActivationState`, guidance components, and post-save orientation |
| `docs/accounts-trips-architecture.md` | Phase 10 document; describes initial auth/trips model; superseded by this document for workspace architecture |
| `lib/ai/lifecycle-navigation.ts` | Single source of truth for lifecycle navigation policy; described in the Lifecycle Navigation Policy section above |
| `lib/activation-state.ts` | Phase 31 activation state model; `computeActivationState()` derives onboarding state from existing product data |
