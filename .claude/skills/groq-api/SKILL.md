---
name: groq-api
description: Reference for the Groq API (api.groq.com) — chat completions, the Responses (beta) endpoint, audio transcription/translation/speech, models, batches, files, and fine-tuning. Use whenever Groq, GroqCloud, the groq-sdk, or a `console.groq.com` / `api.groq.com` endpoint is mentioned, or when picking between Groq and other inference providers for fast/low-latency LLM calls. Covers request/response fields, curl/Node/Python examples, and model listing — check `references/api-reference.md` before guessing parameter names or endpoint shapes.
---

# Groq API

Groq exposes an OpenAI-compatible REST API at `https://api.groq.com/openai/v1/...` (plus a
`/v1/fine_tunings` endpoint that is not under the `/openai` prefix). Auth is a bearer token:
`Authorization: Bearer $GROQ_API_KEY`.

For full request/response field tables, curl examples, and Node/Python SDK snippets, read
`references/api-reference.md` (vendored from the official Groq docs at
https://console.groq.com/docs/api-reference) rather than guessing — Groq's parameter set
diverges from OpenAI's in places (e.g. `max_completion_tokens` vs deprecated `max_tokens`,
`reasoning_effort`/`reasoning_format`, `service_tier` values, Compound-specific fields).

## Endpoint quick reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/openai/v1/chat/completions` | POST | Chat completions (the main text-generation endpoint) |
| `/openai/v1/responses` | POST | Responses API (beta) |
| `/openai/v1/audio/transcriptions` | POST | Speech-to-text |
| `/openai/v1/audio/translations` | POST | Speech-to-English-text |
| `/openai/v1/audio/speech` | POST | Text-to-speech |
| `/openai/v1/models` | GET | List models |
| `/openai/v1/models/{model}` | GET | Retrieve one model |
| `/openai/v1/batches` | POST/GET | Create/list batches |
| `/openai/v1/batches/{batch_id}` | GET | Retrieve a batch |
| `/openai/v1/batches/{batch_id}/cancel` | POST | Cancel a batch |
| `/openai/v1/files` | POST/GET | Upload/list files (batch input, up to 100MB `.jsonl`) |
| `/openai/v1/files/{file_id}` | GET/DELETE | Retrieve/delete a file |
| `/openai/v1/files/{file_id}/content` | GET | Download a file |
| `/v1/fine_tunings` | GET/POST | List/create fine tunings (closed beta) |
| `/v1/fine_tunings/{id}` | GET/DELETE | Retrieve/delete a fine tuning (closed beta) |

## Things easy to get wrong

- `max_tokens` is deprecated in chat completions — use `max_completion_tokens`.
- `n` (choices per request) only supports `1`; anything else 400s.
- `logprobs`, `top_logprobs`, `logit_bias`, `frequency_penalty`, `presence_penalty` are accepted
  but not yet implemented by any Groq model.
- `reasoning_effort` values differ by model family: Qwen3 models use `none`/`default`; the
  `openai/gpt-oss-*` models use `low`/`medium`/`high` (default `medium`).
- `include_reasoning` and `reasoning_format` are mutually exclusive.
- Whisper endpoints (`transcriptions`/`translations`) require either `file` or `url`, not both;
  `url` is required (not `file`) for Batch API requests.
- The Batch API only accepts `/v1/chat/completions` as the batch `endpoint` today.

Official docs: https://console.groq.com/docs/api-reference
