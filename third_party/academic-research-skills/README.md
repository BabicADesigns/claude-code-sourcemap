# Academic Research Skills (vendored)

This directory tracks the provenance of Claude Code skills, slash commands, and
subagents vendored from **Academic Research Skills (ARS)** by Cheng-I Wu:

- Source: <https://github.com/Imbad0202/academic-research-skills>
- Version vendored: v3.13.0 (2026-06-18)
- License: CC BY-NC 4.0 (Attribution-NonCommercial) — see `LICENSE` in this directory
- See also: `NOTICE.md`, `CITATION.cff`

Attribution (per upstream's suggested format):

> Based on Academic Research Skills by Cheng-I Wu, <https://github.com/Imbad0202/academic-research-skills>

## What was vendored, and where

| Upstream path | Vendored to |
|---|---|
| `deep-research/` | `.claude/skills/deep-research/` |
| `academic-paper/` | `.claude/skills/academic-paper/` |
| `academic-paper-reviewer/` | `.claude/skills/academic-paper-reviewer/` |
| `academic-pipeline/` | `.claude/skills/academic-pipeline/` |
| `shared/` | `.claude/skills/shared/` |
| `commands/*.md` | `.claude/commands/` (flattened) |
| `agents/{synthesis,research_architect,report_compiler}_agent.md` | `.claude/agents/` |

The four skill directories and `shared/` were kept as siblings (matching upstream's
own root layout) so the relative paths inside each `SKILL.md`/reference file
(e.g. `../../shared/...`) keep resolving correctly.

## What was intentionally left out

Upstream's own setup docs describe these as optional ("Minimum viable setup" needs
only the skill directories under `.claude/skills/`), and they pull in a large,
unrelated Python CI/test/eval surface that doesn't fit this repo:

- `scripts/` — Python validators, API clients, citation-verification cache, and the
  deterministic `ars_anchorize_draft.py` / `ars_apply_revision_patch.py` helpers used
  by `academic-paper`'s revision-patch mode. Without these, that specific sub-mode
  loses its deterministic patch/anchor tooling; every other mode in all four skills
  is unaffected (the in-skill references to `scripts/*.py` are advisory verifiers,
  not hard requirements).
- `hooks/` — the `SessionStart` announce hook and the `PreToolUse` write-scope guard.
  Both are optional hardening layers that degrade to a no-op pass-through when their
  backing scripts are absent, by upstream's own design.
- `evals/`, `tests/`, `audits/`, `docs/design/`, `.github/workflows/` — upstream's own
  development, CI, and evaluation harness, not needed to use the skills.
- `.claude-plugin/` marketplace packaging — not used here since this repo doesn't
  register a plugin marketplace; the skills/commands/agents are installed directly
  as project-level Claude Code resources instead.

If you need any of the above, fetch them directly from the upstream repository at
the version noted above.
