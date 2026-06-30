# Community Intelligence & Founder's Picks — Phase 16

Phase 16 transforms the Balkanish Planner from a static editorial travel guide into a living ecosystem by adding user-generated content, editorial founder voices, local character studies, and the data infrastructure for future community-driven rankings. All new content is explicitly typed, moderated, or editorial-only — the "AI never invents facts" principle from Phase 11 extends here unchanged.

---

## Architecture Overview

```
lib/types.ts              — 8 new types (Founder, FoundersPick, CommunityNote, LocalHero,
                            BalkanishStory, EngagementSignal, + their enum/const exports)
lib/data/founders.ts      — data layer: getFounders, getFounderBySlug, getFoundersPicksForDestination
lib/data/local-heroes.ts  — data layer: getLocalHeroes, getLocalHeroesForDestination
lib/data/stories.ts       — data layer: getStories, getStoryBySlug
lib/data/community-notes.ts — data layer: getApprovedNotesForDestination (public), getAllNotes (admin)
lib/actions/community-notes.ts — server actions: submitCommunityNote, approveCommunityNote, rejectCommunityNote
lib/actions/engagement.ts — server action: recordEngagementSignal (best-effort, never throws)
lib/ai/trust.ts           — extended with gemBadgeLabel(tier) for consistent badge copy
lib/analytics.ts          — 5 new events: COMMUNITY_NOTE_SUBMITTED, GEM_CONFIRMED, STORY_VIEWED,
                            LOCAL_HERO_VIEWED, FOUNDERS_PICK_VIEWED
lib/i18n/dictionaries.ts  — community namespace added (locales/{en,de,it,hr}/community.json)
```

---

## 1. Founder's Picks

**Requirement #1** — editorial, human-authored only.

Founders are real editorial voices behind Balkanish (initially Ivana Babić). A `FoundersPick` links a founder to a destination with a personal `title`, `body`, optional `portrait`, and a handwritten `signature` rendered in `font-script`. Multiple founders are supported from day one.

**Where it renders:** `app/hidden-gems/[slug]/page.tsx` — "Founder's Pick" section, immediately above Local Heroes.

**Component:** `components/brand/editorial.tsx` → `FoundersPickCard`

**Mock data:** `lib/data/founders-mock.ts` — includes Ivana Babić with picks for "vis" and "cavtat".

**Database:** `public.founders` + `public.founders_picks` (migration 0013). Public read; service-role-only write. `founders_picks.founder_id` references `public.founders(id)`.

---

## 2. Community Notes

**Requirement #2** — user-submitted, moderated before display.

Any visitor (anonymous or signed-in) can submit a tip categorised as: `sunset_spot`, `parking`, `coffee`, `local_etiquette`, `seasonal`, `food_tip`, `transport`, or `other`. Notes land in `moderation_status = 'pending'` and are invisible to the public until an editor approves them.

**Submission flow:**
1. User fills out `CommunityNoteForm` (client component in `components/community/`)
2. Form calls `submitCommunityNote()` server action (`lib/actions/community-notes.ts`)
3. Server action inserts a `pending` row via the service-role admin client
4. Editor visits `/admin/community` and approves or rejects via `CommunityPanel`
5. On approval, the note becomes publicly visible on the destination page

**Where notes render:** `app/hidden-gems/[slug]/page.tsx` — "Community Tips" section (approved only).

**Security:** The Supabase RLS policy allows public INSERT only when `moderation_status = 'pending'` — the value is hardcoded in the server action and cannot be overridden by a client. Public SELECT only returns `moderation_status = 'approved'` rows.

**Content validation:** Server action enforces 10–500 character range; no URLs or HTML are sanitised on this layer yet (plain text only; Supabase RLS prevents escalation).

---

## 3. Hidden Gem Verification Badges

**Requirement #3** — consistent across all surfaces.

`gemBadgeLabel(tier: TrustTier)` in `lib/ai/trust.ts` returns the single canonical string for each tier:

| tier                | badge text                |
|---------------------|---------------------------|
| `verified`          | Verified Hidden Gem       |
| `community_verified`| Community Hidden Gem      |
| `ai_suggested`      | AI Suggested Hidden Gem   |

`GemBadge` component (`components/community/gem-badge.tsx`) wraps this in a consistently styled pill with tier-specific colour: sage for verified, rose for community, muted for AI-suggested.

This component should be wired into the planner itinerary view, PDF, and saved trips in a future patch — the label function is the shared source of truth so copy stays consistent regardless of where the badge renders.

---

## 4. Local Heroes

**Requirement #4** — editorial only; never a business directory.

A `LocalHero` is a real person who lives and works in a destination — a winemaker, a fisherman's family, a chef. The content is human-authored narrative (`story` field), not a business listing. No link to purchase, no phone number, no business hours. `website` and `social_links` fields exist for the data model but are deliberately not rendered as clickable links in `LocalHeroCard` to maintain the editorial-not-commercial line.

**Where it renders:** `app/hidden-gems/[slug]/page.tsx` — "Local Heroes" section.

**Component:** `components/brand/editorial.tsx` → `LocalHeroCard`

---

## 5. Balkanish Stories

**Requirement #5** — multilingual cultural narratives.

`BalkanishStory` holds `title`, `body`, and `excerpt` as `LocalizedText` — each field carries EN/DE/IT/HR variants, so a Croatian reader gets a properly written Croatian text, not a machine translation. Categories: `coffee_culture`, `traditions`, `island_life`, `local_customs`, `food_rituals`, `festivals`.

**Data layer:** `lib/data/stories.ts` — `getStories(category?)` and `getStoryBySlug(slug)`.

**Component:** `components/brand/editorial.tsx` → `StoryCard` (for index/grid use).

**Routes:** A dedicated `/stories/[slug]` detail page is scaffolded by the `StoryCard` link but not built in this phase — it's the natural next step.

---

## 6. Community Moderation

**Requirement #6** — extends the existing admin dashboard pattern.

`/admin/community` uses the same editor-gating pattern as `/admin/discoveries`: `isEditorEmail()` against the `EDITOR_EMAILS` env var, `getCurrentUser()` from the server client, redirect on unauthenticated, friendly message on unauthorized.

`CommunityPanel` (`components/admin/community-panel.tsx`) lists all notes (pending + approved + rejected) with Approve/Reject buttons. Only pending notes show action buttons — already-decided rows are read-only to avoid re-review.

The "convert note to official editorial recommendation" workflow is deferred: the moderation UX today is approve/reject only; a future editor tool can copy note content into editorial body fields manually.

---

## 7. Ranking Foundation

**Requirement #7** — data collection only; no rankings exposed to end users.

`public.engagement_signals` (migration 0013) records events of type `view | like | bookmark | planner_usage | community_confirmation` against entities of type `destination | food_find | culture_note | secret_swap | discovered_destination | story | local_hero | founders_pick`.

`recordEngagementSignal()` (`lib/actions/engagement.ts`) is a server action that:
- Is best-effort and never throws (never blocks a page render)
- Accepts an optional `user_id` (filled from session when signed in, null for anonymous)
- Uses the service-role admin client to write (bypasses RLS, consistent with other background writes)

No ranking logic reads these signals yet. The signals accumulate and will feed a future `getRankedDestinations()` query when the ranking layer is implemented.

---

## 8. Founder Identity

**Requirement #8** — multiple founders supported.

`Founder` has `name`, `slug`, `bio`, `signature` (handwritten-style sign-off string), `photo?: ImageAsset`, and `social_links`. The `slug` field enables a future `/founders/[slug]` detail page. Mock data starts with one founder (Ivana Babić) but the schema and data layer support any number.

---

## 9. Editorial Components

**Requirement #9** — all in `components/brand/editorial.tsx` or `components/community/`.

| Component | Location | Description |
|---|---|---|
| `FoundersPickCard` | `editorial.tsx` | Elegant pick card with portrait, handwritten sign-off |
| `LocalHeroCard` | `editorial.tsx` | Character study card: photo, profession, story |
| `StoryCard` | `editorial.tsx` | Story index card: hero image, category badge, excerpt |
| `CommunityNoteCard` | `community/` | Compact approved-note display with category pill |
| `CommunityNoteForm` | `community/` | Client form for submitting new community notes |
| `GemBadge` | `community/` | Trust-tier badge using `gemBadgeLabel()` |

---

## i18n

`community` namespace added to `lib/i18n/dictionaries.ts` and authored in all four locales:

- `locales/en/community.json`
- `locales/de/community.json`
- `locales/it/community.json`
- `locales/hr/community.json`

Keys cover: `founders_pick`, `local_heroes`, `stories`, `community_notes`, `note_form`, `categories`, and `gem_badge` labels.

---

## Database Summary (migration 0013)

| Table | Key fields | RLS: read | RLS: write |
|---|---|---|---|
| `public.founders` | slug unique | public | service-role only |
| `public.founders_picks` | destination_slug, founder_id fk | public | service-role only |
| `public.community_notes` | destination_slug, moderation_status | approved only | anyone (pending only) |
| `public.local_heroes` | destination_slug | public | service-role only |
| `public.balkanish_stories` | slug unique, category | public | service-role only |
| `public.engagement_signals` | entity_type, entity_id, signal_type | no public read | anyone (tracking signals) |

---

## What's Not in This Phase

- `/stories/[slug]` detail page — wired by `StoryCard` links but not built yet
- `/founders/[slug]` detail page — slug field exists, page not built
- Public ranking exposure — signals collected, no ranked queries yet
- "Convert note to editorial" UI — manual editor workflow for now
- Engagement signal call sites — server action exists; wiring into destination views is a future patch
