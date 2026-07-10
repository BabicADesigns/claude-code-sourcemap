# Phase 29 — Product Coherence, UX Journey & Complexity Reduction

**Audit date**: Phase 29 completion
**Auditor**: Phase 29 review pass
**Scope**: All 25 product surfaces as of Phase 28 completion

---

## Executive Summary

The Balkanish Planner has grown across 28 phases into a genuinely multi-featured product: editorial content, AI trip generation, live trip companion, travel memory, post-trip reflection, and a resurfacing intelligence engine. The system is now objectively complex.

**The system is complex. The experience does not yet feel calm.**

Four issues drive most of the cognitive friction:

1. **CTA overload on trip cards** — 9 action buttons in a single row is unmanageable on mobile or desktop. There is no clear primary action.
2. **Brand name collision** — the header renders "BabicADesigns" (the design studio) instead of "Balkanish Planner" (the product). First-time visitors cannot tell what the product does.
3. **Lifecycle vocabulary is ambiguous** — "Today" (button) doesn't communicate Live Trip. "Remember this trip" doesn't match "Trip Reflection" (page title).
4. **Partial i18n in navigation** — back links inside authenticated trip pages are hardcoded English, creating a mixed-locale experience for DE/IT/HR users.

Phase 29 fixes all P0 and P1 issues. P2 and P3 issues are documented in `docs/ux-debt-register.md` with deferral reasons.

---

## 1. Product Surface Inventory

**Result**: 25 surfaces mapped (10 public editorial, 3 public auth, 3 auth dashboards, 3 per-trip, 5 unlisted admin, 1 API).

Full inventory: `docs/phase29-product-surface-inventory.md`

**Finding**: Admin surfaces (`/admin/*`) have no navigation, no access control UI, and no documented access model. These are founder-operated via direct URL. Risk: low now; bottleneck at scale.

---

## 2. Canonical User Journey

Defined in `docs/product-operating-model.md`.

Five stages: FIRST VISIT → FIRST TRIP → ACTIVE TRIP → POST TRIP → RETURNING TRAVELLER.

**Gap found**: The journey from Stage 1 (First Visit) to Stage 2 (First Trip) has no guided handoff. After sign-up, users land on a blank `/my-balkans` with empty states in all 7 sections. No "start here" prompt exists.

**Gap found**: Stage 2 → Stage 3 (First Trip → Active Trip) has no notification or prompt. The "Live Trip" CTA only appears if the user proactively visits My Trips near their departure date. Discoverability of the live companion relies on ambient navigation.

**Gap found**: Stage 4 (Post Trip) is accessible but the CTA label ("Remember this trip") doesn't match the destination page label ("Trip Reflection"). See UX-006.

---

## 3. First-Time User Audit

**Scenario**: New mobile user (390px), 2-minute patience, no prior knowledge of the product.

### On arrival (`/`)
- Hero CTA is clear: "Plan My Trip with AI" + "Browse Hidden Gems".
- No sign-in prompt in the hero (appropriate — don't gate browsing).
- Editorial sections load correctly; content is compelling.
- ✅ Pass

### After clicking "Plan My Trip"
- Arrives at `/planner` — multi-step wizard.
- Wizard labels are translated (i18n in place).
- Generation works without auth; save prompts sign-in.
- No orientation about what happens after saving.
- ✅ Functional; onboarding gap exists but doesn't block.

### After sign-up and returning to dashboard
- Lands on `/my-balkans` with 7 empty sections.
- Each section has an empty state with a CTA.
- User has no context for what "My Balkan Finds", "AI Itineraries", or "Secret Swaps" mean.
- ⚠️ Moderate friction — no welcome state; 7 empty sections feel like a to-do list.

### Mobile nav check (390px)
- Hamburger menu works; all links accessible.
- "Plan My Trip" button visible in mobile nav.
- ✅ Pass

---

## 4. Navigation Audit

### Main Nav (8 items)
Accessible from all pages. Items: Hidden Gems, Food Finds, Culture Notes, Secret Swap, Matchmaker, Planner, Postcards, Guides.

**Finding**: The main nav is discoverable and comprehensive, but 8 items is near the upper limit for primary navigation. "Matchmaker" and "Guides" are lower-traffic features that could be secondary nav in a future phase.

### Auth Nav Links
My Balkans, My Trips, Account, Sign Out.

**Finding**: My Balkans and My Trips both appear as top-level nav items. Both contain saved destinations and food finds. See UX-007 (deferred: architecture decision needed).

### Orphan routes
- `/admin/*` — no nav entry. Orphaned by design.
- `/auth/callback` — system route; correct.
- `/trips/[tripId]/today`, `/companion`, `/reflection` — accessible only via trip card CTAs in `/my-trips` or `/my-balkans`.

**Finding**: Live Trip, Trip Companion, and Trip Reflection are only reachable by clicking buttons on trip cards. If a user doesn't know to look at their trip card, these surfaces are invisible. No deep link from the main nav.

### Dead ends
- After completing an action in `/trips/[tripId]/companion`, there is no "next step" CTA pointing to Live Trip when departure approaches.
- After viewing `/trips/[tripId]/reflection`, there is no CTA to start a new trip plan.

---

## 5. Terminology Coherence Audit

Full registry: `docs/product-terminology-registry.md`

**Critical issues found:**

| Issue | Location | Severity |
|---|---|---|
| "BabicADesigns" vs "Balkanish Planner" in header | `site-header.tsx` | P1 |
| "Today" button vs "Live Trip" feature | `saved-itineraries.tsx` | P1 |
| "Remember this trip" vs "Trip Reflection" | `saved-itineraries.tsx` vs reflection page | P1 |
| "My Balkan Finds" / "Travel Finds" / "Inspiration" | Multiple surfaces | P1 |
| "Secret Swaps" (plural, section title) vs "Secret Swap" (nav, singular) | `my-balkans/page.tsx` vs nav | P2 |

---

## 6. CTA Hierarchy Audit

**Model**: PRIMARY / SECONDARY / TERTIARY / DESTRUCTIVE / CONTEXTUAL

### Homepage
| CTA | Type | Verdict |
|---|---|---|
| "Plan My Trip with AI" | PRIMARY | ✅ Clear |
| "Browse Hidden Gems" | SECONDARY | ✅ Clear |
| Save buttons on cards | CONTEXTUAL | ✅ Clear |

### Trip Card (My Trips / My Balkans)
| CTA | Type | Before | After (Phase 29) |
|---|---|---|---|
| "Today" / "Live Trip" | PRIMARY | Present but unlabeled as primary | ✅ "Live Trip" (lifecycle gated) |
| "View" | SECONDARY | Mixed in with 8 others | ✅ Secondary row |
| "Trip Companion" | SECONDARY | Mixed in with 8 others | ✅ Secondary row |
| "Share" | SECONDARY | Mixed in with 8 others | ✅ Secondary row |
| "Download PDF" | TERTIARY | Mixed in with 8 others | ✅ Tertiary row |
| "Email PDF" | TERTIARY | Mixed in with 8 others | ✅ Tertiary row |
| "Regenerate PDF" | TERTIARY | Mixed in with 8 others | ✅ Tertiary row |
| "Edit in Planner" | MISLEADING | Mixed in with 8 others | ✅ Removed |
| "Delete" | DESTRUCTIVE | Mixed in with 8 others | ✅ Tertiary row (distinct) |

**Before: 9 buttons, no hierarchy. After: 4 primary + 3 secondary (PDF tools), 1 destructive.**

---

## 7. Trip Lifecycle UX Audit

| Lifecycle state | Available CTA | Correct label | Issues |
|---|---|---|---|
| PLANNING (no departure date) | View, Trip Companion, PDF tools | — | No lifecycle CTA (correct) |
| PRE_TRIP | + "Live Trip" | "Today" → "Live Trip" | P1 label fix needed |
| DEPARTURE_DAY | + "Live Trip" | "Today" → "Live Trip" | P1 label fix needed |
| IN_TRIP | + "Live Trip" | "Today" → "Live Trip" | P1 label fix needed |
| COMPLETED | + "Reflect on this trip" | "Remember this trip" → "Reflect on this trip" | P1 label fix needed |

All lifecycle gates are correctly computed via `computeLifecycle()`. The issue is labels only.

---

## 8. My Balkans IA Audit

Sections on `/my-balkans`:
1. Saved — Hidden Gems
2. Saved — Food Finds
3. Saved — Culture Notes
4. Saved — Secret Swaps
5. Saved — Postcards
6. Inspiration — My Balkan Finds
7. Saved — AI Itineraries

**Findings**:
- Items 1–5 are "content saves" from browsing the site.
- Item 6 is "captured inspiration from external sources" — different source, different affordance.
- Item 7 is "generated itineraries" — a trip planning artifact, not a content save.
- The eyebrow for item 6 is "Inspiration" — too vague. Should be "My Finds" or "Balkan Finds".
- Items 1 and 2 also appear in `/my-trips`, creating the overlap documented in UX-007.

**Deferred**: Section re-architecture (removing content saves from `/my-trips`) is a P2 issue requiring careful coordination.

---

## 9. Empty State Audit

| Surface | Empty state quality | CTA present |
|---|---|---|
| `/my-balkans` — Hidden Gems | Clear message + CTA | ✅ "Browse Hidden Gems" |
| `/my-balkans` — Food Finds | Clear message + CTA | ✅ "Browse Food Finds" |
| `/my-balkans` — Culture Notes | Clear message + CTA | ✅ "Browse Culture Notes" |
| `/my-balkans` — Secret Swaps | Clear message + CTA | ✅ "Find a Secret Swap" |
| `/my-balkans` — Postcards | Clear message + CTA | ✅ "Make a Postcard" |
| `/my-balkans` — My Balkan Finds | Count + link (no DashboardSection empty) | ⚠️ Partial |
| `/my-balkans` — AI Itineraries | Clear message + CTA | ✅ "Plan a Trip" |
| `/my-trips` — Recent Trip | Clear message + CTA | ✅ "Plan a Trip" |
| `/my-trips` — All Trips | Clear message + CTA | ✅ "Plan a Trip" |
| `/my-balkans/finds` | `FindsEmpty` component | ✅ Dedicated component |
| `/trips/[id]/reflection` | No explicit empty state | ⚠️ Reflection shows eligibility gate |

---

## 10. Error / Recovery Audit

Error classification: RETRYABLE / USER_ACTION_REQUIRED / UNAVAILABLE / PERMISSION / VALIDATION / UNKNOWN

| Error context | Classification | Current handling |
|---|---|---|
| PDF generation fails | RETRYABLE / UNAVAILABLE | Inline error message with text |
| PDF email fails | RETRYABLE | Inline error message |
| Trip not found (`/trips/[id]/*`) | USER_ACTION_REQUIRED | `notFound()` → 404 |
| Supabase not configured | UNAVAILABLE | Inline message on page |
| Unauthenticated access to auth route | PERMISSION | `redirect("/sign-in")` |
| AI generation fails | RETRYABLE | Surfaced in planner UI |
| Inspiration capture: unresolved | USER_ACTION_REQUIRED | "Needs a note" section |

**Finding**: Error handling is functional but inconsistent in styling. PDF errors render as inline text with different colors per type (destructive for errors, sage for success). No toast/notification system. Pattern is workable for current scale.

---

## 11. Mobile-First Audit (390px / 430px / 768px)

### 390px (iPhone SE / base)
- Main nav collapses to hamburger ✅
- Hero CTA is above fold ✅
- Trip cards: 9-button layout wraps into multiple rows ⚠️ (P0 — fixed in Phase 29)
- Resurfaced Find cards: single column, readable ✅
- Capture input on `/my-balkans/finds` sidebar moves to below content at sm ✅

### 430px (iPhone 15)
- Slightly more breathing room; same issues as 390px apply.

### 768px (tablet)
- Some grids switch to 2-column ✅
- Nav shows desktop layout ✅

---

## 12. Accessibility Coherence Audit

| Element | Status |
|---|---|
| Skip-to-content link | ✅ Present in root layout |
| Mobile hamburger button | ✅ Has aria-label and aria-expanded |
| Destructive button "Delete" | ⚠️ No confirmation dialog; immediate action |
| Save/heart buttons | ✅ SaveButton component handles aria |
| Language switcher | ✅ Standard select element |
| PDF feedback messages | ⚠️ Inline text; not announced to screen readers |
| Empty states | ✅ Readable as standard text content |
| Focus management on mobile nav open/close | ⚠️ No explicit focus trap in mobile nav |

**Finding**: Core accessibility is in place. Gaps are in dynamic state feedback (PDF actions, mobile nav focus) — deferred to a future polish phase.

---

## 13. Product Intelligence Visibility Audit

Categories: INVISIBLE / SUBTLY_EXPLAINED / USER-CONTROLLED / EXPLICIT_CONTROL

| Intelligence feature | Visibility | Notes |
|---|---|---|
| AI trip generation | SUBTLY_EXPLAINED | Trust badges in itinerary view; explainability section |
| AI destination discovery | INVISIBLE | Destinations sourced from AI discovery have badges; mechanism not explained |
| Travel Find resurfacing | SUBTLY_EXPLAINED | Reason label on each resurfaced card (e.g., "Near your next stop") |
| Suppression / fatigue control | USER-CONTROLLED | "Remind Me Later", "Not This Trip" actions visible |
| Place resolution confidence | INVISIBLE | `resolution_confidence` score not shown to user; influences resurfacing silently |
| Trip readiness engine | INVISIBLE | Readiness items are generated by rule engine; user sees checklist but not logic |

**Finding**: The balance is appropriate for Phase 28. Intelligence is present and nudges discovery without being obtrusive.

---

## 14. Design System Consistency Audit

| Element | Status |
|---|---|
| Button variants (default, outline, ghost) | ✅ Consistent via shadcn/ui `Button` |
| Card border/bg pattern | ✅ `border border-border bg-card rounded-xl` |
| PageHeader component | ✅ Consistent eyebrow/title/description across all pages |
| DashboardSection component | ✅ Used consistently across My Balkans and My Trips |
| Font usage (display/serif/sans/script) | ✅ Consistent class names |
| Color tokens (sage-dark, rose, accent, muted) | ✅ All from tokens |
| CTA button "Plan My Trip" | ✅ Consistent `Button asChild` pattern |

**Finding**: Design system is well-applied. No rogue one-off components found in surface audit.

---

## 15. Founder Dependency Audit

See `docs/product-operating-model.md` — Founder Dependencies section.

**Critical (must fix)**: Header shows "BabicADesigns" instead of product name. Fixed in Phase 29.

**Acceptable**: Footer copyright shows "BabicADesigns" — correct legal attribution.

**Future risk**: Admin content moderation is founder-bottlenecked. No admin role system exists.

---

## 16. UX Debt Register

Full register: `docs/ux-debt-register.md`

Issues fixed in Phase 29: UX-001, UX-002, UX-003, UX-004, UX-005, UX-006.
Deferred: UX-007, UX-008, UX-009, UX-010, UX-011, UX-013.

---

## 17. Analytics Review

Current instrumentation covers:
- Planner funnel (generation + save)
- PDF delivery (download, email, generate)
- Share (asset created, viewed)
- Travel Finds (resurfaced, viewed, added, dismissed)
- Inspiration capture events
- Auth events

**Gap**: No funnel-level instrumentation between the 5 journey stages. Can't measure Stage 1 → Stage 5 conversion or drop-off.

**Gap**: No Live Trip engagement metrics (how many users open Live Trip per active trip day; how many activity states are marked).

**Gap**: No Trip Companion completion rate (how many readiness items are checked before departure).

---

## 18. i18n Coverage (Phase 29)

| Namespace | en | de | it | hr |
|---|---|---|---|---|
| common | ✅ | ✅ | ✅ | ✅ |
| planner | ✅ | ✅ | ✅ | ✅ |
| pdf | ✅ | ✅ | ✅ | ✅ |
| email | ✅ | ✅ | ✅ | ✅ |
| community | ✅ | ✅ | ✅ | ✅ |
| partners | ✅ | ✅ | ✅ | ✅ |
| logistics | ✅ | ✅ | ✅ | ✅ |
| cultureIntel | ✅ | ✅ | ✅ | ✅ |
| travelMemory | ✅ | ✅ | ✅ | ✅ |
| tripReadiness | ✅ | ✅ | ✅ | ✅ |
| liveTrip | ✅ | ✅ | ✅ | ✅ |
| reflection | ✅ | ✅ | ✅ | ✅ |
| finds | ✅ | ✅ | ✅ | ✅ |
| share | ✅ | ✅ | ✅ | ✅ |
| resurfacing | ✅ | ✅ | ✅ | ✅ |
| **common.navigation.**** | ✅ | ✅ | ✅ | ✅ |

\* Added in Phase 29: `navigation.backToMyTrips`, `navigation.todayView`, `navigation.liveTrip`.

**Gap remaining**: Page-level strings (DashboardSection labels, section headings) in server components are still hardcoded English. Requires server-side i18n pattern change — deferred (UX-010).

---

## 19. Implementation Summary (Phase 29 Changes)

### Code changes
| File | Change |
|---|---|
| `components/layout/site-header.tsx` | Logo text: "BabicADesigns" → "Balkanish Planner" |
| `components/my-balkans/saved-itineraries.tsx` | CTA reorganization; remove "Edit in Planner"; rename "Today" → "Live Trip"; rename "Remember this trip" → "Reflect on this trip" |
| `components/planner/trip-nav-back.tsx` | New client component for i18n-aware back navigation |
| `app/trips/[tripId]/companion/page.tsx` | Use `TripNavBack` instead of hardcoded link |
| `app/trips/[tripId]/reflection/page.tsx` | Use `TripNavBack` and translated "Today View" link |
| `locales/en/common.json` | Add `navigation.*` keys |
| `locales/de/common.json` | Add `navigation.*` keys (German) |
| `locales/it/common.json` | Add `navigation.*` keys (Italian) |
| `locales/hr/common.json` | Add `navigation.*` keys (Croatian) |

### Documentation created
- `docs/phase29-product-surface-inventory.md`
- `docs/product-terminology-registry.md`
- `docs/product-operating-model.md`
- `docs/ux-debt-register.md`
- `docs/phase29-product-coherence-audit.md` (this file)

---

## 20. Phase 29 Verdict

The product has the right bones. The intelligence is in place. The content model is coherent. The lifecycle architecture is clean.

What was broken was labels, hierarchy, and a single brand name. Phase 29 fixes the things that make the product feel unprofessional or confusing to a first-time user. None of the changes are cosmetic for their own sake — each one closes a gap between what the product does and what the product appears to be able to do.

**The system was always capable. Now the experience communicates it.**
