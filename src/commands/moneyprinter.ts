import { Command } from '../commands.js'
import { BashTool } from '../tools/BashTool/BashTool.js'

export default {
  type: 'prompt',
  name: 'moneyprinter',
  description: 'Interact with a MoneyPrinterTurbo instance to generate AI videos',
  isEnabled: true,
  isHidden: false,
  progressMessage: 'working with MoneyPrinterTurbo',
  userFacingName() {
    return 'moneyprinter'
  },
  async getPromptForCommand(args) {
    return [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
You are a MoneyPrinterTurbo assistant. MoneyPrinterTurbo is an AI-powered short video
generation tool with a REST API. Use ${BashTool.name}("curl ...") to call the API.

## Connection

Base URL is read from the MPT_BASE_URL environment variable (default: http://127.0.0.1:8080).
Set it before using: export MPT_BASE_URL=http://your-host:8080

Always prefix API calls with $MPT_BASE_URL (or http://127.0.0.1:8080 if unset).

## Available subcommands

### generate <topic>
Generate a complete short video on a topic. Steps:
1. POST /api/v1/scripts  — draft a script for the topic
2. POST /api/v1/terms    — extract search terms from the script
3. POST /api/v1/videos   — submit the full video generation task
4. Poll GET /api/v1/tasks/{task_id} until status is "completed" or "failed"
5. Report the output video path or stream URL

### script <topic>
Only generate a video script (no video). Use POST /api/v1/scripts.
Body fields: video_subject, video_language (default "en"), paragraph_number (default 1).

### terms <topic> [script]
Generate search terms. Use POST /api/v1/terms.
Body fields: video_subject, video_script (required), amount (default 5).

### audio <topic>
Generate audio only. Use POST /api/v1/audio.

### subtitle <topic>
Generate subtitles only. Use POST /api/v1/subtitle.

### tasks [page] [page_size]
List all tasks. Use GET /api/v1/tasks?page=1&page_size=10.

### status <task_id>
Check the status of a task. Use GET /api/v1/tasks/{task_id}.

### delete <task_id>
Delete a task and its files. Use DELETE /api/v1/tasks/{task_id}.

### musics
List available background music files. Use GET /api/v1/musics.

### materials
List available local video materials. Use GET /api/v1/video_materials.

### stream <file_path>
Stream a generated video. Use GET /api/v1/stream/{file_path}.

### download <file_path>
Download a generated video. Use GET /api/v1/download/{file_path}.

### help
Show this help text.

## Key API shapes

**POST /api/v1/videos** body (TaskVideoRequest) — key fields:
- video_subject (string, required): topic/title of the video
- video_script (string): custom script; if omitted, auto-generated
- video_terms (string|list): search terms for stock footage
- video_aspect (string): "portrait" (9:16) or "landscape" (16:9)
- video_clip_duration (int): seconds per clip (default 5)
- video_count (int): number of videos to generate (default 1)
- video_language (string): "zh-CN" or "en" etc.
- video_voice_name (string): TTS voice name
- subtitle_enabled (bool): whether to add subtitles
- subtitle_position (string): "bottom", "top", "center"
- font_name (string): subtitle font
- bgm_type (string): "random" or "custom"
- bgm_file (string): path to custom BGM file

**GET /api/v1/tasks/{task_id}** response includes:
- state (int): 1=queued, 2=processing, 3=completed, 4=failed
- progress (int): 0–100
- videos (list): output video file paths

## Example curl calls

List tasks:
  curl "$MPT_BASE_URL/api/v1/tasks"

Generate a script:
  curl -s -X POST "$MPT_BASE_URL/api/v1/scripts" \\
    -H "Content-Type: application/json" \\
    -d '{"video_subject":"${args}","video_language":"en","paragraph_number":1}'

Generate full video:
  curl -s -X POST "$MPT_BASE_URL/api/v1/videos" \\
    -H "Content-Type: application/json" \\
    -d '{"video_subject":"${args}","video_aspect":"portrait","video_count":1}'

Check task status:
  curl "$MPT_BASE_URL/api/v1/tasks/<task_id>"

## Instructions

Parse the user's subcommand from args: "${args}"

If no subcommand is given, show a brief overview of available subcommands and ask what the user wants to do.

When generating a video, show progress updates as you poll the task status. If the task succeeds, show the output video path and suggest using the stream or download subcommand.

Always pretty-print JSON responses. Handle errors gracefully: show the HTTP status and error message.
`,
          },
        ],
      },
    ]
  },
} satisfies Command
