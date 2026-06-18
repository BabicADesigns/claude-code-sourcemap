# Claude Code (Research Preview) - 0.2.8 with extracted source maps

# NOTE: I'm not working on this repo, this is the original source. Fork is at https://github.com/dnakov/anon-kode


![](https://img.shields.io/badge/Node.js-18%2B-brightgreen?style=flat-square)

Claude Code is an agentic coding tool that lives in your terminal, understands your codebase, and helps you code faster by executing routine tasks, explaining complex code, and handling git workflows - all through natural language commands.

Some of its key capabilities include:

- Edit files and fix bugs across your codebase
- Answer questions about your code's architecture and logic
- Execute and fix tests, lint, and other commands
- Search through git history, resolve merge conflicts, and create commits and PRs

**Learn more in the [official documentation](https://docs.anthropic.com/en/docs/agents/claude-code/introduction)**.

## Project skills

This repo vendors third-party Claude Code skills under `.claude/skills/`. Each skill is a self-contained `SKILL.md` plus the scripts/references it needs — Claude Code picks them up automatically from that directory.

### ai-marketing-skills

22 marketing/sales automation skills vendored from [ericosiu/ai-marketing-skills](https://github.com/ericosiu/ai-marketing-skills) (MIT licensed). Most require Python dependencies (each skill's own `requirements.txt`) and API keys for the services they integrate with (set up per-skill via `.env`).

| Skill | What it does |
|---|---|
| [`autoresearch`](.claude/skills/autoresearch) | Karpathy-inspired optimization loops for conversion content — generates 50+ variants, scores them with an expert panel, and evolves winners |
| [`clone-site`](.claude/skills/clone-site) | Clones any website into a pixel-perfect Next.js replica using parallel builder agents |
| [`closed-loop-analytics-upgrade`](.claude/skills/closed-loop-analytics-upgrade) | Upgrades marketing/SEO/revenue skills so changes are judged by platform analytics instead of vibes |
| [`content-eval`](.claude/skills/content-eval) | Generates and scores content ideas with an expert panel into a ranked content menu |
| [`content-ops`](.claude/skills/content-ops) | Quality scoring via expert panels, editorial workflows, and quote mining |
| [`conversion-ops`](.claude/skills/conversion-ops) | CRO audits for landing pages and survey-to-lead-magnet generation |
| [`deck-generator`](.claude/skills/deck-generator) | AI-generated slide decks with consistent visual styles |
| [`finance-ops`](.claude/skills/finance-ops) | AI CFO workflows — cost analysis, estimates, and scenario modeling |
| [`growth-engine`](.claude/skills/growth-engine) | Autonomous marketing experiments with bootstrap/Mann-Whitney statistical testing and weekly scorecards |
| [`lead-dossier`](.claude/skills/lead-dossier) | Multi-source account research, cascade enrichment, and lead sourcing pipeline |
| [`outbound-engine`](.claude/skills/outbound-engine) | Cold outbound automation from ICP definition to email delivery |
| [`podcast-ops`](.claude/skills/podcast-ops) | Turns one podcast episode into 20+ content pieces across platforms |
| [`revenue-intelligence`](.claude/skills/revenue-intelligence) | Sales call insight pipelines and revenue attribution reporting |
| [`sales-pipeline`](.claude/skills/sales-pipeline) | Visitor-to-pipeline automation — lead routing, deal resurrection, ICP learning |
| [`sales-playbook`](.claude/skills/sales-playbook) | Value-based pricing framework, call analysis, and pricing pattern library |
| [`seo-ops`](.claude/skills/seo-ops) | Keyword research, GSC optimization, and competitive content attack briefs |
| [`short-form-pipeline`](.claude/skills/short-form-pipeline) | Extracts viral short-form clips (TikTok/Reels/Shorts) from long-form YouTube videos |
| [`team-ops`](.claude/skills/team-ops) | Performance audits and meeting-to-action extraction |
| [`video-caption-generator`](.claude/skills/video-caption-generator) | Transcribes Drive videos and generates social captions/titles |
| [`video-clip-pipeline`](.claude/skills/video-clip-pipeline) | Converts long-form YouTube episodes into standalone highlight clips |
| [`x-longform-post`](.claude/skills/x-longform-post) | Writes X long-form articles with an AI-slop humanizer checklist |
| [`yt-competitive-analysis`](.claude/skills/yt-competitive-analysis) | Finds outlier videos and packaging patterns across YouTube channels |

The upstream repo also ships optional `security/` (PII sanitizer/pre-commit hook) and `telemetry/` (opt-in usage tracking) tooling that these skills degrade gracefully without; it isn't vendored here — see the [source repo](https://github.com/ericosiu/ai-marketing-skills) if you want it.

## Get started

<ol>
  <li>
    Run the following command in your terminal: <br />
    <code>npm install -g @anthropic-ai/claude-code</code>
  </li>
  <li>
    Navigate to your project directory and run <code>claude</code>
  </li>
  <li>
    Complete the one-time OAuth process with your Anthropic Console account.
  </li>
</ol>

### Research Preview

We're launching Claude Code as a beta product in research preview to learn directly from developers about their experiences collaborating with AI agents. Our aim is to learn more about how developers prefer to collaborate with AI tools, which development workflows benefit most from working with the agent, and how we can make the agent experience more intuitive.

This is an early version of the product experience, and it's likely to evolve as we learn more about developer preferences. Claude Code is an early look into what's possible with agentic coding, and we know there are areas to improve. We plan to enhance tool execution reliability, support for long-running commands, terminal rendering, and Claude's self-knowledge of its capabilities -- as well as many other product experiences -- over the coming weeks.

### Reporting Bugs

We welcome feedback during this beta period. Use the `/bug` command to report issues directly within Claude Code, or file a [GitHub issue](https://github.com/anthropics/claude-code/issues).

### Data collection, usage, and retention

When you use Claude Code, we collect feedback, which includes usage data (such as code acceptance or rejections), associated conversation data, and user feedback submitted via the `/bug` command.

#### How we use your data

We may use feedback to improve our products and services, but we will not train generative models using your feedback from Claude Code. Given their potentially sensitive nature, we store user feedback transcripts for only 30 days.

If you choose to send us feedback about Claude Code, such as transcripts of your usage, Anthropic may use that feedback to debug related issues and improve Claude Code's functionality (e.g., to reduce the risk of similar bugs occurring in the future).

### Privacy safeguards

We have implemented several safeguards to protect your data, including limited retention periods for sensitive information, restricted access to user session data, and clear policies against using feedback for model training.

For full details, please review our [Commercial Terms of Service](https://www.anthropic.com/legal/commercial-terms) and [Privacy Policy](https://www.anthropic.com/legal/privacy).
