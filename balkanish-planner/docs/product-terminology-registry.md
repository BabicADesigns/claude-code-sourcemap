# Product Terminology Registry

Canonical labels for every user-facing concept across all four locales.
Source of truth for UI copy, i18n keys, and docs.

---

## Conventions

- **Canonical (EN)**: The official label to use in all English UI copy and docs.
- **Issue**: Current discrepancy between canonical and actual rendering.
- **i18n key**: The key path used in locale JSON files.

---

## Navigation Concepts

### Hidden Gems
| Locale | Label | i18n Key |
|---|---|---|
| EN | Hidden Gems | `nav.hiddenGems` |
| DE | Versteckte Schätze | `nav.hiddenGems` |
| IT | Gemme Nascoste | `nav.hiddenGems` |
| HR | Skrivena Blaga | `nav.hiddenGems` |

**Issue**: "Destinations" appears as a label in some internal references. Canonical is "Hidden Gems" for the user-facing surface.

---

### Food Finds
| Locale | Label | i18n Key |
|---|---|---|
| EN | Food Finds | `nav.foodFinds` |
| DE | Kulinarische Entdeckungen | `nav.foodFinds` |
| IT | Scoperte Culinarie | `nav.foodFinds` |
| HR | Gastro Otkrića | `nav.foodFinds` |

---

### Culture Notes
| Locale | Label | i18n Key |
|---|---|---|
| EN | Culture Notes | `nav.cultureNotes` |
| DE | Kulturnotizen | `nav.cultureNotes` |
| IT | Note di Cultura | `nav.cultureNotes` |
| HR | Kulturne Bilješke | `nav.cultureNotes` |

---

### Secret Swap
| Locale | Label | i18n Key |
|---|---|---|
| EN | Secret Swap | `nav.secretSwap` |
| DE | Geheimtipp-Tausch | `nav.secretSwap` |
| IT | Scambio di Segreti | `nav.secretSwap` |
| HR | Tajna Razmjena | `nav.secretSwap` |

**Issue**: UI section titles use "Secret Swaps" (plural); canonical nav is "Secret Swap" (singular). Align to singular throughout.

---

### Matchmaker
| Locale | Label | i18n Key |
|---|---|---|
| EN | Matchmaker | `nav.matchmaker` |
| DE | Reise-Matchmaker | `nav.matchmaker` |
| IT | Matchmaker di Viaggio | `nav.matchmaker` |
| HR | Spajalica Putovanja | `nav.matchmaker` |

---

### Planner (AI Planner)
| Locale | Label | i18n Key |
|---|---|---|
| EN | Planner | `nav.planner` |
| DE | KI-Planer | `nav.planner` |
| IT | Pianificatore IA | `nav.planner` |
| HR | AI Planer | `nav.planner` |

**Note**: The full name is "AI Trip Planner" or "Balkanish AI Planner" in editorial contexts. Nav abbreviates to "Planner" which is correct.

---

### Postcards
| Locale | Label | i18n Key |
|---|---|---|
| EN | Postcards | `nav.postcards` |
| DE | Postkarten | `nav.postcards` |
| IT | Cartoline | `nav.postcards` |
| HR | Razglednice | `nav.postcards` |

---

### Guides
| Locale | Label | i18n Key |
|---|---|---|
| EN | Guides | `nav.guides` |
| DE | Reiseführer | `nav.guides` |
| IT | Guide | `nav.guides` |
| HR | Vodiči | `nav.guides` |

---

## Auth / Account Concepts

### My Balkans
| Locale | Label | i18n Key |
|---|---|---|
| EN | My Balkans | `actions.myBalkans` |
| DE | Mein Balkan | `actions.myBalkans` |
| IT | I Miei Balcani | `actions.myBalkans` |
| HR | Moj Balkan | `actions.myBalkans` |

**Canonical use**: Saved content workspace. Sections: Hidden Gems (saved), Food Finds (saved), Culture Notes (saved), Secret Swaps (saved), Postcards (saved), My Finds. Does **not** contain AI Itineraries (canonical home: My Trips).

---

### My Trips
| Locale | Label | i18n Key |
|---|---|---|
| EN | My Trips | `actions.myTrips` |
| DE | Meine Reisen | `actions.myTrips` |
| IT | I Miei Viaggi | `actions.myTrips` |
| HR | Moja Putovanja | `actions.myTrips` |

**Canonical use**: Trip planning and lifecycle workspace. Sections: Recent Trip, All Trips, Delivery History. Does **not** contain saved content (canonical home: My Balkans).

---

## Trip-Level Concepts

### Live Trip (Today View)
| Locale | Canonical Label | Notes |
|---|---|---|
| EN | Live Trip | `navigation.liveTrip` |
| DE | Live-Reise | `navigation.liveTrip` |
| IT | Viaggio in Corso | `navigation.liveTrip` |
| HR | Aktivno Putovanje | `navigation.liveTrip` |

**Resolved (Phase 29)**: Button renamed from "Today" → "Live Trip". i18n key added to all 4 locales.

---

### Trip Companion
| Locale | Canonical Label | i18n Key |
|---|---|---|
| EN | Trip Checklist | `navigation.companion` |
| DE | Reise-Checkliste | `navigation.companion` |
| IT | Lista di Viaggio | `navigation.companion` |
| HR | Lista za putovanje | `navigation.companion` |

**Note (Phase 30)**: Navigation label uses "Trip Checklist" (action-oriented). Page eyebrow uses "Trip Companion" (product name). Both refer to `/trips/[id]/companion`. This intentional distinction: the eyebrow names the feature; the nav link names what you do there.

---

### Trip Reflection
| Locale | Canonical Label | i18n Key |
|---|---|---|
| EN | Reflect on this trip | `navigation.reflectOnTrip` |
| DE | Diese Reise reflektieren | `navigation.reflectOnTrip` |
| IT | Rifletti su questo viaggio | `navigation.reflectOnTrip` |
| HR | Razmisli o ovom putovanju | `navigation.reflectOnTrip` |

**Resolved (Phase 29/30)**: Card button renamed from "Remember this trip" → "Reflect on this trip" (i18n key `navigation.reflectOnTrip`). Page eyebrow uses "Trip Reflection" as product name. Navigation label is action-oriented ("Reflect on this trip").

---

### My Finds (Inspiration Captures)
| Locale | Canonical Label | Notes |
|---|---|---|
| EN | My Finds | Dashboard section eyebrow and title (Phase 30 canonical) |
| DE | Meine Funde | Not in common.json — future need |
| IT | Le Mie Scoperte | Not in common.json — future need |
| HR | Moja Otkrića | Not in common.json — future need |

**Canonical (Phase 30)**: "My Finds" — both eyebrow and section title in My Balkans dashboard. "My Finds" is used for the `/my-balkans/finds` page link CTA.

**Internal code identifiers** (do not change — no DB migration):
- DB table: `inspiration_captures`
- Type: `InspirationCapture`
- Data function: `getInspirationCaptures()`
- Resurfacing namespace: "Travel Finds" (internal; never user-facing)

**Resolved label conflicts (Phase 30)**:
- Old My Balkans eyebrow: "Inspiration" → now "My Finds"
- Old My Balkans section title: "My Balkan Finds" → now "My Finds"
- `/my-balkans/finds` page title remains "My Finds" (was already correct)

---

### Back to My Trips
| Locale | Canonical Label | i18n Key |
|---|---|---|
| EN | ← My Trips | `navigation.backToMyTrips` |
| DE | ← Meine Reisen | `navigation.backToMyTrips` |
| IT | ← I Miei Viaggi | `navigation.backToMyTrips` |
| HR | ← Moja Putovanja | `navigation.backToMyTrips` |

**Issue (P1)**: Hardcoded English in companion and reflection pages.

---

### Today View (navigation link from reflection)
| Locale | Canonical Label | i18n Key |
|---|---|---|
| EN | Today View | `navigation.todayView` |
| DE | Tagesansicht | `navigation.todayView` |
| IT | Vista di Oggi | `navigation.todayView` |
| HR | Pogled Danas | `navigation.todayView` |

---

## Product Name Concepts

### Product Name
| Context | Canonical Label | Current rendering | Issue |
|---|---|---|---|
| Site header logo text | Balkanish Planner | "BabicADesigns" | P1 — wrong name shown |
| Page metadata title | Balkanish | Varies | Consistent |
| Footer copyright | BabicADesigns | "BabicADesigns" | Correct — studio name |
| Tagline | The Balkanish AI Way | "The Balkanish AI Way" | Consistent |

---

## Lifecycle State Labels (internal → user-facing)

These internal type values (`TripLifecycle`) must NEVER appear in user-facing copy:

| Internal value | User-facing equivalent |
|---|---|
| `PLANNING` | (no badge; pre-departure) |
| `PRE_TRIP` | (access Live Trip CTA) |
| `DEPARTURE_DAY` | (access Live Trip CTA) |
| `IN_TRIP` | (access Live Trip CTA) |
| `COMPLETED` | (access Reflect CTA) |

---

## Suppression / Resurfacing Concepts (internal only)

These terms are intentionally NOT shown to users:

- `ResurfacingReason` values — shown as human reason labels (e.g., "Near your next stop")
- `DISMISS` / `NOT_THIS_TRIP` / `REMIND_ME_LATER` — shown as button labels (i18n'd in `resurfacing` namespace)
- `InspirationCapture` — internal type; user sees "My Finds"

---

## Terminology Issues Summary

| Concept | Current state | Canonical fix |
|---|---|---|
| Product name in header | "BabicADesigns" | "Balkanish Planner" |
| Live Trip button | "Today" | "Live Trip" |
| Post-trip button | "Remember this trip" | "Reflect on this trip" |
| My Finds section eyebrow | "Inspiration" | "My Finds" |
| Travel Finds vs. My Balkan Finds | Two names | "My Finds" / "My Balkan Finds" |
| Secret Swap singular/plural | Mixed | Always singular: "Secret Swap" |
| Back link in companion | Hardcoded "← Back to My Trips" | i18n key `navigation.backToMyTrips` |
