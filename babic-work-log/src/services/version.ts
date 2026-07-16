export const APP_VERSION = '1.5.2'

/** Real build timestamp, injected via vite.config.ts's `define`. */
export const BUILD_DATE: string = __BUILD_DATE__

export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.5.2',
    date: '2026-07-16',
    changes: [
      'Sichtbares Debug-Log direkt in der App (unten am Bildschirmrand, erscheint nur wenn ein PDF-Export ausgeführt wird): zeigt jeden Schritt des Exports live an — ohne Mac oder Safari-Ferndebugging. Text lässt sich per Knopfdruck kopieren.',
      'iOS-Export weiter gehärtet: Der Fallback-Tab wird jetzt bereits beim Antippen des Buttons geöffnet (noch bevor das PDF erstellt wird) und erst danach mit dem fertigen PDF befüllt. Der vorherige Fallback öffnete den Tab erst nach der PDF-Erstellung — das geschieht zu spät und wird von Safaris Popup-Blocker abgefangen.',
    ],
  },
  {
    version: '1.5.1',
    date: '2026-07-16',
    changes: [
      'PDF-Export auf iOS Safari erneut repariert: Der letzte Fix (Vorab-Laden) reichte nicht aus. Ursache war grundsätzlicher — der Download-Mechanismus von jsPDF funktioniert auf iOS unabhängig vom Timing nicht zuverlässig. iOS erstellt das PDF jetzt als Datei und öffnet automatisch die native Teilen-Funktion (Speichern in Dateien, AirDrop, etc.); falls nicht verfügbar, öffnet sich das PDF stattdessen in einem neuen Tab mit Safaris eigener Teilen-Schaltfläche.',
      'Temporäre Konsolen-Protokollierung entlang des gesamten Export-Ablaufs (Tastendruck, Einträge gefunden, PDF erstellt, Speichern aufgerufen) zur Fehlersuche bei zukünftigen Problemen.',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-07-16',
    changes: [
      'PDF-Export repariert: Auf iOS Safari brach der Download durch eine Zeitproblematik zwischen Tastendruck und PDF-Erstellung häufig kommentarlos ab. Der PDF-Baustein wird jetzt vorab geladen, sobald die Wochen-/Monatsübersicht oder der neue Berichts-Assistent geöffnet wird — der Export läuft dadurch zuverlässig, auch auf dem iPhone.',
      'Berichte: neuer Berichts-Assistent (Dashboard → „Berichte", oder direkt aus einem Projekt heraus) mit zwei Berichtstypen.',
      'Business Report: alle Projekte mit Einträgen im gewählten Zeitraum, inklusive Stunden und Beträgen — für die eigene Buchhaltung.',
      'Kundenbericht: ein einzelnes Projekt als chronologische Tages-Zeitleiste (Datum → Tätigkeiten), ohne Finanzangaben — zum Weitergeben an Kunden. Stundensatz, Beträge und Summe lassen sich optional zuschalten.',
      'Zeitraum wählbar: Diese Woche, Dieser Monat oder ein freier Zeitraum, für beide Berichtstypen.',
      'Architektur für künftige Rechnungen, Unterschriften, Anhänge und Kundenfreigabe in der Berichtskonfiguration vorbereitet (noch ohne eigene Funktion).',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-07-16',
    changes: [
      'Zahlungen: neuer eigenständiger Zahlungseintrag (Kunde, Betrag, Zahlungsdatum, Zahlungsart, Methode, Kategorie, Notiz), unabhängig von einzelnen Arbeitseinträgen — dritter Reiter „Zahlungen" unter Kunden & Projekte.',
      'Abrechnungszeitraum: Zahlungen lassen sich auf ein Einzeldatum oder einen Abrechnungsmonat buchen, sodass eine monatliche Pauschale nicht mehr an ein einzelnes Datum gebunden ist — mehrere Zahlungen (z. B. Pauschale + Zusatzzahlungen) im selben Monat werden automatisch zusammengeführt.',
      'Kunden-Finanzeinstellungen: Einkommensmodell (Stundenbasiert/Festpreis/Monatliche Pauschale), Standard-Stundensatz oder -Pauschale und Standard-Abrechnungszeitraum lassen sich pro Kunde im Profil hinterlegen — neue Zahlungen übernehmen den Abrechnungszeitraum automatisch.',
      'Dashboard: neue Business-Finance-Karte (Erwartet/Erhalten/Offen/Zusatzzahlungen für den laufenden Monat) und eine Umsatzentwicklung-Karte (Vergleich zum Vormonat) — ergänzen die bestehende, stundenbasierte Business-Health-Karte.',
      'Backup: Zahlungen und Kunden-Finanzeinstellungen sind jetzt Teil von Export, Import und Zusammenführen — ältere Backups ohne diese Daten werden weiterhin unterstützt.',
      'Architektur: neues eigenständiges Finance-Modul (Models, Storage, Berechnungen, Hooks, Komponenten) unter src/modules/finance — referenziert Kunden/Projekte nur per ID, damit künftige Module denselben Aufbau verwenden können. Interner Umbenennung: die bisherige Teilzahlung pro Eintrag heißt jetzt EntryPayment, um sie von der neuen eigenständigen Zahlung zu unterscheiden.',
    ],
  },
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
