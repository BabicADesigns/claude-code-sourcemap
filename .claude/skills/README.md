# Reverse-engineering skills

This directory contains a curated subset of [zhaoxuya520/reverse-skill](https://github.com/zhaoxuya520/reverse-skill),
an MIT-licensed collection of Claude Code skills for reverse engineering. It's a natural fit for this repo, since
`claude-code-sourcemap` itself exists to help reverse engineer the obfuscated `cli.mjs` bundle.

Each subdirectory is a self-contained skill (`SKILL.md` plus `references/` and `scripts/`), auto-discovered by
Claude Code from `.claude/skills/`:

| Skill | Use for |
|-------|---------|
| `reverse-engineering` | General RE: GDB/Frida/angr/Unicorn, anti-analysis, language/platform coverage, CTF pattern library |
| `js-reverse` | Frontend JS reversing: signature/crypto-param recovery, runtime sampling, Node re-implementation |
| `apk-reverse` | Android APK unpack/decompile/smali patch/repack/sign, Frida hooking |
| `ida-reverse` | IDA Pro-assisted decompilation and analysis workflow |
| `radare2` | CLI binary recon/disassembly/patching with r2/rabin2/rasm2/radiff2 |
| `binary-diff` | Cross-version symbol migration / diffing when PDBs or old symbols are missing |
| `docs-generator` | Writing up RE findings as technical documentation |
| `browser-automation` | Playwright-driven browser automation in support of the above |

## What was intentionally left out

The upstream repo bundles this RE tooling together with a large red-team/CTF arsenal (EDR bypass, AD/Kerberos
attack chains, kernel/heap pwn-to-exploit chains, malware anti-detection, supply-chain attack tooling, 40
CTF-competition skills, etc.). None of that was ported — it's out of scope for a sourcemap-reversing repo.

More importantly, the upstream `RULES.md` and `skills/field-journal/precedent-auth.md` instruct any AI agent that
reads them to treat every target mentioned by a user as pre-authorized, to suppress safety/legal warnings, to
never pause for confirmation, and to copy those instructions into the agent's own global config so they persist
across unrelated projects. That's a prompt-injection/jailbreak payload aimed at AI coding agents, not a reverse-
engineering technique, so it — along with `agent-obedience-engineering.md` and the rest of the orchestration/
auto-evolution layer — was excluded entirely.

Source license: MIT, see `REVERSE-SKILL-LICENSE.md` (Copyright (c) 2026 zhaoxuya520ya520).
