# Meta / Instagram API — Setup für BabicA Designs

## Voraussetzungen

1. **Instagram Business Account** (oder Creator Account)
2. **Facebook Seite**, die mit dem Instagram Account verknüpft ist
3. **Meta App** auf [developers.facebook.com](https://developers.facebook.com)

---

## Schritt 1: Meta App anlegen

1. Gehe zu [developers.facebook.com](https://developers.facebook.com) → "Meine Apps" → "App erstellen"
2. Wähle **"Business"** als App-Typ
3. App-Name: z. B. `BabicA Designs Analytics`
4. Notiere dir **App-ID** und **App-Secret**

---

## Schritt 2: Instagram Graph API aktivieren

In deiner App unter **Produkte hinzufügen**:
- "Instagram Graph API" hinzufügen
- Unter "Rollen" → "Tester" → deinen Instagram Account als Tester hinzufügen

---

## Schritt 3: Berechtigungen (Permissions) konfigurieren

Benötigte Permissions für die einzelnen Funktionen:

| Funktion | Permission |
|---|---|
| Account-Info & Posts lesen | `instagram_basic` |
| Analytics / Insights | `instagram_manage_insights` |
| Posts veröffentlichen | `instagram_content_publish` |
| Kommentare verwalten | `instagram_manage_comments` |
| Erwähnungen lesen | `instagram_manage_mentions` |
| Ads-Performance | `ads_read` |
| Ads verwalten | `ads_management` |
| Facebook Seiten-Daten | `pages_read_engagement` |

---

## Schritt 4: Access Token generieren

### Option A: Graph API Explorer (zum Testen)
1. Öffne [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Wähle deine App
3. Klicke "Generate Access Token" und wähle alle benötigten Permissions
4. Kopiere den **User Access Token**

### Option B: Long-Lived Token (für Produktion, ~60 Tage gültig)
```bash
curl -X GET \
  "https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

### Option C: System User Token (permanent, empfohlen für Automatisierung)
Im Meta Business Manager → "System-Benutzer" → neuen System-Benutzer anlegen → Token generieren

---

## Schritt 5: Instagram Business Account ID finden

```bash
curl "https://graph.facebook.com/v21.0/me/accounts?fields=instagram_business_account&access_token=DEIN_TOKEN"
```

Die `id` aus `instagram_business_account` ist deine `IG_USER_ID`.

---

## Schritt 6: Projekt einrichten

```bash
cd meta-instagram
cp .env.example .env
# .env mit deinen Werten befüllen

npm install
```

## Beispiele ausführen

```bash
# Analytics Dashboard
npm run example:analytics

# Hashtag-Recherche
npm run example:hashtags

# Ads Performance
npm run example:ads

# Kommentar-Management
npm run example:comments

# Content veröffentlichen
npm run example:publish
```

---

## Was du damit für dein Business machen kannst

### Analytics & Reporting
- Tägliche/wöchentliche Reichweiten- und Impressions-Reports
- Besten Content identifizieren (was funktioniert am besten?)
- Follower-Wachstum tracken
- Demografische Daten deiner Zielgruppe auswerten

### Content-Strategie
- Hashtag-Performance analysieren → welche Hashtags bringen Reichweite?
- Konkurrenz-Hashtags beobachten → was posten andere in deiner Branche?
- Beste Posting-Zeiten ermitteln (über Insights)

### Community Management
- Kommentare automatisch moderieren
- Spam erkennen und verstecken
- Erwähnungen und Tags tracken → potenzielle Kooperationen finden
- Automatische Antworten auf häufige Fragen (mit KI erweitern)

### Content Publishing
- Posts, Reels und Karussells automatisch veröffentlichen
- Content-Kalender → vorgeplante Posts (in Kombination mit z. B. Google Calendar API)
- Design-Previews automatisch aus Canva/Figma-Exports posten

### Ads / Marketing
- Kampagnen-Performance überwachen
- Budget-Tracking: wie viel gibst du aus und was bekommst du dafür?
- ROI-Berechnung für einzelne Kampagnen
- Automatisch Kampagnen pausieren, wenn Budget überschritten

---

## Wichtige Limits (Meta API)

| API | Limit |
|---|---|
| Graph API Calls | 200 Calls/Stunde pro Token |
| Content Publishing | 50 Posts/Tag pro Account |
| Hashtag-Suche | 30 unique Hashtags / 7 Tage |
| Stories | keine Publishing-API (nur lesen) |
| Instagram DMs | eingeschränkt, nur Business-Konten |
