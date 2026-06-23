# Image Direction — BabicADesigns / Balkanish Planner

**Purpose:** This is the brief a photographer, photo editor, or AI image-generation prompt should follow for every image on the site. The goal is one consistent feeling across every section: it should never look like stock photography, a listing site, or a destination-marketing brochure.

**Visual references:** *Kinfolk*, *Cereal Magazine*, *Cabana Magazine*, *Monocle Travel Guides*. Warm Mediterranean light, authentic local moments, imperfect beauty, quiet luxury, coastal texture (stone, olive trees, linen, sea, cafés), human presence that never looks staged.

**Implementation note:** This codebase has no photography pipeline or image-generation capability — every image is a `picsum.photos` placeholder. The house look above is therefore enforced in code via the `EditorialImage` component and `.editorial-frame` CSS utility (`components/brand/editorial.tsx`, `app/globals.css`): a warm rose→sage colour-grade overlay plus a faint film-grain layer, applied consistently to every photo on the site. This is a deliberate stand-in for a real photo system — when actual photography is sourced, shoot/select to the brief below and the CSS treatment can be lightened or retired per image.

---

## 1. The House Look — applies everywhere

- **Light:** Golden hour or soft overcast. No harsh midday sun, no flat studio light. If a shadow is visible, it should be long, not short.
- **Color grade:** Warm, slightly desaturated. Greens lean sage, not neon. Stone and skin tones stay warm. Blacks are soft (lifted), never crushed. Think film stock, not phone-camera HDR.
- **Grain/texture:** A faint, fine grain is welcome — it reads as honest and unprocessed rather than algorithmically smoothed.
- **Composition:** Imperfect framing on purpose. A slightly off-center horizon, a person's elbow at the edge of frame, a doorway not quite squared — these read as *witnessed*, not staged.
- **People:** When people appear, they are mid-action (pouring, laughing, reaching for something) and never looking at the camera. No posed tourists, no stock-photo smiles. Hands, backs, profiles — the moment, not the portrait.
- **What to avoid everywhere:** drone shots that could be stock footage, infinity-pool clichés, anything symmetrical and "Instagrammable," visible logos/branding on objects, oversaturated turquoise water, lens flare, any image that could be swapped onto a competitor's site without anyone noticing.

## 2. Hidden Gems

**Mood:** Quiet, slightly secretive, like you stumbled onto it rather than were led there.

- **Framing:** Wide enough to show the place is empty or near-empty — that absence of crowds *is* the story, so leave room in the frame for it to read.
- **Time of day:** Early morning or late evening, when the light is low and the place would otherwise be busy in daytime stock photography. Reinforces "you'd have to actually go early to get this."
- **Subject choice:** Favor the imperfect, lived-in detail over the postcard view — a chipped step, laundry on a line, a cat asleep on a wall — alongside the wider landscape, not instead of it.
- **Editing:** Slightly cooler shadows, warm highlights. Let stone and water keep their real color rather than punching up the blue.

## 3. Food Finds

**Mood:** Hungry, unfussy, like a photo someone took right before eating, not a food-stylist's set.

- **Framing:** Close, a little messy. Crumbs, a hand reaching in, steam still rising. Plates don't need to be centered or fully visible — let the table tell the story (a half-poured glass of wine, a torn piece of bread).
- **Setting:** Real surfaces — checkered tablecloths, marble konoba counters, plastic chairs on a terrace — never a white studio backdrop.
- **Light:** Warm and a little low, like indoor tavern light or late lunch sun through a window. Avoid the blown-out brightness of food-blog photography.
- **Editing:** Push warmth into the highlights (browns, golds) rather than cool blue-white "clean eating" tones.

## 4. Culture Notes

**Mood:** Reflective, a little documentary, respectful — these images sit next to stories about identity, history, and ritual, so nothing should feel like set decoration.

- **Framing:** Medium shots that include context — hands doing something specific (pouring rakija, kneading dough, playing an instrument), a doorway, a worn object — rather than abstract "cultural" iconography.
- **Subject choice:** Real, specific objects and gestures over generic symbols. A particular grandmother's kitchen, not a generic "old woman cooking" stock shot.
- **Light:** Can be moodier and lower-contrast than other sections — late afternoon indoor light, window light, the kind that suits a story being told rather than a place being sold.
- **Editing:** Slightly desaturated, warm-neutral. Avoid editorial filters that flatten skin tones or add stylized vignettes — these images should feel observed, not designed.

## 5. Secret Swap

**Mood:** A visual "before/after" without ever feeling like a comparison chart — the famous place and its alternative should each get their own honest portrait.

- **Framing:** Pair images at a similar scale and angle so the *substitution* reads clearly (e.g., both a wide harbor view, both golden hour) without literally matching composition — that would feel gimmicky.
- **The famous spot:** Shown at its most crowded-but-real moment — not exaggerated, just honest (a full promenade, a line for the viewpoint). This is the only section where crowds are allowed in frame, because naming the trade-off is the point.
- **The alternative:** Shown calm, spacious, unhurried — reinforcing why it's the better trade, without needing caption text to explain it.
- **Editing:** Keep both images in the same color grade as the rest of the site — the contrast should come from content (crowd vs. calm), not from a colder/warmer split-edit trick.

## 6. Homepage Hero

**Mood:** The one image that has to do the most work — it should read as a single, specific moment, not a generic "Croatia coastline" banner.

- **Framing:** Wide, but anchored by one concrete detail in the foreground (stone texture, a boat line, café chairs) so it doesn't collapse into wallpaper.
- **Light:** Golden hour, non-negotiable — this is the first impression of "warm Mediterranean light, quiet luxury."
- **Editing:** Slightly heavier vignette than other sections is acceptable here, since type sits on top of it.

## 7. Destination Pages

**Mood:** Feature-article opener, not a listing thumbnail — the hero should feel like the first spread of a magazine story.

- **Framing:** One strong establishing image per destination; favor a human-scale detail (a doorway, a fishing boat, a café table) over the postcard wide shot whenever one exists.
- **Pairing with text:** Pull quotes and "what locals know" callouts should interrupt the image rhythm rather than always trailing the text block — alternate placement page to page so the format doesn't feel templated.

## 8. Matchmaker & Postcards

**Mood:** Lighter and more playful than the rest of the site — this is where the brand can wink a little.

- **Matchmaker:** Treat result imagery the same as Hidden Gems (quiet, specific, uncrowded) — it's still a destination recommendation, just arrived at differently.
- **Postcards:** Images here are framed inside the `PostcardFrame` component (deckled cream border, corner travel stamp, slight tilt) — the photo itself can be a simple, centred, single-subject shot, since the frame is doing the styling work, not the crop.

## 9. Technical Specs

- **Aspect ratios in use:** 4:3 for grid cards (Hidden Gems, Food Finds, Culture Notes), 3:4 for Premium Guides covers, 16:9–ish wide crops for hero banners.
- **Minimum resolution:** 1200px on the long edge for cards, 1920px for hero banners.
- **File format:** WebP or optimized JPEG; no visible compression artifacts in skies or skin tones.
- **Alt text:** Always descriptive and specific to the actual image content (not the page topic) — see existing `alt` props in `DestinationCard`, `FoodFindCard`, etc. as the pattern to continue.

## 7. Quick Gut-Check

Before approving any image: would this photo look out of place in a tourism board's Instagram feed? If the honest answer is "no, it would fit right in," it's the wrong image for this brand.
