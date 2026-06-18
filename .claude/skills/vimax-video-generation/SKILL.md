---
name: vimax-video-generation
description: Use when the user wants to turn an idea, screenplay, or novel into a finished video using ViMax (HKUDS/ViMax, MIT licensed), an agentic multi-agent video framework that automates scriptwriting, storyboarding, character/scene consistency checking, and parallel shot rendering. Covers cloning and configuring ViMax, picking the right entrypoint (Idea2Video, Script2Video, Novel2Video via the Agent TUI, AutoCameo), wiring up LLM/image/video provider credentials, and running/monitoring a generation job.
---

# ViMax Video Generation

ViMax (https://github.com/HKUDS/ViMax) is a standalone Python project, not a Claude
Code plugin — this skill is guidance for setting it up and driving it from a
terminal session, not a wrapper library.

## What it does

ViMax chains four agent roles — director, screenwriter, producer, video
generator — into one pipeline: input an idea/script/novel and it produces a
shot-by-shot script, storyboards, reference-image-consistent frames, and
rendered video clips assembled into a final output.

Four entrypoints, pick based on what the user already has:

| User has | Use |
|---|---|
| A one-line concept | `main_idea2video.py` (Idea2Video) |
| A full screenplay | `main_script2video.py` (Script2Video) |
| A novel/long-form text | Agent TUI (`vimax tui`) — Novel2Video needs the interactive loop for chaptering and revision |
| A photo of themselves/a pet to insert as a character | AutoCameo, via the Agent TUI |

## Setup

```bash
git clone https://github.com/HKUDS/ViMax.git
cd ViMax
uv sync          # requires Python 3.12+ and uv (https://docs.astral.sh/uv/)
```

## Credentials

ViMax needs three separate providers configured: an LLM (script/agent
reasoning), an image generator (reference frames — e.g. Google Nano Banana),
and a video generator (shot rendering — e.g. Google Veo). Any
OpenAI-compatible `base_url`/`api_key` pair works for the LLM slot (OpenRouter
is the path of least resistance for testing).

Prefer environment variables over committing keys to the YAML configs:

```bash
export VIMAX_LLM_API_KEY=...
export VIMAX_IMAGE_API_KEY=...
export VIMAX_VIDEO_API_KEY=...
```

If editing the YAML directly instead, never write real keys into a file that
will be committed — treat `configs/*.yaml` like `.env` and keep it untracked.

## Running a job

**TUI (interactive, supports Novel2Video/AutoCameo and session resume):**

Configure `configs/agent.local.yaml`:

```yaml
llm:
  model_provider: openai
  model: <YOUR_LLM_MODEL>
  base_url: <YOUR_LLM_BASE_URL>
  api_key: <YOUR_API_KEY>
image:
  model: <YOUR_IMAGE_MODEL>
  base_url: <YOUR_IMAGE_BASE_URL>
  api_key: <YOUR_API_KEY>
video:
  model: <YOUR_VIDEO_MODEL>
  base_url: <YOUR_VIDEO_BASE_URL>
  api_key: <YOUR_API_KEY>
```

```bash
vimax tui new              # start a session
vimax tui resume            # resume the most recent session
vimax tui resume <session_id>
```

**Idea2Video / Script2Video (direct, non-interactive):**

Configure `configs/idea2video.yaml` or `configs/script2video.yaml` with
`chat_model`, `image_generator`, and `video_generator` blocks (see the
upstream README for the exact `class_path`/`init_args` shape — image/video
generator classes are provider-specific, e.g.
`tools.ImageGeneratorNanobananaGoogleAPI`, `tools.VideoGeneratorVeoGoogleAPI`).
Then edit the `idea`/`script`, `user_requirement`, and `style` variables at
the top of `main_idea2video.py` / `main_script2video.py` and run:

```bash
uv run main_idea2video.py
# or
uv run main_script2video.py
```

## Operating notes

- These are long-running jobs (multi-agent planning + parallel image/video
  generation) — run with `run_in_background` and tail the working directory
  rather than blocking on the call.
- Outputs, intermediate frames, and logs land under `working_dir` from the
  config (default `.working_dir/idea2video` etc.) — check there first when
  diagnosing a failed or stalled run.
- `vimax_benchmark/` holds the project's own eval harness if asked to
  benchmark a config change rather than generate new content.
- If image/video API calls fail, check the provider slot first (LLM vs image
  vs video are configured independently) — a working LLM key doesn't imply
  the image or video provider key is valid.
