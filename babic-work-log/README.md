# Babic Work Log

Eine minimalistische, warme Progressive Web App (PWA) für die persönliche Zeit- und Projekterfassung. Kein Login, keine Cloud, keine Datenbank — alle Daten liegen ausschließlich lokal im Browser (`localStorage`).

## Funktionen

- **Dashboard**: heute/diese Woche/diesen Monat gearbeitete Stunden, offene Beträge, bereits bezahlte Summe
- **Einträge**: Projekt, Datum, Kategorie, Start-/Endzeit *oder* manuelle Stundenangabe, Stundensatz, Notizen, optionales Foto
- **Status je Eintrag**: Offen · Teilweise bezahlt · Bezahlt
- **Wochen- und Monatsübersicht** mit automatischer Summierung und Projektaufschlüsselung
- **PDF-Export** eines Tätigkeitsnachweises (kein Rechnungsdokument) für den gewählten Zeitraum
- **Projektverwaltung** mit individuellem Standard-Stundensatz je Projekt
- Installierbar als PWA (Startbildschirm, Offline-fähig durch Service Worker)

## Tech-Stack

React · TypeScript · Vite · Tailwind CSS · shadcn/ui-Pattern (Radix Primitives) · Framer Motion · jsPDF · `localStorage`

## Lokale Entwicklung

Voraussetzung: Node.js 18+

```bash
cd babic-work-log
npm install
npm run dev
```

Die App läuft danach unter `http://localhost:5173`.

### Weitere Skripte

```bash
npm run build     # Produktions-Build nach dist/
npm run preview   # Produktions-Build lokal testen
npm run lint       # ESLint
```

## Deployment auf Netlify

Die App ist ein reines Frontend-Build (statische Dateien) und lässt sich ohne Server-Konfiguration auf Netlify deployen.

### Option A: Netlify UI (empfohlen für den Einstieg)

1. Repository mit Netlify verbinden ("Add new site" → "Import an existing project").
2. Falls die App **nicht** im Repository-Root liegt, unter **Site settings → Build & deploy → Base directory** den Ordner `babic-work-log` eintragen.
3. Build-Einstellungen (werden auch automatisch aus `netlify.toml` übernommen):
   - **Build command**: `npm run build`
   - **Publish directory**: `dist` (relativ zum Base directory)
4. Deploy auslösen. Netlify baut die App bei jedem Push automatisch neu.

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
cd babic-work-log
npm run build
netlify deploy --prod --dir=dist
```

### Hinweise

- `netlify.toml` enthält bereits einen SPA-Redirect (`/* → /index.html`), damit clientseitiges Routing funktioniert.
- Die App benötigt **keine Umgebungsvariablen** und **keine Datenbank** — alle Daten bleiben im Browser der Nutzerin.
- Da alle Daten lokal gespeichert werden, gehen sie beim Löschen der Browserdaten oder beim Wechsel des Geräts/Browsers verloren. Ein manueller Export (PDF) dient als Sicherung des Tätigkeitsnachweises, ersetzt aber kein vollständiges Daten-Backup.

## Projektstruktur

```
babic-work-log/
├── public/icons/       PWA-Icons (generiert via scripts/generate-icons.mjs)
├── src/
│   ├── components/     UI-Komponenten (Dashboard, Wochen-/Monatsübersicht, Projekte, Formulare)
│   │   └── ui/          shadcn/ui-Pattern Primitives (Button, Card, Select, Sheet, …)
│   ├── hooks/           useProjects, useEntries (localStorage-gestützter State)
│   ├── lib/             Typen, Datum-/Berechnungslogik, localStorage-Layer, PDF-Export
│   ├── App.tsx           Navigation & App-Shell
│   └── main.tsx
├── netlify.toml
└── vite.config.ts        inkl. vite-plugin-pwa (Manifest & Service Worker)
```
