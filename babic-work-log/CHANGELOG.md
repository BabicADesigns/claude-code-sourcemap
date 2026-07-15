# Changelog

All notable changes to Babic Work Log are documented here. Versions are also
visible in-app under **Einstellungen** (gear icon on the dashboard).

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
