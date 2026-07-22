export const APP_VERSION = '1.8.2'

/** Real build timestamp, injected via vite.config.ts's `define`. */
export const BUILD_DATE: string = __BUILD_DATE__

export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.8.2',
    date: '2026-07-22',
    changes: [
      'Fehler behoben: Wenn beim Erstellen eines PDFs ein Problem beim Laden des PDF-Bausteins auftrat (z. B. weil die Seite schon länger geöffnet war und zwischenzeitlich eine neue Version veröffentlicht wurde), öffnete sich stillschweigend ein leerer Tab ("about:blank") ohne jede Fehlermeldung. Fehler werden jetzt erkannt, der leere Tab wird automatisch geschlossen, und es erscheint ein Hinweis, die Seite neu zu laden und es erneut zu versuchen — für Wochen-/Monatsübersicht und den Berichts-Assistenten.',
    ],
  },
  {
    version: '1.8.1',
    date: '2026-07-22',
    changes: [
      'PDF-Export auf iOS repariert: Wenn die native Teilen-Funktion nicht zum Ziel führte, öffnete sich zwar ein Tab mit dem Dateinamen, aber ohne Inhalt. Ursache: der Tab wurde auf eine Blob-Adresse verwiesen, die nur im ursprünglichen Browser-Tab gültig ist — Safari auf dem iPhone kann solche Adressen in einem anderen Tab oft nicht laden. Der Tab wird jetzt stattdessen auf eine in sich geschlossene PDF-Adresse verwiesen, die keine Tab-übergreifende Referenz mehr benötigt.',
      'Zusätzlicher Fehler behoben: Wenn die native Teilen-Funktion fehlschlug, war der Ausweich-Tab zu diesem Zeitpunkt bereits vorschnell geschlossen worden — dadurch griff die Ausweichlösung ins Leere. Der Tab bleibt jetzt offen, bis klar ist, ob die Teilen-Funktion tatsächlich funktioniert hat.',
    ],
  },
  {
    version: '1.8.0',
    date: '2026-07-22',
    changes: [
      'Fehler behoben: "Offene Forderungen" im Dashboard zeigte für Kunden mit monatlicher Pauschale (z. B. Retainer) weiterhin einen offenen Betrag an, obwohl die Pauschale bereits vollständig bezahlt wurde — Arbeitsstunden wurden zusätzlich zur Pauschale mitgezählt, statt als durch sie abgedeckt zu gelten.',
      'Neues Forderungsmodell: Jede Forderung hat jetzt Kunde, Projekt, Zeitraum, Betrag und Status (Offen / Teilweise bezahlt / Bezahlt). Bei Pauschalkunden entsteht eine Forderung pro Monat (Pauschalbetrag vs. tatsächlich erhaltene Zahlungen); bei allen anderen bleibt es bei der bewährten Abrechnung pro Eintrag. "Offene Forderungen" zählt nur noch Forderungen mit Status Offen oder Teilweise bezahlt — vollständig bezahlte Forderungen fließen nicht mehr ein.',
      'Wochen- und Tagesübersicht ("Business Health", "Tagesabschluss") wurden für dieselbe Korrektur angepasst, damit "Offene Forderungen" überall im Dashboard konsistent ist.',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-07-22',
    changes: [
      'Neues App-Icon: das offizielle BabicADesigns-Motiv für Homescreen, Browser-Tab und Installationsdialog.',
      'Hinweis in der installierten App, wenn noch keine Arbeitseinträge sichtbar sind: iOS teilt den Speicher zwischen Safari und der installierten Homescreen-App nicht immer, wodurch bereits eingegebene Daten dort vorhanden, aber hier nicht sichtbar sein können. Der Hinweis erklärt das und führt direkt zum Backup-Import.',
    ],
  },
  {
    version: '1.6.2',
    date: '2026-07-20',
    changes: ['Einstellungen: Namensnennung und Copyright-Hinweis ("Designed by: BabicADesigns" / "© BabicADesigns. All rights reserved.") unter dem Änderungsprotokoll ergänzt.'],
  },
  {
    version: '1.6.1',
    date: '2026-07-17',
    changes: [
      'Kundenbericht wieder als Tabelle: dieselbe bewährte Darstellung wie beim Business Report (automatische Zeilenhöhen, automatischer Seitenumbruch, abwechselnde Zeilenfarben) statt der Karten-Ansicht — weiterhin ohne Spalte "Betrag" und ohne Preis in der Summenzeile ("Gesamt: 8,0 h" statt "Gesamt: 8,0 h • 80,00 €"). Business Report unverändert.',
      'Absicherung gegen Datenverlust: Die App erstellt keine Beispieldaten mehr, wenn Kunden/Projekte leer erscheinen, obwohl dieser Browser die App bereits zuvor genutzt hat — das verhindert, dass ein vorübergehendes Lesefehler echte Daten stillschweigend durch Demo-Daten ersetzt. Bei einem tatsächlich neuen Gerät werden weiterhin Beispiel-Kunden angelegt.',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-07-17',
    changes: [
      'Kundenbericht komplett neu gestaltet: jede Sitzung erscheint jetzt als eigene, sauber umrandete Karte mit Datum, Kategorie, Dauer und stichpunktartigen Aktivitäten — statt als reiner Fließtext.',
      'Kundenbericht zeigt grundsätzlich keine Preise, Stundensätze oder Beträge mehr — die Option dafür wurde entfernt, da dieser Bericht ausschließlich für Kunden gedacht ist. Der Business Report bleibt unverändert vollständig mit Finanzangaben.',
      'Jede Sitzungskarte wächst automatisch mit dem Inhalt (auch bei langen oder mehrzeiligen Notizen) und erzwingt bei Bedarf automatisch einen Seitenumbruch, ohne Überlappungen.',
    ],
  },
  {
    version: '1.5.3',
    date: '2026-07-16',
    changes: [
      'Kundenbericht: Layout-Fehler behoben — lange oder mehrzeilige Notizen ließen Datumsüberschriften und Einträge übereinander liegen, weil die Zeilenhöhe nach umgebrochenem Text nicht korrekt berücksichtigt wurde. Die Timeline berechnet jetzt für jeden Eintrag die tatsächlich benötigte Höhe (inklusive Zeilenumbruch), bevor der nächste Abschnitt platziert wird — keine Überlappung mehr, sauberer Zeilenumbruch mit hängendem Einzug, konsistente Abstände zwischen Einträgen und Tagen, automatischer Seitenumbruch, der Datumsüberschriften nicht mehr verwaist am Seitenende stehen lässt.',
    ],
  },
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
