# Phase 25 — Capability Inventory

Audit date: 2026-07-07  
Branch: `claude/balkanish-planner-platform-9a0ks4`

Each capability is classified by:
- **Data source:** DATABASE (Supabase live), MOCK_FALLBACK (mock when Supabase absent), DEMO_FIXTURE (mock-only, never DB), CLIENT_ONLY (no persistence)
- **Auth required:** YES / NO / EDITOR
- **Status:** WORKING / PARTIAL / STUB / DISCONNECTED

---

## Public Editorial Content

| Capability | Route | Data Source | Auth | Status | Notes |
|-----------|-------|------------|------|--------|-------|
| Destination browse | `/hidden-gems` | DATABASE + MOCK_FALLBACK | No | WORKING | Falls back to 35 mock destinations |
| Destination detail | `/hidden-gems/[slug]` | DATABASE + MOCK_FALLBACK | No | WORKING | Engagement signal recorded on view |
| Food Finds browse | `/food-finds` | DATABASE + MOCK_FALLBACK | No | WORKING | |
| Food Find detail | `/food-finds/[slug]` | DATABASE + MOCK_FALLBACK | No | WORKING | |
| Culture Notes browse | `/culture-notes` | DATABASE + MOCK_FALLBACK | No | WORKING | |
| Culture Note detail | `/culture-notes/[slug]` | DATABASE + MOCK_FALLBACK | No | WORKING | |
| Secret Swap finder | `/secret-swap` | DATABASE + MOCK_FALLBACK | No | WORKING | Saved state requires auth |
| Premium Guides | `/guides` | DATABASE + MOCK_FALLBACK | No | WORKING | No detail/purchase route yet |
| Matchmaker quiz | `/matchmaker` | CLIENT_ONLY | No | PARTIAL | Result not persisted (P25-M03) |
| Postcards browse | `/postcards` | DATABASE + MOCK_FALLBACK | No | WORKING | Shows public postcards |
| Homepage | `/` | MOCK_FALLBACK | No | WORKING | |

---

## AI Planner

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| Generate itinerary | `POST /api/planner` | OpenAI + grounding | No* | WORKING* | *Auth gate added by P25-C01 fix |
| Save itinerary | `saveItinerary` action | DATABASE | YES | WORKING | |
| Delete itinerary | `deleteItinerary` action | DATABASE | YES | WORKING | |
| Rename itinerary | `renameItinerary` action | DATABASE | YES | WORKING | |
| View saved trips | `/my-trips` | DATABASE | YES | WORKING | |
| My Balkans dashboard | `/my-balkans` | DATABASE | YES | WORKING | |

---

## Trip Companion (Pre-Trip)

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| Trip companion view | `/trips/[tripId]/companion` | DATABASE | YES | WORKING | `notFound()` if not owner |
| Set departure date | `saveTripDepartureDate` | DATABASE | YES | WORKING | |
| Mark checklist item done | `markReadinessItemDone` | DATABASE | YES | WORKING | |
| Mark checklist item skipped | `markReadinessItemSkipped` | DATABASE | YES | WORKING | |
| Add booking notes | `saveReadinessItemNotes` | DATABASE | YES | WORKING | |
| Readiness score | deterministic | CLIENT_ONLY | YES | WORKING | Computed from checklist state |

---

## Live Trip (In-Trip)

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| Today view | `/trips/[tripId]/today` | DATABASE | YES | WORKING | |
| Mark slot done/skipped/planned | `markDaySlot*` actions | DATABASE | YES | WORKING | |
| Reset slot | `resetDaySlot` | DATABASE | YES | WORKING | |
| Cultural insights in today view | `getCulturalInsights` | DATABASE + MOCK_FALLBACK | YES | WORKING | |
| Local phrases in today view | `getLocalPhrases` | DATABASE + MOCK_FALLBACK | YES | WORKING | |
| Lifecycle computation | `computeLifecycle` | CLIENT_ONLY | — | WORKING | Pure function, date-based |

---

## Post-Trip Reflection

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| Reflection page | `/trips/[tripId]/reflection` | DATABASE | YES | WORKING | |
| Save overall feeling | `saveReflectionOverallFeeling` | DATABASE | YES | WORKING | |
| Save pace/planning | `saveReflectionPaceAndPlanning` | DATABASE | YES | WORKING | |
| Save return intent | `saveReflectionReturnIntent` | DATABASE | YES | WORKING | |
| Save private note | `saveReflectionPrivateNote` | DATABASE | YES | WORKING | |
| Dismiss reflection | `dismissReflection` | DATABASE | YES | WORKING | |
| Complete reflection | `completeReflection` | DATABASE | YES | WORKING | |
| Rate reflection item | `saveReflectionItem` | DATABASE | YES | WORKING | |
| Confirm learning candidate | `confirmLearningCandidate` | DATABASE | YES | WORKING | Promotes to travel_memory_signals |
| Reject learning candidate | `rejectLearningCandidate` | DATABASE | YES | WORKING | |
| Defer learning candidate | `deferLearningCandidate` | DATABASE | YES | WORKING | |
| Eligibility check | `isTripReflectionEligible` | CLIENT_ONLY | — | WORKING | Pure function |
| Timing window | `computeReflectionTimingWindow` | CLIENT_ONLY | — | WORKING | Pure function |

---

## Travel Memory

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| View memory signals | `/account` (TravelMemoryPanel) | DATABASE | YES | WORKING | |
| Confirm signal | `confirmMemorySignal` | DATABASE | YES | WORKING | |
| Reject signal | `rejectMemorySignal` | DATABASE | YES | WORKING | 90-day cooldown |
| Reset memory | `resetLearnedMemory` | DATABASE | YES | WORKING | Deletes all signals |
| Memory → planner | `getActiveMemorySignals` | DATABASE (admin) | YES | WORKING | Injected into AI brief |

---

## Account & Profile

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| Profile page | `/account` | DATABASE | YES | WORKING | |
| Update profile | `updateProfile` | DATABASE | YES | WORKING | Validates preferred_language |
| Favorites toggle | `toggleFavorite` | DATABASE | YES | WORKING | |
| Save postcard | `savePostcard` | DATABASE | YES | WORKING | |
| Delete postcard | `deletePostcard` | DATABASE | YES | WORKING | |
| Newsletter signup | `subscribeToNewsletter` | DATABASE (admin) | No | WORKING | Upsert by email |
| PDF download | `downloadItineraryPdf` | DATABASE | YES | WORKING | |
| Email PDF | `emailItineraryPdf` | DATABASE | YES | WORKING | Requires email config |

---

## Admin / Editorial

| Capability | Route/Action | Data Source | Auth | Status | Notes |
|-----------|-------------|------------|------|--------|-------|
| Discoveries moderation | `/admin/discoveries` | DATABASE | EDITOR | WORKING | |
| Community moderation | `/admin/community` | DATABASE | EDITOR | WORKING | |
| Cultural content | `/admin/cultural` | DATABASE + MOCK* | EDITOR | WORKING* | *Shows mock when Supabase absent (P25-H01) |
| Logistics management | `/admin/logistics` | DATABASE + MOCK* | EDITOR | WORKING* | *Shows mock when Supabase absent (P25-H01) |
| Partner management | `/admin/partners` | DATABASE + MOCK* | EDITOR | WORKING* | *Shows mock when Supabase absent (P25-H01) |
| Approve/reject discovery | `approveDiscoveredDestination` | DATABASE (admin) | EDITOR | WORKING | |
| Promote discovery | `promoteDiscoveredDestination` | DATABASE (admin) | EDITOR | WORKING | |
| Approve/reject community note | `approveCommunityNote` | DATABASE (admin) | EDITOR | WORKING | |

---

## i18n

| Locale | Namespace Coverage | Status |
|--------|-------------------|--------|
| English (en) | 12 namespaces | COMPLETE |
| German (de) | 12 namespaces | COMPLETE |
| Italian (it) | 12 namespaces | COMPLETE |
| Croatian (hr) | 12 namespaces | COMPLETE |

Namespaces: `common`, `community`, `culture-intel`, `email`, `live-trip`, `logistics`, `partners`, `pdf`, `planner`, `reflection`, `travel-memory`, `trip-readiness`
