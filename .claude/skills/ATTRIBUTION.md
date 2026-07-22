# Skill attribution

The skills under this directory are vendored, unmodified, from third-party sources
discovered via [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills).

| Skill | Source | License |
|---|---|---|
| `skill-creator` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/skill-creator) | Apache License 2.0 (see `skill-creator/LICENSE.txt`) |
| `codeql` | [trailofbits/skills](https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/codeql) (part of the `static-analysis` plugin) | CC BY-SA 4.0 |
| `semgrep` | [trailofbits/skills](https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/semgrep) (part of the `static-analysis` plugin) | CC BY-SA 4.0 |
| `sarif-parsing` | [trailofbits/skills](https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/sarif-parsing) (part of the `static-analysis` plugin) | CC BY-SA 4.0 |
| `audit-context-building` | [trailofbits/skills](https://github.com/trailofbits/skills/tree/main/plugins/audit-context-building/skills/audit-context-building) | CC BY-SA 4.0 |

Trail of Bits' `static-analysis` plugin bundles three independent skills
(`codeql`, `semgrep`, `sarif-parsing`); all three are included here since
together they make up what the awesome-agent-skills list calls "static-analysis".

CC BY-SA 4.0 license text: https://creativecommons.org/licenses/by-sa/4.0/

## Social media skills

The following 17 skills are vendored, unmodified, from
[charlie947/social-media-skills](https://github.com/charlie947/social-media-skills)
(MIT licensed). Each skill directory retains its own `LICENSE` copy.

| Skill | Description |
|---|---|
| `analytics-dashboard` | Turn a LinkedIn Analytics export into an interactive dashboard plus written recommendations |
| `content-matrix` | Generate 32+ LinkedIn post ideas from content pillars x formats (Justin Welsh matrix) |
| `gemini-carousel` | Generate a branded slide-by-slide LinkedIn carousel with Gemini |
| `gemini-infographic` | Generate a hand-drawn whiteboard-style infographic prompt with Gemini |
| `graphic-designer` | Create LinkedIn post graphics (HTML/CSS or AI-generated infographic) |
| `hook-generator` | Generate 6 clickbait-style LinkedIn hook variations for a topic |
| `newsletter-voice` | Build newsletter writing instructions from the user's voice profile (runs after `voice-builder`) |
| `niche-research` | Surface the 20 most relevant niche stories from the last 7 days via live browsing |
| `pinned-comment` | Write LinkedIn pinned comments + image prompts in the upstream author's own signature style |
| `post-formatter` | Turn a topic into a publish-ready LinkedIn post using PAS/AIDA/BAB/STAR/SLAY frameworks |
| `post-scorer` | Score a LinkedIn post draft against the user's own historical post performance (via Apify) |
| `post-writer` | Write LinkedIn posts that match the user's voice system |
| `profile-optimizer` | Rebuild a LinkedIn profile (headline, about, experience, image prompts) for conversions |
| `quote-post` | Two-step workflow for LinkedIn quote-graphic posts |
| `reels-scripting` | Turn a reference Instagram Reel into a new script (Apify scrape + Gemini analysis) |
| `voice-builder` | Build a personalised voice profile from an interview + writing samples |
| `youtube-thumbnail` | Generate a branded YouTube thumbnail prompt from a video title |

Notes:
- `pinned-comment` is written for the upstream author ("Charlie Hills") by name and produces content in his specific signature style — review before use.
- `reels-scripting` requires `APIFY_API_TOKEN` and `GOOGLE_AI_API_KEY` environment variables (Instagram scraping + Gemini video analysis).
- `post-scorer` requires an Apify token to pull the user's own post history.
- `niche-research` expects live browsing (Claude for Chrome or Playwright MCP) to scroll Reddit/X.
