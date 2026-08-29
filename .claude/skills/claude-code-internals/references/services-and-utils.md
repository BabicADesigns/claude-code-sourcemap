# Services (`src/services/`)

| File | Responsibility |
|---|---|
| `claude.ts` | Main Anthropic API client wrapper (direct API, Bedrock, Vertex). Streaming, retry/backoff, token counting, cost tracking, prompt caching. `querySonnet()` is what `src/query.ts` calls each turn. |
| `mcpClient.ts` | MCP (Model Context Protocol) client: discovers/starts servers (stdio or SSE), exposes their tools/commands/prompts into `getTools()`/`getCommands()`, manages per-project/global server config and approval state. |
| `mcpServerApproval.tsx` | Ink dialogs for approving newly-discovered `.mcprc` MCP servers (single or multi-select), invoked during CLI startup (`handleMcprcServerApprovals`). |
| `oauth.ts` | OAuth2 PKCE flow for Anthropic console login; runs a local HTTP server for the redirect, exchanges the code, stores tokens. |
| `sentry.ts` | Error reporting via Sentry, enriched with git/CI/node/session/statsig context. Initialized first thing in `cli.tsx`. |
| `statsig.ts` | Feature flags + analytics (`logEvent`, `checkGate`); most `tengu_*` event names throughout the codebase go through here. |
| `statsigStorage.ts` | Filesystem-backed storage adapter for Statsig (caches under `~/.claude/statsig`) so flags work offline. |
| `browserMocks.ts` | Minimal `document`/`window`/`navigator` polyfills so the browser-oriented `@statsig/js-client` can run under Node. |
| `notifier.ts` | Terminal completion notifications (iTerm2 escape codes, terminal bell, or both), per user config. |
| `vcr.ts` | Records/replays Claude API responses to fixture files for deterministic tests; hashes inputs to short filenames. |

# Notable utils (`src/utils/`)

Stateless/low-level helpers consumed by the above. Worth knowing by name when searching for behavior:

- `config.ts` — reads/writes global (`~/.claude.json`-style) and per-project config, including `allowedTools` (permissions) and `enableArchitectTool`.
- `permissions/filesystem.ts` — tracks which directories have been granted read/write access this session (`grantReadPermissionForOriginalDir`, etc.), referenced from `cli.tsx` and `permissions.ts`.
- `commands.ts` — `splitCommand`/`getCommandSubcommandPrefix`: parses compound bash commands (`a && b`) into sub-commands for the Bash permission prefix logic.
- `ripgrep.ts` — wraps the vendored `rg` binaries (`vendor/ripgrep/<platform>/`) for `GrepTool` and `getClaudeFiles()`.
- `git.ts`, `user.ts` — git status/branch/email helpers used by `context.ts`'s `getGitStatus()`.
- `model.ts` — resolves which model to use (`getSlowAndCapableModel`, default-model checks).
- `messages.tsx` — message construction/normalization between the internal `Message` union and the Anthropic SDK's `MessageParam`/`Message` types (`normalizeMessagesForAPI`, `createUserMessage`, etc.) — the glue type used throughout `query.ts`.
- `autoUpdater.ts` — self-update logic (`claude update`, version checks, install status).
- `PersistentShell.ts` — the long-lived shell process backing `BashTool` (so `cd` and env vars persist between calls); closed on process `exit`.
- `log.ts` — conversation/error log file naming and read/write (`dateToFilename`, `loadLogList`, `CACHE_PATHS`).
- `state.ts` — process-wide `cwd` getter/setter (`getCwd`/`setCwd`), since the CLI can `cd` via Bash without changing Node's real `process.cwd()`.
