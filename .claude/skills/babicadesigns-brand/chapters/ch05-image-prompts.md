# Chapter 5: Image Prompt System — AI Illustration Reference

## Core Idea
Every AI-generated image for BabicADesigns follows a single master style instruction placed at the start of every prompt. The protagonist, palette, scenes, and formats are all pre-defined — prompting is assembly, not invention.

## Frameworks Introduced
- **Master Style Instruction** (use at beginning of EVERY prompt):
  > "clean flat cel-shading digital illustration; bold clean linework, flat color fills with soft gradient shading; NOT watercolor, NOT painterly, NOT photorealistic, NOT Pixar 3D; think high-quality editorial fashion illustration"
  - When to use: Every single image prompt, without exception, placed first
  - How: Paste this block verbatim, then add format + character + scene + mood + light

- **Quick Prompt Template**:
  `[Master Style] + [Format] + [Character] + [Scene description] + [Mood] + [Background] + [Light] + "Bold clean linework, flat color fills, soft gradient shading. No text in image."`

- **Three Signature Outfits** (character must wear one):
  - **Outfit A** (seated/indoor): white linen blouse + sage green wide-leg trousers
  - **Outfit B** (standing/outdoor): white linen blouse + flowy sage green midi skirt + brown leather sandals
  - **Outfit C** (desk/working): white linen blouse French-tucked into high-waisted sage green straight-leg trousers

## Key Concepts
- **Master Style**: Cel-shading editorial illustration — the visual language that unifies all brand imagery.
- **Extended illustration palette**: sage green `#8B9B7A`, dusty rose `#C4A096`, warm cream `#F5EEE6`, golden blonde `#F0C878`, muted terracotta `#C4784A`, Adriatic blue `#6A9AB0`
- **Protagonist description** (without reference photo):
  > "woman, long wavy light golden blonde hair, natural curvy body with real feminine proportions (NOT model-thin), confident and grounded, blue-green eyes, gold hoop earrings, delicate necklace, warm skin tone, late 30s energy, sophisticated but approachable"
- **Warm golden light from upper left always** — non-negotiable for all illustrated scenes.
- **Signature props**: copper džezva, pink peonies, marble table, white espresso cup, olive tree branches, wrought-iron balcony railings.
- **Adriatic backdrop elements**: stone walls, red-tiled rooftops, cypress trees, Adriatic Sea horizon, medieval fortifications.

## Reference Table — 10 Canonical Scenes

| # | Name | Format | Primary Use |
|---|---|---|---|
| 01 | Balcony Morning | 16:9 | Gentle Note covers, article headers |
| 02 | Couch with Laptop | 16:9 | The Drop covers |
| 03 | Baka Moment | 16:9 | Heritage/founder articles |
| 04 | Dalmatian Alley | 9:16 | Quote Cards |
| 05 | Desk by Window | 16:9 | Drop/Creator System covers |
| 06 | Writing at Terrace | 16:9 | Gentle Note/writer articles |
| 07 | Sunset Promenade | 9:16 | Quote Cards |
| 08 | Kava Close-Up | 1:1 | Social posts/GIFs |
| 09 | Content Distribution | 16:9 | Strategy articles |
| 10 | Baka Knows | 16:9 | Baka Knows WebApp |

## Reference Table — Format Specs

| Format | Dimensions | Use Cases |
|---|---|---|
| 16:9 | 1920×1080 | Substack covers, article headers |
| 9:16 | 1080×1920 | Instagram Stories, TikTok, Quote Cards |
| 1:1 | 1080×1080 | Instagram feed, GIFs, close-up details |

## Quote Card Specs
- Format: 9:16
- Background: scene illustration
- Text overlay: warm cream semi-transparent box (~85% opacity)
- Fonts: Caveat Bold (first line) + Caveat Regular; Poppins Light spaced caps (tags)
- Text color: dark sage green `#385048`
- Accent lines: dusty rose / sage / terracotta

## Anti-patterns
- **"NOT watercolor, NOT painterly, NOT photorealistic, NOT Pixar 3D"** — these must appear in the prompt to prevent the most common deviations.
- **Model-thin proportions**: The protagonist has natural curvy body. "NOT model-thin" must be specified.
- **Text in image**: Always end prompts with "No text in image." — AI generates unreadable text by default.
- **Wrong light direction**: Upper left only. Center or right lighting breaks the brand look.
- **Wrong palette**: Use the extended illustration palette, not CSS brand palette. They are calibrated differently for illustration.
- **Mixing real photography with illustrations**: These are separate tracks. Don't composite them.

## Worked Example
**Prompt for Scene 01 (Balcony Morning, 16:9 Gentle Note cover):**
> Clean flat cel-shading digital illustration; bold clean linework, flat color fills with soft gradient shading; NOT watercolor, NOT painterly, NOT photorealistic, NOT Pixar 3D; think high-quality editorial fashion illustration.
>
> 16:9 landscape format, 1920x1080.
>
> Woman, long wavy light golden blonde hair, natural curvy body with real feminine proportions (NOT model-thin), confident and grounded, blue-green eyes, gold hoop earrings, warm skin tone, late 30s energy, sophisticated but approachable. Wearing white linen blouse and sage green wide-leg trousers. Seated on a wrought-iron balcony chair, holding a white espresso cup with both hands. Marble table beside her with a copper džezva and a single pink peony in a white ceramic vase.
>
> Background: Adriatic coastal town, red-tiled rooftops, cypress trees, shimmering sea horizon, small island visible in distance. Mood: calm, contemplative, morning stillness. Warm golden light from upper left. Extended palette: sage green #8B9B7A, dusty rose #C4A096, warm cream #F5EEE6, golden blonde #F0C878.
>
> Bold clean linework, flat color fills, soft gradient shading. No text in image.

## Key Takeaways
1. Master Style Instruction goes first in every prompt — verbatim, never abbreviated.
2. The protagonist is always the same person: golden blonde, natural curvy proportions, late 30s, gold hoops.
3. Three outfits — A for seated/indoor, B for outdoor, C for desk work. Use exactly.
4. Warm golden light from upper left in every scene — the brand's visual signature.
5. Ten canonical scenes cover all content format needs — use these before inventing new ones.
6. Always end with "No text in image."

## Connects To
- **Ch 2**: The extended illustration palette derives from the 5-color brand palette
- **Ch 6**: Each content format (Drop, Gentle Note, Creator System) maps to specific canonical scenes
- **Real photos**: The actual founder photography shows the inspiration for the protagonist's appearance and signature looks
