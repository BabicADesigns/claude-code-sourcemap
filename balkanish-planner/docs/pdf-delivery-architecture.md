# PDF Delivery & Email Experience Architecture — Phase 14

**Product:** Balkanish Planner
**Status:** Shipped. Itinerary PDFs can be downloaded, emailed, and regenerated from `/my-trips`, with a per-user delivery history. Destination guide PDFs are downloadable from each destination's detail page. No payments, no subscriptions, no Stripe — all explicitly out of scope per the brief.

---

## 1. What was already in place (Phases 5 and 10)

- **PDF rendering.** `lib/pdf/generate-itinerary-pdf.tsx`'s `generateItineraryPdfBlob()` (Phase 5) already rendered a fully branded, eight-section itinerary PDF with `@react-pdf/renderer`, dynamically imported so the renderer stays out of the initial bundle. `planner-flow.tsx`'s Print button was its only consumer.
- **Multilingual PDF labels.** Phase 9 already threaded a `pdf` i18n namespace (`locales/{en,de,it,hr}/pdf.json`) through `itinerary-pdf.tsx`, covering cover, section eyebrows, day cards, map labels, and the branded footer — destination *content* (names, descriptions, AI narrative) stays in whatever language it was generated in, only the PDF's own labels are translated. Phase 14 extends this namespace; it does not change how it works.
- **Saved itineraries.** `lib/data/itineraries.ts` / `lib/actions/itineraries.ts` (Phase 10) already had `getSavedItineraryById`, rename, and delete. `/my-trips` (Phase 10) already existed as the named dashboard the brief's requirement #4 points at.
- **Storage helpers.** `lib/supabase/storage.ts` (Phase 13) already had `uploadOwnerAsset()` and an owner-scoped bucket convention; Phase 14 adds the `itinerary-pdfs` bucket to `STORAGE_BUCKETS` and reuses the same helper rather than writing new upload code.
- **Email provider groundwork.** None — Phase 14 is the first phase to send email. `docs/accounts-trips-architecture.md` §4 had already flagged "PDF delivery (email)" as a known-future consumer of `generateItineraryPdfBlob()`'s `Blob` return type, which is exactly what happened.

## 2. What Phase 14 actually added

### 2.1 Schema — `pdf_documents` and `pdf_deliveries` (migration `0011`)

Two new tables, both append-only history logs rather than mutable "current state" rows:

- **`pdf_documents`** — one row per rendered PDF. `document_type` (`itinerary | destination_guide | premium_guide`) and `source_id` form a polymorphic reference (no FK — `source_id` points at `generated_itineraries.id` today, a future `destinations.id` or premium-guide id tomorrow, deliberately following the same no-FK polymorphic pattern as `favorites.entity_id`). `locale` is constrained to the four Phase 9 locales. `storage_path` is nullable so a row can exist before (or instead of) a Storage object — `expires_at` defaults to `now() + 30 days`, after which `findReusablePdfDocument()` stops treating it as reusable, modeling Supabase Storage's own signed-URL expiry without needing a cron job to clean anything up.
- **`pdf_deliveries`** — one row per download or email *event*, never updated after insert. RLS deliberately grants owner `select`/`insert` only — no `update`, no `delete` — because requirement #3 ("Delivery History") is a log, and a log you can edit after the fact isn't a log. `channel` (`download | email`) and `status` (`pending | sent | failed`) plus a nullable `recipient_email` and `error_message` are enough to answer every question the My Trips delivery-history view needs to answer.

Both tables carry standard owner-scoped RLS (`auth.uid() = user_id`), matching every other user-owned table in this codebase.

### 2.2 Why itinerary PDFs go through Storage but destination guides don't

Two different PDF types, two different architectures, both documented in code comments at the point of use:

- **Itinerary PDFs** are generated server-side (`lib/pdf/generate-itinerary-pdf.tsx`'s `generateItineraryPdfBuffer()`), uploaded to the owner-scoped `itinerary-pdfs` Storage bucket (`lib/pdf/storage.ts`), and recorded as a `pdf_documents` row. This round-trip is required because email delivery needs the same bytes a download needs, and a server action can't hand a client-rendered blob to its own `sendEmail()` call — the buffer has to exist somewhere both paths can reach it. Storing it also gives "Download" a cheap reuse path (`findReusablePdfDocument`) instead of re-rendering on every click, and gives delivery history something concrete to point at.
- **Destination guide PDFs** are downloaded only — there is no "email a destination guide" requirement, and no per-user state to persist (a destination guide isn't owned by any one user the way a saved itinerary is). `generateDestinationGuidePdfBlob()` (`lib/pdf/generate-destination-guide-pdf.tsx`) renders directly in the browser via the same dynamic-import pattern as the itinerary export, and `DestinationGuidePdfButton` turns the blob into a same-tab download with no server round-trip, no Storage write, and no `pdf_documents` row. If a future phase adds destination-guide emailing, the itinerary path above is the template to follow — render server-side, store, record, attach.

### 2.3 Email provider architecture (Resend, with a safe no-op fallback)

`lib/email/send.ts` calls Resend's REST API directly via `fetch` (no SDK dependency). `isEmailConfigured()` checks for `RESEND_API_KEY`; every email-sending server action checks this first and returns a friendly `{ error: "Email delivery isn't set up yet — try Download instead." }` rather than throwing, so the app runs correctly with Download-only functionality before an email provider is ever wired up — the same "feature degrades gracefully when unconfigured" convention as `isSupabaseConfigured()` (Phase 4) and the AI provider check (Phase 4/8). `lib/email/templates.ts` builds the subject/HTML for two cases: a fresh itinerary-PDF email (`buildItineraryEmail`) and a resend of a previously generated one (`buildResendItineraryEmail`), both reading labels from the new `locales/*/email.json` files rather than hardcoded English.

### 2.4 Server actions (`lib/actions/pdf-delivery.ts`)

Five actions, all `"use server"`, all following the same shape as every other action in this codebase (`isSupabaseConfigured()` → `getCurrentUser()` → ownership check → do the thing → friendly error on any failure):

- **`downloadItineraryPdf(itineraryId, locale)`** — reuses a non-expired stored PDF if one exists for this itinerary+locale, otherwise renders and stores a fresh one; returns a 1-hour signed URL.
- **`regenerateItineraryPdf(itineraryId, locale)`** — identical, but always force-renders, producing a new `pdf_documents` row and a new delivery-history entry even if a reusable one existed. This is the one place "regenerate" means something different from "download": it's the explicit "make me a fresh one" button.
- **`emailItineraryPdf(itineraryId, locale)`** — same reuse-or-render path as download, then attaches the resulting buffer to an email via `sendEmail()`. If a previously stored PDF is being reused, its bytes are re-downloaded from Storage (`downloadStoredPdf`) since the render path that would have given an in-memory buffer was skipped.
- **`resendItineraryPdf(pdfDocumentId)`** — re-sends a *specific past* `pdf_documents` row (requirement #2's "resend previous PDF") rather than the current itinerary state, falling back to a fresh render only if the original Storage object is gone (expired/deleted), and always logging a new delivery row rather than mutating the original. Not yet wired into the UI — `getDeliveryHistoryForUser` surfaces the history needed to build a "Resend" button per row, which is the natural next increment.
- **`getOrRenderItineraryPdf()`** (private helper, not exported) — the shared reuse-or-render decision used by all three read paths above, keeping requirement #7's "expired files" handling (treat "no reusable row" and "expired row" identically — just render a new one) in exactly one place.

Every action calls a shared `logDelivery()` helper after every attempt, success or failure, so `pdf_deliveries` reflects what actually happened rather than what was attempted.

### 2.5 My Trips UI (`components/my-balkans/saved-itineraries.tsx`, `app/my-trips/page.tsx`)

- Each saved trip row gained three buttons — **Download PDF**, **Email PDF**, **Regenerate PDF** — each tracked by a single `pdfPending: { id, action } | null` state so only the row and button actually in flight shows a "Preparing…/Sending…/Regenerating…" label, and a per-row `pdfFeedback` map for inline success/error text below the button row (the same `text-destructive` / `text-sage-dark` convention used everywhere else in this codebase — there is no toast library here, so this phase didn't introduce one).
- The pre-existing "Regenerate" link (which actually just navigated back to `/planner` to restart the AI wizard) was renamed **"Edit in Planner"** to stop colliding with the new, semantically different "Regenerate PDF" button.
- A new **Delivery History** dashboard section (`components/my-balkans/delivery-history.tsx`, fed by `getDeliveryHistoryForUser()` in `lib/data/pdf-delivery.ts`) lists every download/email event for the signed-in user, newest first, with document type, channel, recipient (if emailed), date, and status — a thin read-only server component over one joined Supabase `select("*, document:pdf_documents(*)")`, the same embedded-select pattern already used by `lib/data/secret-swaps.ts`.

### 2.6 Analytics hooks (architecture only, per requirement #9)

Three events were added to `lib/analytics.ts`'s `ANALYTICS_EVENTS`: `PDF_GENERATED`, `PDF_DOWNLOADED`, `PDF_EMAILED`. `track()` (Plausible, Phase 4) is a client-only no-op until a real analytics script is wired in, so these fire today but go nowhere — exactly the same "architecture only" status every other Phase 14 requirement asks for. Call sites:

- Itinerary download: `PDF_DOWNLOADED` after a successful `downloadItineraryPdf()`.
- Itinerary email: `PDF_EMAILED` after a successful `emailItineraryPdf()`.
- Itinerary regenerate: `PDF_GENERATED` after a successful `regenerateItineraryPdf()` (it always renders fresh, so "generated" is accurate every time, unlike download/email which may silently reuse a cached PDF).
- Destination guide download: both `PDF_GENERATED` and `PDF_DOWNLOADED` fire together, since that flow has no separate render/store/serve steps — generation and download are one atomic browser action.

## 3. Future readiness (requirement #8)

None of the following are built. Each is additive on top of what exists today:

- **Automated travel emails (reminders, pre-departure guides, post-trip recommendations).** The pieces these would be assembled from already exist: `lib/email/send.ts` for delivery, `lib/email/templates.ts` for the subject/HTML-building pattern (add a `buildTripReminderEmail()` etc. alongside the existing two builders), and `pdf_documents`/`pdf_deliveries` for knowing what's already been sent to whom. What's missing is a trigger — a scheduled job (e.g. a daily cron hitting a new route handler) that queries `generated_itineraries` for trips whose dates are approaching and calls the existing send path. No schema change is needed to start this; a `trip_start_date` column on `generated_itineraries` would be the one addition required to know *when* to fire.
- **Premium guides.** `pdf_documents.document_type` already has `premium_guide` as a valid value with nothing built behind it yet — the polymorphic `source_id` pattern means a premium guide is just a third `document_type`/`source_id` pair away from working with the exact same storage and delivery-history code, whenever that content type is designed.
- **A "Resend" button in the UI.** `resendItineraryPdf()` is fully built and tested by typecheck but not yet wired to a button — `DeliveryHistory` rows have everything needed (a `pdf_document_id` via the joined `document`) to add one.
- **Subscriptions / premium gating.** Explicitly out of scope per the brief ("No payments. No subscriptions. No Stripe."). `docs/accounts-trips-architecture.md` §4 already describes the expected shape (`profiles.is_premium`) for whenever billing is introduced — Phase 14 doesn't touch it.

## 4. What does NOT change in this phase

- No Stripe, no payment fields, no subscription tables or columns.
- No change to `lib/ai/itinerary.ts`, `lib/ai/grounding.ts`, or `lib/ai/discovery.ts` — PDF delivery operates entirely on already-generated content.
- No new UI component library — no toast system, no dropdown menu. Feedback uses the existing inline-text convention.
- All Phase 1–13 migrations, columns, and policies are untouched; migration `0011` is additive-only.
