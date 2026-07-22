# Changelog

All notable changes to Babic Work Log are documented here. Versions are also
visible in-app under **Einstellungen** (gear icon on the dashboard).

## 1.7.0 — 2026-07-22 — New Icon + Home Screen Data Recovery Guidance

### Added

- **New app icon**, generated from the official BabicADesigns artwork
  supplied for this — replaces the previous icon across Home Screen,
  browser tab, and the install prompt (192px, 512px, and a padded
  Android-maskable 512px variant).
- **Home Screen data-recovery banner**: when the installed Home Screen app
  shows no logged entries, a dismissible notice now explains that iOS
  doesn't always share `localStorage` between Safari and a Home Screen app
  for the same site, so existing data may simply be sitting in a separate,
  untouched storage bucket rather than actually lost — and links straight
  to Backup → Import. Only shown in standalone (installed) mode, never in
  regular Safari.

### Notes

- Reported again after 1.6.1's storage hardening: data still disappears on
  every Home Screen install, consistently — not intermittently. That rules
  out the transient-read-anomaly case 1.6.1 targeted and points instead at
  iOS treating the Home Screen app as a genuinely separate storage
  context from Safari for this site, which is a platform-level behavior no
  application code can override (the browser enforces it as a security
  boundary). The practical fix is exporting a Backup from Safari and
  importing it into the installed app — the banner above exists to make
  that discoverable instead of the app just looking empty.

## 1.6.2 — 2026-07-20

### Added

- **Einstellungen**: attribution and copyright notice under the changelog —
  "Designed by: BabicADesigns" / "© BabicADesigns. All rights reserved."

## 1.6.1 — 2026-07-17 — "Restore Stable PDF + Storage Hardening" (Sprint 2.2.2)

### Changed

- **Client Activity Report reverted to a table layout**, matching the
  Business Report's proven technique (jspdf-autotable: automatic row
  heights, automatic page breaks, alternating row colors) instead of the
  card design from 1.6.0. Only two differences from the Business Report's
  table remain, as requested: no "Betrag" column, and the totals line
  shows only hours (`Gesamt: 8,0 h`) with no currency figure. The Business
  Report itself is completely unchanged — same columns, same financial
  totals.
- `services/pdf.ts`'s `drawEntriesTable`/`drawTotalsLine` gained optional
  parameters (defaulting to the exact prior Business Report behavior) so
  both reports can share one table-drawing implementation without
  duplicating it.

### Fixed

- **Hardened against a class of silent data loss.** `bootstrap()` used to
  treat *any* empty read of the clients/projects keys as "fresh install"
  and immediately write starter demo clients over whatever was there —
  including a browser/context where the app has run before and briefly
  failed to read real data back (e.g. a storage-access hiccup). It now
  only ever seeds demo data on a verifiably first-ever load (no prior
  `schema-version` key). If projects/clients come back empty on a browser
  that has used the app before, nothing is written or overwritten — the
  app shows an empty state instead of fabricating unfamiliar demo data, so
  real data isn't masked and can recover on a later successful read.
  Verified against three scenarios: a genuinely fresh browser (still
  seeds), a browser with real existing data (untouched, no seeding), and
  the anomaly case (empty read on a previously-used browser — no
  overwrite, no demo data shown). Legacy pre-1.1 migration path
  re-verified unaffected.
  - Note: if the installed Home Screen app and Safari show different data
    because they're actually different URLs/origins (e.g. a Netlify
    preview deploy vs. the production site), no app-level code change can
    make two different origins share storage — that's a browser security
    boundary, not a bug. Worth double-checking the exact URL used for both
    if this recurs.

## 1.6.0 — 2026-07-17 — "Client Report Redesign" (Sprint 2.3 follow-up)

### Changed

- **Client Activity Report redesigned as bordered session cards**, matching
  the Business Report's visual quality instead of reading as a plain text
  dump. Each logged session is now its own clean, rounded-corner card with:
  - A date heading.
  - Kategorie (category) and Dauer (duration/hours) as a two-column info
    row.
  - Aktivitäten (activities) as a bulleted list, built from the entry's
    notes (one activity per line).
  - Every card's height is measured before anything is drawn (same
    wrapped-text-safe approach as the 1.5.3 fix), so long or multi-line
    notes grow the card automatically and can never overlap the next one;
    automatic page breaks kick in when a card wouldn't fit.
- **Removed the "Include Financial Information" toggle from the Client
  Report.** This report never shows hourly rates, amounts, or monetary
  totals now — Duration (hours) is the only quantity shown, since it's a
  client-facing document. The Business Report is unaffected and still
  always includes full financial detail.

## 1.5.3 — 2026-07-16 — "Client Report Layout Fix" (Sprint 2.3 follow-up)

### Fixed

- **Client Activity Report layout — overlapping text.** The timeline drew
  each activity with `doc.text(text, x, y)` and always advanced the cursor
  by one fixed line height, regardless of how much text was actually
  drawn. jsPDF doesn't wrap text or report how many lines a string
  produced on its own, so any note long enough to wrap — or containing a
  line break — rendered extra lines the layout never accounted for,
  pushing the next entry (or the next date heading) to overlap it.
  Rewrote the layout to measure each entry's actual wrapped line count
  (`doc.splitTextToSize`) before drawing it and before advancing the
  cursor, so the reported height always matches what's on the page:
  - Long notes now wrap properly within the margins instead of overflowing
    or silently desyncing the layout.
  - Bullets use a hanging indent — wrapped/multi-line notes align under
    the text instead of restarting at the margin.
  - A date heading is never left alone at the bottom of a page — if it and
    its first entry don't both fit, the whole day moves to the next page.
  - Consistent, deliberate spacing between activities and between days,
    matching the Business Report's visual quality.

## 1.5.2 — 2026-07-16 — "PDF Export Fix, Take 3" (Sprint 2.3 follow-up)

### Fixed

- **PDF export on iOS Safari — the fallback tab itself was getting
  popup-blocked.** 1.5.1's Share Sheet fallback opened a new tab with
  `window.open()` only after the PDF had already been built — several
  `await`s deep into async work. Safari blocks `window.open()` calls made
  that far from the original tap, silently. Fix: the fallback tab is now
  opened *synchronously*, at the very first line of the click handler,
  before any async work starts — Safari still counts it as a direct result
  of the tap. Once the PDF is ready, that already-open tab is simply
  navigated to it instead of trying to open a new one.
- **On-screen debug log**: a small panel now appears at the bottom of the
  screen during a PDF export, showing every step live — no Mac or Safari
  Web Inspector needed to see where an export succeeds or stops. Copyable
  with one tap. Temporary — will be removed once export is confirmed
  reliably stable across devices.

## 1.5.1 — 2026-07-16 — "PDF Export Fix, Take 2" (Sprint 2.3 follow-up)

### Fixed

- **PDF export on iOS Safari, properly this time.** The 1.5.0 fix (prefetching
  the PDF module so the click-to-`doc.save()` chain stayed inside a single
  user gesture) turned out not to be enough — reported as still doing
  nothing on iPhone Safari. Root cause is more fundamental: jsPDF's
  `doc.save()` downloads via a synthetic `<a download>` click on a blob URL,
  and that mechanism is unreliable on iOS regardless of timing. Fix: on iOS,
  the PDF is now built as a `Blob` and handed to the native Share Sheet via
  `navigator.share()` — the same "Speichern in Dateien / AirDrop / …" sheet
  any other app uses. If the Share API isn't available, it falls back to
  opening the PDF in a new Safari tab, where Safari's own toolbar has a
  Share/Save button. Desktop and Android are unaffected — they still use
  `doc.save()` exactly as before (verified byte-identical output).
- Added temporary `console.log` statements along the entire export path
  (button click → entries found → PDF built → save/share called) so any
  future export issue can be diagnosed directly from the browser console
  instead of guessing.

## 1.5.0 — 2026-07-16 — "PDF Export Fix & Client Reports" (Sprint 2.3)

### Fixed

- **PDF export on iOS Safari**: the "Als PDF exportieren" buttons could
  silently do nothing on iOS Safari. Root cause: the PDF code is loaded via
  a dynamic `import()` to keep it out of the main bundle, and that import is
  a real network fetch — a macrotask. Safari drops "user activation" across
  a macrotask, so by the time `doc.save()` ran, Safari no longer recognized
  it as a genuine user gesture and silently blocked the download. Fix: the
  PDF module is now prefetched as soon as the Week/Month view (or the new
  report builder) mounts, so the click handler's `import()` resolves from
  cache — a microtask — keeping the gesture chain intact. No existing
  behavior changed; verified the exact same output byte-for-byte against
  the pre-fix export.

### Added

- **Report builder** (Dashboard → "Berichte", or a shortcut from any
  project's detail screen): generates one of two PDF report types.
  - **Business Report** — every project with entries in the chosen period,
    hours and amounts included. For your own records.
  - **Client Activity Report** — a single project rendered as a
    chronological day-by-day timeline (date → that day's activities), no
    financial information by default. An "Include Financial Information"
    switch optionally reveals hours, rate, amount, and a total — for
    handing to a client.
  - Both support This Week / This Month / a custom date range.
- **Future-ready report fields** (inert, unused today): optional
  attachment/signature/customer-approval fields on the report config, so
  Invoices, Signatures, Attachments, and Customer Approval can be added
  later without a breaking change — same pattern as the Memory Architecture
  fields on `TimeEntry`.

### Changed

- `services/pdf.ts` refactored to share header/footer/watermark/table
  drawing with the new report generators (`modules/reports/`), instead of
  duplicating that code. The existing week/month export keeps working
  exactly as before.

## 1.4.0 — 2026-07-16 — "Income Engine & Business Finance" (Sprint 2.1/2.2, combined)

The payments/finance layer deferred from 1.3.0, combined with the retainer
billing-period work from Sprint 2.2 since no `Payment` records existed yet in
production — nothing to migrate for either piece individually. No breaking
changes; all existing data is untouched.

### Added

- **Payments**: a new standalone `Payment` entity — client, amount, payment
  date, billing period, payment type (Pauschale/Stundenbasiert/Festpreis/
  Zusatzzahlung/Vorauszahlung/Bonus/Spesenerstattung), method, income
  category, and note. Independent of individual work entries. New
  **Zahlungen** tab under Kunden & Projekte lists payments grouped by
  billing month and lets you record new ones.
- **Billing periods**: a payment can be booked against a single date or an
  entire billing month, so a monthly retainer isn't forced onto one specific
  day. Multiple payments in the same month (e.g. base retainer + extra
  payments) are automatically grouped and summed together. A date-range
  billing period is modeled for future use but not yet exposed in the UI.
- **Client finance settings**: per-client income model, default hourly rate
  or retainer amount, and default billing period type — editable from the
  client profile. New payments for that client default to the right billing
  period automatically (e.g. retainer clients default to picking a month).
- **Dashboard**: a Business-Finance card (expected/received/outstanding/
  extra payments for the current month) and a revenue-development card
  (this month vs. last month), alongside the existing hours-based Business
  Health card.
- **Reports (data model only, no screen yet)**: revenue grouped by month,
  client, category, project, or payment type — pure functions ready for a
  future reports screen.

### Changed

- Backup export/import/merge now include payments and client finance
  settings. Older backups without them still import cleanly (missing
  arrays default to empty).
- Internal: the existing per-entry partial payment type was renamed from
  `Payment` to `EntryPayment` to distinguish it from the new standalone
  finance `Payment` entity — a type-level rename only, no stored data or
  behavior changed.
- Architecture: new `src/modules/finance/` module (models, storage,
  calculations, hooks, components) referencing `Client`/`Project` only by
  id, matching the reusable-module pattern the Client Profile phase
  established — future modules (Invoices, CRM, Reports UI, ...) can follow
  the same shape.

## 1.3.0 — 2026-07-15 — "Client Profiles & CRM Foundation" (Sprint 2.1, part 1)

Client Profile phase of the Income Engine / Business Finance sprint. The
payments/finance layer follows in a subsequent release; this part focuses
on making the Client entity the reusable central object future modules
(Finance, Invoices, Documents, CRM, Tasks, Travel, Meetings, Content) will
reference instead of duplicating client data. No breaking changes.

### Added

- **Client Profile fields**: contact person, website, address, country, VAT
  ID, business relationship (Client/Partner/Supplier/Affiliate
  Partner/Business Contact/Internal), priority (High/Medium/Low), tags,
  and preferred communication channel (Email/Phone/WhatsApp/Telegram/Other).
- **Client status** (Active/Paused/Completed/Archived), superseding the
  simple archive toggle. Existing archived clients migrate automatically to
  `status: "archived"`; the legacy `archived` boolean is kept in sync for
  backward compatibility.
- **Split notes**: the existing general `notes` field is untouched; two new
  fields, `internalNotes` and `relationshipNotes`, capture the newly
  distinct concepts without reinterpreting existing data.
- **New client detail screen** for editing the full profile, opened by
  tapping a client row (mirrors the existing project detail pattern). The
  inline creation form stays minimal (name + company) — everything else is
  filled in afterward.
- **Client Timeline architecture** (not rendered anywhere yet): a
  `ClientTimelineEvent` type and a pure `getClientTimeline()` aggregator
  that composes a client's work sessions and documents (payments once the
  finance layer lands) into one sorted feed, without a new data store —
  the timeline is a read-only view over data that already exists.

### Changed

- Schema version bumped to 4. `normalizeClient` now derives `status` from
  the legacy `archived` boolean when missing, and keeps both fields
  consistent going forward regardless of which one is written to.

## 1.2.0 — 2026-07-15 — "Work Intelligence Foundation"

Sprint 2. Internal architecture groundwork for the future "Anita Memory"
evolution of this app — no breaking changes, no data loss, no reset of
existing `localStorage` data.

### Added

- **Timer stop dialog** — stopping the dashboard timer now opens "Was hast
  du gemacht?", asking for project, category, a short description, and
  notes before the work entry is created (previously it auto-created a
  blank entry and opened it for editing).
- **Client fields**: company, default hourly rate, color label.
- **Project fields**: status (Aktiv / Pausiert / Abgeschlossen), notes.
- **Dashboard 2.0**: a quick-actions row (Timer, Neuer Eintrag, Neues
  Projekt, Backup), an "Ø Stundenlohn" stat, a "Zuletzt aktive Projekte"
  section, and a settings entry point.
- **Settings screen**: current version, build date, and full changelog.
- **Memory Architecture (internal only)** — every work entry now supports
  optional `summary`, `transcript`, `tags`, `entities`, `customerId`, and
  `createdBy` fields. Nothing reads or writes them yet; they exist purely so
  a future AI layer doesn't require a breaking schema change later. See
  `src/future-ai/`.

### Changed

- Internal code reorganized into `components/`, `hooks/`, `services/`,
  `models/`, `theme/`, and `future-ai/` for a more scalable architecture.
  Purely structural — no behavior changes. Import paths moved from `@/lib/*`
  to `@/services/*` and `@/models`.
- Data-shape colors centralized in `src/theme/tokens.ts` as the source of
  truth for non-Tailwind consumers (PDF export, icon generation).
- Schema version bumped to 3. The on-load migration now always normalizes
  existing clients/projects (previously, already-migrated 1.1 data could
  silently skip getting new optional fields defaulted — fixed).

### Fixed

- Projects saved under the 1.1 schema (with a client already attached but
  no `status` field) now correctly get `status: "active"` defaulted on
  load, instead of potentially rendering a blank status label.

## 1.1.0 — 2026-07-15

- Timer with start/pause/resume/stop.
- Clients module — projects now belong to a client.
- Fixed-price projects with an automatically computed effective hourly rate.
- Partial payments per entry, with an auto-derived payment status.
- Calendar view, statistics with charts, day-close summary, weekly
  "Business Health" recap.
- Per-project documents (stored locally).
- Local backup system — export/import as JSON, safe merge by default.
- Brand watermark and reworked app icon.

## 1.0.0 — 2026-07-15

- Initial release: dashboard, entries (manual hours or start/end time),
  projects, week/month overviews, PDF export as a Tätigkeitsnachweis
  (activity record, not an invoice).
