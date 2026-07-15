export const APP_VERSION = '1.3.0'

/** Real build timestamp, injected via vite.config.ts's `define`. */
export const BUILD_DATE: string = __BUILD_DATE__

export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2026-07-15',
    changes: [
      'Kundenprofil erweitert: Ansprechpartner, Website, Adresse, Land, USt-IdNr., Beziehung (Kunde/Partner/Lieferant/Affiliate-Partner/Geschäftskontakt/Intern), Priorität, Tags und bevorzugte Kommunikation.',
      'Kunden-Status (Aktiv/Pausiert/Abgeschlossen/Archiviert) ersetzt die einfache Archivieren-Funktion — bestehende archivierte Kunden werden automatisch übernommen.',
      'Notizen bei Kunden aufgeteilt in allgemeine, interne und beziehungsbezogene Notizen.',
      'Kundenprofil ist jetzt das zentrale Objekt, auf das künftige Module (Finanzen, Rechnungen, Dokumente, CRM, Aufgaben, Reisen, Meetings, Content) verweisen, statt Daten zu duplizieren.',
      'Architektur für eine künftige Kunden-Zeitleiste vorbereitet (Arbeitssitzungen, Zahlungen, Dokumente, Notizen) — noch ohne eigene Ansicht.',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-07-15',
    changes: [
      'Timer: Stop zeigt jetzt "Was hast du gemacht?" — Projekt, Kategorie, Kurzbeschreibung und Notizen werden vor dem Speichern abgefragt.',
      'Kunden: Firma, Standard-Stundensatz und Farbe hinzugefügt.',
      'Projekte: Status (Aktiv/Pausiert/Abgeschlossen) und Notizen hinzugefügt.',
      'Dashboard 2.0: Schnellzugriffe (Timer, Eintrag, Projekt, Backup) und zuletzt aktive Projekte.',
      'Einstellungen: Version, Änderungsprotokoll und Build-Datum einsehbar.',
      'Interne Architektur in components/hooks/services/models/theme/future-ai aufgeteilt — keine sichtbaren Änderungen, aber die Grundlage für künftige Funktionen.',
      'Jeder Arbeitseintrag ist jetzt intern für eine zukünftige KI-Funktion vorbereitet (noch nicht aktiv).',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-07-15',
    changes: [
      'Timer mit Start/Pause/Stopp.',
      'Kunden-Modul: Projekte gehören jetzt zu einem Kunden.',
      'Festpreisprojekte mit automatisch berechnetem effektivem Stundenlohn.',
      'Teilzahlungen pro Eintrag.',
      'Kalenderansicht, Statistik mit Diagrammen, Tagesabschluss, wöchentliche Business-Health-Übersicht.',
      'Dokumente pro Projekt (lokal gespeichert).',
      'Lokales Backup-System (Export/Import als JSON).',
      'Marken-Wasserzeichen und überarbeitetes App-Icon.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-07-15',
    changes: [
      'Erste Version: Dashboard, Einträge, Projekte, Wochen-/Monatsübersicht, PDF-Export als Tätigkeitsnachweis.',
    ],
  },
]
