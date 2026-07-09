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

**Canonical use**: Personal content dashboard (saved destinations, food finds, culture notes, swaps, postcards, itineraries, travel finds).

---

### My Trips
| Locale | Label | i18n Key |
|---|---|---|
| EN | My Trips | `actions.myTrips` |
| DE | Meine Reisen | `actions.myTrips` |
| IT | I Miei Viaggi | `actions.myTrips` |
| HR | Moja Putovanja | `actions.myTrips` |

**Canonical use**: Trip management dashboard (itineraries, per-trip tools, delivery history, trip-adjacent favorites).

---

## Trip-Level Concepts

### Live Trip (Today View)
| Locale | Canonical Label | Notes |
|---|---|---|
| EN | Live Trip | Button currently labeled "Today" — too ambiguous |
| DE | Live-Reise | Not yet in common.json — future need |
| IT | Viaggio in Corso | Not yet in common.json — future need |
| HR | Aktivno Putovanje | Not yet in common.json — future need |

**Issue (P0)**: The "Today" button label in `saved-itineraries.tsx` doesn't communicate what it does. Canonical label is "Live Trip".
**i18n key to add**: `navigation.liveTrip`

---

### Trip Companion
| Locale | Canonical Label | Notes |
|---|---|---|
| EN | Trip Companion | Consistent; page uses this as eyebrow label |
| DE | Reisebegleiter | Not yet in common.json |
| IT | Compagno di Viaggio | Not yet in common.json |
| HR | Pratilac Putovanja | Not yet in common.json |

---

### Trip Reflection
| Locale | Canonical Label | Notes |
|---|---|---|
| EN | Trip Reflection | Page uses "Trip Reflection" as eyebrow; button on card says "Remember this trip" |
| DE | Reisereflexion | Not yet in common.json |
| IT | Riflessione di Viaggio | Not yet in common.json |
| HR | Razmišljanje o Putovanju | Not yet in common.json |

**Issue (P1)**: "Remember this trip" (button) vs "Trip Reflection" (page eyebrow) — same feature, different language. Align to "Reflect on this trip" for the button.

---

### My Balkan Finds (Inspiration Captures)
| Locale | Canonical Label | Notes |
|---|---|---|
| EN | My Balkan Finds | Page title and canonical label |
| DE | Meine Balkan-Funde | Not in common.json |
| IT | Le Mie Scoperte Balcaniche | Not in common.json |
| HR | Moja Balkanska Otkrića | Not in common.json |

**Issue (P1)**: Three different labels in use for the same concept:
- Nav/My Balkans dashboard: "My Balkan Finds"
- Resurfacing namespace: "Travel Finds" (internal)
- My Balkans dashboard eyebrow: "Inspiration" (vague)
Canonical user-facing label: **"My Finds"** (short) or **"My Balkan Finds"** (full).

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
