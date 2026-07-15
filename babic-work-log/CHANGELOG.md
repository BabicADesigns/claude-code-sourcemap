# Changelog

All notable changes to Babic Work Log are documented here. Versions are also
visible in-app under **Einstellungen** (gear icon on the dashboard).

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
