# Built-in tools (`src/tools/`)

Registered in `src/tools.ts`. `getAllTools()` returns the always-available set; `getTools()` adds MCP-provided tools and, if enabled, `ArchitectTool`. `MemoryReadTool`/`MemoryWriteTool` are only included when `USER_TYPE==='ant'`.

Every tool implements a common shape (see `src/tools/BashTool/BashTool.tsx` for a concrete example, since the `Tool` type itself isn't recoverable — read the "Known gaps" note in `SKILL.md`): `name`, `inputSchema` (zod), `isEnabled()`, `isReadOnly()`, `needsPermissions()`, `validateInput()` (optional), and `call()` — an async generator yielding `{type: 'progress', ...}` messages then a final `{type: 'result', ...}`.

| Tool name | Directory | Read-only | Needs permission | Purpose |
|---|---|---|---|---|
| `Agent` | `AgentTool/` | No | No | Launches a sub-agent that autonomously uses tools to complete a sub-task and streams its progress back. |
| `Architect` | `ArchitectTool/` | Yes | No | Plans a technical approach using only exploration tools (Bash, LS, Read, Glob, Grep) without making edits; gated behind `--enable-architect` / project config. |
| `Bash` | `BashTool/` | No | Yes (per project, prefix-matched) | Runs a shell command (`command`, optional `timeout` up to 600000ms) in a persistent shell; auto-summarized by Haiku; checked against banned commands and cwd sandboxing. |
| `Edit` | `FileEditTool/` | No | Yes (write) | String-replace edit of a file (`file_path`, `old_string`, `new_string`); requires the match to be unique and the file unmodified since last read. |
| `View` | `FileReadTool/` | Yes | Yes (read) | Reads a file (`file_path`, optional `offset`/`limit`); supports images (auto-resized, base64). |
| `Replace` | `FileWriteTool/` | No | Yes (write) | Overwrites a file's entire contents (`file_path`, `content`); creates parent dirs; checks for stale writes. |
| `Glob` | `GlobTool/` | Yes | Yes (read) | Pattern-matches filenames (`pattern`, optional `path`); returns up to 100 results sorted by mtime. |
| `Grep` | `GrepTool/` | Yes | Yes (read) | Content search via the vendored `rg` binary (`pattern`, optional `path`, optional `include` glob). |
| `LS` | `lsTool/` | Yes | Yes (read) | Recursively lists a directory as a tree (`path`); truncates past 1000 entries, skips hidden files/`__pycache__`. |
| `mcp` | `MCPTool/` | No | Yes | Generic passthrough shape that `mcpClient` rebinds per actual MCP server tool — not used directly. |
| `MemoryRead` | `MemoryReadTool/` | Yes | No | Reads files from a local "memory" directory; `USER_TYPE==='ant'` only. |
| `MemoryWrite` | `MemoryWriteTool/` | No | No | Writes files to the local "memory" directory; `USER_TYPE==='ant'` only. |
| `NotebookEditCell` | `NotebookEditTool/` | No | Yes (write) | Edits a Jupyter notebook cell (`notebook_path`, `cell_number`, `new_source`, optional `cell_type`/`edit_mode` for replace/insert/delete); clears execution state. |
| `ReadNotebook` | `NotebookReadTool/` | Yes | Yes (read) | Reads all cells + outputs of a Jupyter notebook (`notebook_path`). |
| `StickerRequest` | `StickerRequestTool/` | No | No | Easter-egg UI for requesting Claude stickers; gated by a Statsig flag. |
| `Think` | `ThinkTool/` | Yes | No | Lets the model record private extended-thinking text with no side effects; gated by `THINK_TOOL` env var + Statsig flag, logged for analysis. |

## Concurrency rule

In `src/query.ts`, a batch of `tool_use` blocks from one assistant turn runs **concurrently** (`runToolsConcurrently`, capped at `MAX_TOOL_USE_CONCURRENCY = 10`) only if **every** tool in the batch is read-only; otherwise the whole batch runs **serially** (`runToolsSerially`) to avoid interleaving writes/bash calls unpredictably.
