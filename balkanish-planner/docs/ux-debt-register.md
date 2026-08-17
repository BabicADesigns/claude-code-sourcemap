# UX Debt Register

Balkanish Planner — all unresolved UX issues, classified by severity and status.

Updated: Phase 31.

---

## Priority Levels

| Level | Definition |
|---|---|
| P0 | Causes confusion or prevents task completion. Fix immediately. |
| P1 | Reduces confidence or creates inconsistency. Fix in current phase. |
| P2 | Minor friction or missing polish. Fix when adjacent work opens the file. |
| P3 | Acknowledged; deferred to a future phase with a reason. |

---

## Open Issues

### P0 — CTA Overload: Trip Card Actions
**ID**: UX-001
**Surface**: `/my-trips`, `/my-balkans` (via `SavedItineraries` component)
**File**: `components/my-balkans/saved-itineraries.tsx`
**Description**: Each trip card renders up to 9 action buttons in a single `flex-wrap` row — View, Download PDF, Email PDF, Regenerate PDF, Trip Companion, Share, Today/Remember, Edit in Planner, Delete. This exceeds any reasonable cognitive budget for a mobile user and creates decision paralysis.
**Impact**: Users cannot identify the primary action. Mobile wraps into 3+ rows of buttons.
**Fix (Phase 29)**: Reorganize into primary row (lifecycle CTA, View, Trip Companion, Share) + secondary row (PDF tools, Delete). Remove "Edit in Planner" (see UX-002).
**Status**: ✅ Fixed in Phase 29

---

### P0 — Misleading Label: "Edit in Planner"
**ID**: UX-002
**Surface**: `/my-trips`, `/my-balkans` (via `SavedItineraries` component)
**File**: `components/my-balkans/saved-itineraries.tsx`
**Description**: The "Edit in Planner" button navigates to `/planner` — the multi-step wizard for generating a **new** trip. It does not load or edit the existing trip. The label "Edit in Planner" creates a false expectation that the user will be able to modify their saved itinerary.
**Impact**: User expects to edit their existing trip; instead gets a blank new trip form. Loss of trust.
**Fix (Phase 29)**: Remove the button. The planner is accessible from the main nav. No trip editing flow exists; false affordance is worse than no affordance.
**Status**: ✅ Fixed in Phase 29

---

### P1 — Brand Name Inconsistency in Header
**ID**: UX-003
**Surface**: All pages (via `SiteHeader`)
**File**: `components/layout/site-header.tsx`
**Description**: The site header renders "BabicADesigns" as the logo text adjacent to the logomark. The product is "Balkanish Planner" (or "Balkanish"); "BabicADesigns" is the studio/design agency name. A traveller discovering this product sees "BabicADesigns" — which reads as a design studio, not a travel planning product.
**Impact**: Breaks product persona. First-time visitors cannot tell what the product is for.
**Fix (Phase 29)**: Change logo text from "BabicADesigns" to "Balkanish Planner".
**Status**: ✅ Fixed in Phase 29

---

### P1 — Ambiguous Button Label: "Today"
**ID**: UX-004
**Surface**: `/my-trips`, `/my-balkans` (via `SavedItineraries` component)
**File**: `components/my-balkans/saved-itineraries.tsx`
**Description**: The lifecycle-gated primary action button for active trips is labeled "Today". This communicates a time reference, not a feature name. A user who hasn't used Live Trip before cannot tell from this label what "Today" does.
**Impact**: Users may ignore the primary in-trip CTA because the label is ambiguous.
**Fix (Phase 29)**: Rename to "Live Trip" — aligns with the feature's purpose and the page's role.
**Status**: ✅ Fixed in Phase 29

---

### P1 — Hardcoded English Back Links (Not i18n'd)
**ID**: UX-005
**Surface**: `/trips/[tripId]/companion`, `/trips/[tripId]/reflection`
**Files**: `app/trips/[tripId]/companion/page.tsx`, `app/trips/[tripId]/reflection/page.tsx`
**Description**: Back navigation links in Trip Companion ("← Back to My Trips") and Trip Reflection ("← My Trips", "Today View") are hardcoded English strings in server components. When a user has selected DE/IT/HR locale, these links remain in English while the rest of the UI is translated.
**Impact**: Locale inconsistency; breaks trust in multilingual users.
**Fix (Phase 29)**: Create `TripNavBack` client component with `useLocale`. Add `navigation.*` keys to all 4 locale files.
**Status**: ✅ Fixed in Phase 29

---

### P1 — "Remember this trip" vs "Trip Reflection" Terminology
**ID**: UX-006
**Surface**: Trip card (CTA button) vs. `/trips/[tripId]/reflection` (page eyebrow)
**File**: `components/my-balkans/saved-itineraries.tsx`
**Description**: The button on the trip card says "Remember this trip". The page it navigates to has the eyebrow "Trip Reflection". Same feature, two different names within 1 click.
**Impact**: Minor trust erosion; users wonder if they're in the right place.
**Fix (Phase 29)**: Rename button from "Remember this trip" to "Reflect on this trip" to align with the page label.
**Status**: ✅ Fixed in Phase 29

---

### P1 — My Balkans / My Trips Content Overlap
**ID**: UX-007
**Surface**: `/my-balkans` and `/my-trips`
**Files**: `app/my-balkans/page.tsx`, `app/my-trips/page.tsx`
**Description**: Hidden Gems (saved destinations) and Food Finds appeared in **both** `/my-balkans` and `/my-trips`. A user who saved a hidden gem saw it in two different nav sections with no explanation of why. Additionally, AI Itineraries were in My Balkans despite My Trips being the canonical trip workspace.
**Impact**: Navigation confusion. Users didn't know which page "owned" their saved content. Two top-level nav items competing for the same space.
**Fix (Phase 30)**: Defined canonical workspace split and enforced it structurally:
- **My Balkans** = saved content (Hidden Gems, Food Finds, Culture Notes, Secret Swaps, Postcards, My Finds). AI Itineraries section removed.
- **My Trips** = trip planning and lifecycle workspace (AI Itineraries, Delivery History). Hidden Gems and Food Finds sections removed.
- Each workspace carries a cross-reference footer link to the other.
**Status**: ✅ Fixed in Phase 30

---

### P2 — No Onboarding Flow After Sign-Up
**ID**: UX-008
**Surface**: `/sign-up` → post-auth redirect
**Description**: After a user creates an account, they land on `/my-balkans` — a blank dashboard with empty states in every section. There is no welcome message, no guidance on what to do first, and no suggestion to start with the AI planner.
**Impact**: First-time users face a wall of "nothing here yet" messages. Bounce risk is high.
**Fix (Phase 31)**: Added `MyBalkansGuidance` client component. When all 6 My Balkans sections are empty, renders a welcome card with eyebrow "Getting started", a descriptive title and hint, and two CTAs: Browse Hidden Gems + Plan Your First Trip. Uses i18n (`guidance.*` keys, all 4 locales). Disappears naturally when workspace accumulates any content. No new-user detection required — derives state from existing content count.
**Status**: ✅ Fixed in Phase 31

---

### P2 — No "Continue to Live Trip" Prompt After Saving Trip
**ID**: UX-009
**Surface**: `/planner` → post-save state
**Description**: After saving a trip, the user receives no CTA to visit Trip Companion or to return when departure approaches. The connection between planning and the Live Trip experience is invisible until the user happens to visit My Trips near their departure date.
**Impact**: Low Live Trip discovery rate; users don't know the feature exists.
**Fix (Phase 31)**: Extended `saveItinerary()` to return `{ id?, error? }` instead of `{ error? }` only. `planner-flow.tsx` now tracks `savedTripId` state. After save, renders a guidance block: "Your trip is saved." + hint copy + two CTAs: View in My Trips + Open Trip Checklist (deep-link to `/trips/{id}/companion`, rendered only when `savedTripId` is non-null). All strings are i18n'd across all 4 locales.
**Status**: ✅ Fixed in Phase 31

---

### P2 — Section Labels in Dashboard Pages Not i18n'd
**ID**: UX-010
**Surface**: `/my-balkans`, `/my-trips`, `/my-balkans/finds`
**Files**: `app/my-balkans/page.tsx`, `app/my-trips/page.tsx`, `app/my-balkans/finds/page.tsx`
**Description**: DashboardSection eyebrow labels, empty state messages, and section headings in page files are hardcoded English strings. When a user switches to DE/IT/HR, the page chrome and navigation update correctly but these strings remain in English.
**Impact**: Partial locale experience; trust erosion for multilingual users.
**Fix (future)**: Move page-level strings into the `common` or a new `dashboard` namespace. Server-side locale reading needed.
**Status**: ⏳ Deferred — requires server-side i18n pattern change across 3 pages

---

### P2 — "Needs a note" Section on My Finds (Poor Empty Signal)
**ID**: UX-011
**Surface**: `/my-balkans/finds` — "Needs a note" section
**File**: `app/my-balkans/finds/page.tsx`
**Description**: Unresolved captures (where the AI couldn't identify the place) are shown under a muted "Needs a note" heading with a small explanation. The affordance to actually add a note is unclear — users may not realize they can click the card to annotate it.
**Impact**: Unresolved finds accumulate silently; users lose context.
**Fix (future)**: Add an explicit "Add a note" button on unresolved `FindCard` components.
**Status**: ⏳ Deferred — requires FindCard component changes

---

### P2 — "Vegeta" in Footer Copy
**ID**: UX-012
**Surface**: Footer (all pages)
**Files**: `locales/*/common.json` — `footer.createdWith`
**Description**: "Created with Love and Vegeta." is a Balkan-regional cultural marker (Vegeta is a beloved regional seasoning). This is charming to Balkan-native users but potentially baffling to international travellers who don't share the reference.
**Impact**: Minor confusion for non-regional users; could be seen as an error.
**Fix (future)**: No fix required — intentional regional voice. Document as intended copy.
**Status**: ✅ Intentional — no action needed

---

### P3 — Admin Routes Undiscoverable
**ID**: UX-013
**Surface**: `/admin/*`
**Description**: Admin routes (`/admin/community`, `/admin/cultural`, `/admin/discoveries`, `/admin/logistics`, `/admin/partners`) have no nav link and no access control UI. They are accessed by knowing the URL. An unauthorized user who discovers the URL will either see an error or have access (depending on RLS implementation).
**Impact**: Founder-dependent workflow; no delegation possible without sharing URL directly.
**Fix (future)**: Add admin nav (hidden from non-admin users) + role-based access guard on admin routes.
**Status**: ⏳ Deferred — requires admin role system design

---

### P3 — "Edit in Planner" Was Misleading (Resolved)
**ID**: UX-014
**Surface**: See UX-002
**Status**: ✅ Fixed — removed in Phase 29 (see UX-001 resolution)

---

## Fixed in Phase 29

| ID | Issue | Resolution |
|---|---|---|
| UX-001 | CTA overload (9 buttons per trip card) | Reorganized to primary + secondary rows |
| UX-002 | "Edit in Planner" misleading label | Removed |
| UX-003 | "BabicADesigns" in header | Changed to "Balkanish Planner" |
| UX-004 | "Today" button ambiguous | Renamed to "Live Trip" |
| UX-005 | Hardcoded back links not i18n'd | `TripNavBack` client component + locale keys |
| UX-006 | "Remember this trip" vs "Trip Reflection" | Button renamed to "Reflect on this trip" |

## Fixed in Phase 30

| ID | Issue | Resolution |
|---|---|---|
| UX-007 | My Balkans / My Trips overlap | Canonical workspace split enforced; AI Itineraries moved to My Trips only; Hidden Gems + Food Finds moved to My Balkans only; cross-reference footer links added |

## Fixed in Phase 31

| ID | Issue | Resolution |
|---|---|---|
| UX-008 | No onboarding flow after sign-up | `MyBalkansGuidance` empty-state component; derives state from content count; no new-user detection needed; i18n'd across 4 locales |
| UX-009 | No post-save CTA to Trip Companion | `saveItinerary()` now returns `{ id?, error? }`; post-save orientation block with deep-link to companion page; i18n'd across 4 locales |

## Deferred (with reason)

| ID | Issue | Reason for deferral |
|---|---|---|
| UX-010 | Dashboard pages not i18n'd | Requires server-side i18n pattern |
| UX-011 | Unresolved finds UX | Requires FindCard component changes |
| UX-013 | Admin routes undiscoverable | Requires admin role system |
