---
name: claude-code-internals
description: Use when navigating, explaining, or modifying this repo's source — a source-mapped decompile of the Claude Code 0.2.8 npm package (cli.mjs + src/ + vendor/). Covers the agent query loop, tool registry, permission system, slash commands, and services, so you can jump straight to the relevant file instead of re-reading the whole tree.
---

# Claude Code 0.2.8 internals

This repo is **not** a fresh project — it's the original `@anthropic-ai/claude-code@0.2.8` npm package with `cli.mjs` (the minified bundle) extracted alongside a reconstructed `src/` tree (recovered via source maps) and the vendored `vendor/sdk` (Anthropic SDK) and `vendor/ripgrep` binaries. The maintainer is not actively developing this repo; the active fork is `dnakov/anon-kode` (see README.md:3). Treat `src/` as **read-only reference material for understanding how Claude Code worked at this version**, unless the user explicitly asks you to patch it.

## Mental model: one request through the system

1. **Entrypoint** — `src/entrypoints/cli.tsx` parses argv with `commander` (`claude`, `claude mcp ...`, `claude config ...`, `claude doctor`, etc.), runs `setup()` (cwd, permissions, context prefetch), then either:
   - `--print` mode: calls `ask()` once and exits, or
   - interactive mode: renders `<REPL>` (`src/screens/REPL.tsx`), an Ink (React for terminals) component.
2. **Context assembly** — `src/context.ts` builds the `{[k:string]: string}` context object injected into the system prompt: git status, directory structure (via `LSTool`), `CLAUDE.md` files, `README.md`, code style. This runs once per session and is memoized.
3. **Tool & command registries** — `src/tools.ts` (`getTools()`) and `src/commands.ts` (`getCommands()`) assemble the available `Tool[]` / `Command[]`, filtered by `isEnabled()`, MCP server contributions, and `USER_TYPE==='ant'` (Anthropic-internal) gating.
4. **The query loop** — `src/query.ts`'s `query()` async generator is the heart of the agent:
   - calls `querySonnet()` (`src/services/claude.ts`) to get the next assistant turn,
   - if the response contains `tool_use` blocks, runs them (concurrently via `runToolsConcurrently` if *all* are read-only, else serially via `runToolsSerially`),
   - each tool use goes through `checkPermissionsAndCallTool()`: zod input validation → tool's own `validateInput()` → `canUseTool()` permission check → `tool.call()` (itself an async generator that can yield `progress` messages before a final `result`),
   - recurses (`yield* await query(...)`) with the new messages appended, until the model stops requesting tools.
5. **Permissions** — `src/permissions.ts`'s `hasPermissionsToUseTool` decides per tool: Bash gets command/sub-command prefix matching against a project's `allowedTools` list (`SAFE_COMMANDS` are always allowed); file-editing tools use session-only grants; everything else is a simple allow-list lookup keyed by `getPermissionKey()`. Approvals are persisted via `savePermission()` into the per-project config (`src/utils/config.ts`).

## Directory map

| Path | What's there |
|---|---|
| `src/entrypoints/` | `cli.tsx` (main binary), `mcp.ts` (`claude mcp serve`) |
| `src/screens/` | Top-level Ink screens: `REPL.tsx` (main chat UI), `ResumeConversation.tsx`, `Doctor.tsx`, `LogList.tsx`, `ConfigureNpmPrefix.tsx` |
| `src/components/` | Ink UI components; `components/permissions/` has the per-tool permission-request dialogs; `components/binary-feedback/` is the A/B response-rating flow (`USER_TYPE==='ant'` only) |
| `src/tools/` | One subdirectory per built-in tool (definition + prompt text + any UI). See `references/tools.md` |
| `src/commands/` | One file per slash command. See `references/commands.md` |
| `src/services/` | External integrations: Anthropic API client, MCP client, OAuth, Sentry, Statsig. See `references/services-and-utils.md` |
| `src/utils/` | Stateless helpers — config persistence, git, ripgrep wrapper, terminal, the permission filesystem allow-list, etc. |
| `src/hooks/` | React hooks for the Ink UI (`useCanUseTool.ts` defines the `CanUseToolFn` type wired into the query loop) |
| `src/constants/` | Product name, system prompts (`prompts.ts`), feature-flag/beta names (`betas.ts`), keybindings |
| `vendor/sdk/` | Vendored copy of `@anthropic-ai/sdk` |
| `vendor/ripgrep/` | Prebuilt `rg` binaries per platform, used by `GrepTool` / `utils/ripgrep.ts` |
| `cli.mjs`, `yoga.wasm` | The actual shipped, minified bundle + Yoga (flexbox-for-terminal) WASM that `src/` was reconstructed from |

## Quick reference

- All built-in tools: `references/tools.md`
- All slash commands: `references/commands.md`
- Services (`src/services/`) and notable utils (`src/utils/`): `references/services-and-utils.md`

## Known gaps in this reconstruction

Source-mapped recovery is lossy for files that compile away entirely. Notably **`src/Tool.ts`/`src/Tool.tsx` (the `Tool`/`ToolUseContext` type definitions imported everywhere as `./Tool.js`) does not exist in this tree** — it was a types-only module with no runtime emit, so no source map chunk survived for it. When you need the exact `Tool` interface shape, infer it from a concrete implementation (e.g. `src/tools/BashTool/BashTool.tsx`) rather than looking for a missing file. The same caveat applies to any other `.js` import you can't locate under `src/` — check whether it's interface/type-only before assuming it's missing by mistake.

## Working in this repo

- There's no `package.json`/build config here — this is an extracted artifact, not a buildable project. Don't try to `npm install` or run `cli.mjs` and expect a working dev loop; treat edits as documentation/study exercises unless the user sets up tooling first.
- When asked "where does X happen" or "how does Claude Code do Y", search `src/` per the directory map above before reading `cli.mjs` (which is minified and not meant to be read directly).
