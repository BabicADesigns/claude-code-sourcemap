# Slash commands (`src/commands/`)

Registered in `src/commands.ts`. `getCommands()` = MCP-server-provided commands + the static `COMMANDS()` list, filtered by `isEnabled`. Each command is one of three shapes: `prompt` (returns message(s) injected into the conversation), `local` (runs synchronously and returns a string), or `local-jsx` (renders an Ink component, e.g. for interactive flows).

| Command | File | Notes |
|---|---|---|
| `/bug` | `bug.tsx` | Submit feedback about Claude Code. |
| `/clear` | `clear.ts` | Clear conversation history and free the context window. |
| `/compact` | `compact.ts` | Clear history but keep an AI-generated summary for continuity. |
| `/config` | `config.tsx` | Open the config panel (theme, model, behavior). |
| `/cost` | `cost.ts` | Show total API cost and session duration. |
| — | `ctx_viz.ts` | Internal-only (`USER_TYPE==='ant'`): visualizes context-window token breakdown by section. |
| `/doctor` | `doctor.ts` | Health-check the installation (deps, permissions, config). |
| `/help` | `help.tsx` | List available commands. |
| `/init` | `init.ts` | Generate/improve a `CLAUDE.md` for the project by analyzing the codebase (and importing `.cursorrules`/Copilot instructions if present). |
| — | `listen.ts` | Internal-only, macOS/iTerm2: speech-to-text via AppleScript. |
| `/login` | `login.tsx` | OAuth sign-in to an Anthropic account; clears the conversation on success. |
| `/logout` | `logout.tsx` | Sign out and clear stored credentials. |
| — | `onboarding.tsx` | Internal-only: runs the onboarding UI flow. |
| `/pr-comments` | `pr_comments.ts` | Fetch and render a GitHub PR's comments/review threads with diffs. |
| `/release-notes` | `release-notes.ts` | Show release notes (currently disabled). |
| — | `resume.tsx` | Internal-only: resume a previous conversation from log history. |
| `/review` | `review.ts` | Produce a thorough code review of a PR (or list open PRs if none given). |
| `/terminal-setup` | `terminalSetup.ts` | Install the Shift+Enter newline keybinding (macOS iTerm2 / VS Code only). |
| — | `approvedTools.ts` | Not a slash command — exports `handleListApprovedTools`/`handleRemoveApprovedTool`, used by `claude approved-tools list/remove` in `cli.tsx`. |

`/login` and `/logout` are only added when `isAnthropicAuthEnabled()`. Commands marked "Internal-only" are gated by `process.env.USER_TYPE === 'ant'` (Anthropic-internal builds) in `INTERNAL_ONLY_COMMANDS`.
