---
description: Comprehensive reference documentation for the Groq API, including endpoints, parameters, and examples.
title: API Reference - GroqDocs
source: https://console.groq.com/docs/api-reference
---

# Groq API Reference

## Chat

### Create chat completion

`POST https://api.groq.com/openai/v1/chat/completions`

Creates a model response for the given chat conversation.

#### Request Body

- `messages` array Required — A list of messages comprising the conversation so far.
- `model` string Required — ID of the model to use. See [models](https://console.groq.com/docs/models) for compatible models.
- `citation_options` string or null Optional, defaults to `enabled`. Allowed values: `enabled, disabled`. Whether to enable citations in the response. When enabled, the model will include citations for information retrieved from provided documents or web searches.
- `compound_custom` object or null Optional — Custom configuration of models and tools for Compound.
- `disable_tool_validation` boolean Optional, defaults to `false`. If true, Groq will return called tools without validating that the tool is present in `request.tools`. `tool_choice=required/none` will still be enforced, but the request cannot require a specific tool be used.
- `documents` array or null Optional — A list of documents to provide context for the conversation. Each document contains text that can be referenced by the model.
- `exclude_domains` **Deprecated** array or null Optional — Use `search_settings.exclude_domains` instead. A list of domains to exclude from search results when the model uses a web search tool.
- `frequency_penalty` number or null Optional, defaults to `0`. Range: -2 to 2. Not yet supported by any of our models. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.
- `function_call` **Deprecated** string / object or null Optional — Deprecated in favor of `tool_choice`. Controls which (if any) function is called by the model. `none` means the model will not call a function and instead generates a message. `auto` means the model can pick between generating a message or calling a function. Specifying a particular function via `{"name": "my_function"}` forces the model to call that function. `none` is the default when no functions are present; `auto` is the default if functions are present.
- `functions` **Deprecated** array or null Optional — Deprecated in favor of `tools`. A list of functions the model may generate JSON inputs for.
- `include_domains` **Deprecated** array or null Optional — Use `search_settings.include_domains` instead. A list of domains to include in search results when the model uses a web search tool.
- `include_reasoning` boolean or null Optional — Whether to include reasoning in the response. If true, the response will include a `reasoning` field. If false, the model's reasoning will not be included. Mutually exclusive with `reasoning_format`.
- `logit_bias` object or null Optional — Not yet supported by any of our models. Modify the likelihood of specified tokens appearing in the completion.
- `logprobs` boolean or null Optional, defaults to `false`. Not yet supported by any of our models. Whether to return log probabilities of the output tokens. If true, returns the log probabilities of each output token in the `content` of `message`.
- `max_completion_tokens` integer or null Optional — The maximum number of tokens that can be generated in the chat completion. The total length of input tokens and generated tokens is limited by the model's context length.
- `max_tokens` **Deprecated** integer or null Optional — Deprecated in favor of `max_completion_tokens`.
- `metadata` object or null Optional — Not currently supported.
- `n` integer or null Optional, defaults to `1`. Range: 1-1. How many chat completion choices to generate for each input message. Currently only `n=1` is supported; other values 400.
- `parallel_tool_calls` boolean or null Optional, defaults to `true`. Whether to enable parallel function calling during tool use.
- `presence_penalty` number or null Optional, defaults to `0`. Range: -2 to 2. Not yet supported by any of our models. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics.
- `reasoning_effort` string or null Optional. Allowed values: `none, default, low, medium, high`. Qwen3 models support `none` (disable reasoning) and `default`/`null` (let Qwen reason). `openai/gpt-oss-20b` and `openai/gpt-oss-120b` support `low`, `medium`, or `high` (`medium` is default).
- `reasoning_format` string or null Optional. Allowed values: `hidden, raw, parsed`. Specifies how to output reasoning tokens. Mutually exclusive with `include_reasoning`.
- `response_format` object / object / object or null Optional — Specifies the format the model must output. `{ "type": "json_schema", "json_schema": {...} }` enables Structured Outputs matching your supplied JSON schema (only on [supported models](https://console.groq.com/docs/structured-outputs#supported-models)). `{ "type": "json_object" }` enables the older JSON mode.
- `search_settings` object or null Optional — Settings for web search functionality when the model uses a web search tool.
- `seed` integer or null Optional — Best-effort deterministic sampling with the same `seed` and parameters. Determinism is not guaranteed; refer to `system_fingerprint` to monitor backend changes.
- `service_tier` string or null Optional. Allowed values: `auto, on_demand, flex, performance, null`. Defaults to `on_demand`. `auto` automatically selects the highest tier available within your org's rate limits; `flex` uses the flex tier, which succeeds or fails quickly.
- `stop` string / array or null Optional — Up to 4 sequences where the API stops generating further tokens. Returned text will not contain the stop sequence.
- `store` boolean or null Optional — Not currently supported.
- `stream` boolean or null Optional, defaults to `false`. If set, partial message deltas are sent as SSE events, terminated by `data: [DONE]`.
- `stream_options` object or null Optional — Options for streaming response. Only set when `stream: true`.
- `temperature` number or null Optional, defaults to `1`. Range: 0-2. Higher values (e.g. 0.8) make output more random; lower values (e.g. 0.2) make it more focused/deterministic. Generally alter this or `top_p`, not both.
- `tool_choice` string / object or null Optional — Controls which (if any) tool is called by the model. `none` = no tool, generate a message. `auto` = model can pick between a message or one or more tools. `required` = model must call one or more tools. `{"type": "function", "function": {"name": "my_function"}}` forces that tool. `none` is default with no tools; `auto` is default with tools.
- `tools` array or null Optional — A list of tools the model may call. Currently only functions are supported. Max 128 functions.
- `top_logprobs` integer or null Optional. Range: 0-20. Not yet supported by any of our models. Number of most likely tokens to return at each position with associated log probability. Requires `logprobs: true`.
- `top_p` number or null Optional, defaults to `1`. Range: 0-1. Nucleus sampling: 0.1 means only tokens comprising the top 10% probability mass are considered. Generally alter this or `temperature`, not both.
- `user` string or null Optional — A unique identifier representing your end-user, to help monitor/detect abuse.

#### Response Object

- `choices` array — List of chat completion choices (more than one only if `n > 1`).
- `created` integer — Unix timestamp (seconds) of creation.
- `id` string — Unique identifier for the chat completion.
- `mcp_list_tools` array or null — List of discovered MCP tools from connected servers.
- `model` string — Model used for the completion.
- `object` string — Always `chat.completion`.
- `service_tier` string or null — Allowed values: `auto, on_demand, flex, performance, null`. Service tier used.
- `system_fingerprint` string — Represents the backend configuration the model runs with; use with `seed` to detect backend changes affecting determinism.
- `usage` object — Usage statistics for the completion request.
- `usage_breakdown` — Detailed usage breakdown by model when multiple models are used (compound AI systems).
- `x_groq` object — Groq-specific metadata for non-streaming responses.

```bash
curl https://api.groq.com/openai/v1/chat/completions -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $GROQ_API_KEY" \
-d '{
  "model": "llama-3.3-70b-versatile",
  "messages": [{
      "role": "user",
      "content": "Explain the importance of fast language models"
  }]
}'
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completion = await groq.chat.completions
    .create({
      messages: [
        {
          role: "user",
          content: "Explain the importance of fast language models",
        },
      ],
      model: "llama-3.3-70b-versatile",
    })
  console.log(completion.choices[0].message.content);
}

main();
```

```python
import os

from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "system",
            "content": "You are a helpful assistant."
        },
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)
```

Example response:

```json
{
  "id": "chatcmpl-f51b2cd2-bef7-417e-964e-a08f0b513c22",
  "object": "chat.completion",
  "created": 1730241104,
  "model": "openai/gpt-oss-20b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Fast language models have gained significant attention..."
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "queue_time": 0.037493756,
    "prompt_tokens": 18,
    "prompt_time": 0.000680594,
    "completion_tokens": 556,
    "completion_time": 0.463333333,
    "total_tokens": 574,
    "total_time": 0.464013927
  },
  "system_fingerprint": "fp_179b0f92c9",
  "x_groq": { "id": "req_01jbd6g2qdfw2adyrt2az8hz4w" }
}
```

## Responses (beta)

### Create response

`POST https://api.groq.com/openai/v1/responses`

Creates a model response for the given input.

#### Request Body

- `input` string / array Required — Text input to the model, used to generate a response.
- `model` string Required — ID of the model to use. See [models](https://console.groq.com/docs/models) compatible with the Responses API.
- `instructions` string or null Optional — Inserts a system (or developer) message as the first item in the model's context.
- `max_output_tokens` integer or null Optional — Upper bound for tokens generated for a response, including visible output tokens and reasoning tokens.
- `metadata` object or null Optional — Custom key-value pairs for storing additional information. Max 16 pairs.
- `parallel_tool_calls` boolean or null Optional, defaults to `true`. Enable parallel execution of multiple tool calls.
- `reasoning` object or null Optional — Configuration for reasoning capabilities when using [models that support reasoning](https://console.groq.com/docs/reasoning).
- `service_tier` string or null Optional, defaults to `auto`. Allowed values: `auto, default, flex`. Latency tier to use for processing.
- `store` boolean or null Optional, defaults to `false`. Response storage flag. Currently only supports `false`/`null`.
- `stream` boolean or null Optional, defaults to `false`. Enable streaming mode to receive response data as SSE.
- `temperature` number or null Optional, defaults to `1`. Range: 0-2. Lower = more deterministic, higher = more variety/creativity.
- `text` object Optional — Response format configuration. Supports plain text or structured JSON output.
- `tool_choice` string / object or null Optional — Same semantics as chat completions' `tool_choice`.
- `tools` array or null Optional — List of tools available to the model. Currently only function definitions. Max 128 functions.
- `top_p` number or null Optional, defaults to `1`. Range: 0-1. Nucleus sampling cumulative-probability cutoff.
- `truncation` string or null Optional, defaults to `disabled`. Allowed values: `auto, disabled`. Context truncation strategy.
- `user` string Optional — Identifier for tracking end-user requests.

#### Response Object

- `background` boolean — Whether the response was generated in the background.
- `created_at` integer — Unix timestamp (seconds) of creation.
- `error` object or null — Error object if the response failed.
- `id` string — Unique identifier for the response.
- `incomplete_details` object or null — Details about why the response is incomplete.
- `instructions` string or null — System instructions used for the response.
- `max_output_tokens` integer or null — Configured max tokens.
- `max_tool_calls` integer or null — Max tool calls allowed.
- `metadata` object or null — Metadata attached to the response.
- `model` string — Model used.
- `object` string — Always `response`.
- `output` array — Array of content items generated by the model.
- `parallel_tool_calls` boolean — Whether the model can run tool calls in parallel.
- `previous_response_id` string or null — Not supported, always null.
- `reasoning` object or null — Reasoning configuration options.
- `service_tier` string — Allowed values: `auto, default, flex`. Tier used for processing.
- `status` string — Allowed values: `completed, failed, in_progress, incomplete`.
- `store` boolean — Whether the response was stored.
- `temperature` number — Sampling temperature used.
- `text` object — Text format configuration used for the response.
- `tool_choice` string / object or null — Tool choice used.
- `tools` array — Tools that were available to the model.
- `top_logprobs` integer — Number of top log probabilities returned.
- `top_p` number — Nucleus sampling parameter used.
- `truncation` string — Allowed values: `auto, disabled`. Truncation strategy used.
- `usage` object — Usage statistics for the request.
- `user` string or null — User identifier.

```bash
curl https://api.groq.com/openai/v1/responses -s \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $GROQ_API_KEY" \
-d '{
  "model": "openai/gpt-oss-120b",
  "input": "Tell me a three sentence bedtime story about a unicorn."
}'
```

Example response:

```json
{
  "id": "resp_01k1x6w9ane6d8rfxm05cb45yk",
  "object": "response",
  "status": "completed",
  "created_at": 1754400695,
  "output": [
    {
      "type": "message",
      "id": "msg_01k1x6w9ane6eb0650crhawwyy",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "When the stars blinked awake, Luna the unicorn curled her mane and whispered wishes to the sleeping pine trees...",
          "annotations": []
        }
      ]
    }
  ],
  "previous_response_id": null,
  "model": "llama-3.3-70b-versatile",
  "reasoning": {
    "effort": null,
    "summary": null
  },
  "max_output_tokens": null,
  "instructions": null,
  "text": {
    "format": {
      "type": "text"
    }
  },
  "tools": [],
  "tool_choice": "auto",
  "truncation": "disabled",
  "metadata": {},
  "temperature": 1,
  "top_p": 1,
  "user": null,
  "service_tier": "default",
  "error": null,
  "incomplete_details": null,
  "usage": {
    "input_tokens": 82,
    "input_tokens_details": {
      "cached_tokens": 0
    },
    "output_tokens": 266,
    "output_tokens_details": {
      "reasoning_tokens": 0
    },
    "total_tokens": 348
  },
  "parallel_tool_calls": true,
  "store": false
}
```

## Audio

### Create transcription

`POST https://api.groq.com/openai/v1/audio/transcriptions`

Transcribes audio into the input language.

#### Request Body

- `model` string Required — ID of the model to use. `whisper-large-v3` and `whisper-large-v3-turbo` are currently available.
- `file` string Optional — The audio file object (not file name) to transcribe, in one of: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm. Either `file` or `url` must be provided. `file` is not supported in Batch API requests.
- `language` string Optional — Language of the input audio in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format; improves accuracy and latency.
- `prompt` string Optional — Optional text to guide the model's style or continue a previous audio segment; should match the audio language.
- `response_format` string Optional, defaults to `json`. Allowed values: `json, text, verbose_json`.
- `temperature` number Optional, defaults to `0`. Range 0-1. Higher = more random, lower = more focused/deterministic. At 0, the model uses log probability to automatically increase temperature until certain thresholds are hit.
- `timestamp_granularities[]` array Optional, defaults to `segment`. Requires `response_format: verbose_json`. Supports `word` and/or `segment`. No additional latency for segment timestamps; word timestamps incur additional latency.
- `url` string Optional — Audio URL to translate/transcribe (supports Base64URL). Either `file` or `url` must be provided; for Batch API requests, `url` is required since `file` is not supported.

#### Response Object

- `text` string — The transcribed text.

```bash
curl https://api.groq.com/openai/v1/audio/transcriptions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file="@./sample_audio.m4a" \
  -F model="whisper-large-v3"
```

```javascript
import fs from "fs";
import Groq from "groq-sdk";

const groq = new Groq();
async function main() {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream("sample_audio.m4a"),
    model: "whisper-large-v3",
    prompt: "Specify context or spelling", // Optional
    response_format: "json", // Optional
    language: "en", // Optional
    temperature: 0.0, // Optional
  });
  console.log(transcription.text);
}
main();
```

```python
import os
from groq import Groq

client = Groq()
filename = os.path.dirname(__file__) + "/sample_audio.m4a"

with open(filename, "rb") as file:
    transcription = client.audio.transcriptions.create(
      file=(filename, file.read()),
      model="whisper-large-v3",
      prompt="Specify context or spelling",  # Optional
      response_format="json",  # Optional
      language="en",  # Optional
      temperature=0.0  # Optional
    )
    print(transcription.text)
```

Example response:

```json
{
  "text": "Your transcribed text appears here...",
  "x_groq": {
    "id": "req_unique_id"
  }
}
```

### Create translation

`POST https://api.groq.com/openai/v1/audio/translations`

Translates audio into English.

#### Request Body

- `model` string Required — ID of the model to use. `whisper-large-v3` and `whisper-large-v3-turbo` are currently available.
- `file` string Optional — Audio file object (not file name) to translate, in one of: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.
- `prompt` string Optional — Optional text to guide the model's style or continue a previous audio segment; [prompt](https://console.groq.com/docs/guides/speech-to-text/prompting) should be in English.
- `response_format` string Optional, defaults to `json`. Allowed values: `json, text, verbose_json`.
- `temperature` number Optional, defaults to `0`. Range 0-1. Same behavior as transcription's `temperature`.
- `url` string Optional — Audio URL to translate/transcribe (supports Base64URL). Either `file` or `url` must be provided; Batch API only supports `url`.

#### Response Object

- `text` string

```bash
curl https://api.groq.com/openai/v1/audio/translations \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: multipart/form-data" \
  -F file="@./sample_audio.m4a" \
  -F model="whisper-large-v3"
```

```javascript
// Default
import fs from "fs";
import Groq from "groq-sdk";

const groq = new Groq();
async function main() {
  const translation = await groq.audio.translations.create({
    file: fs.createReadStream("sample_audio.m4a"),
    model: "whisper-large-v3",
    prompt: "Specify context or spelling", // Optional
    response_format: "json", // Optional
    temperature: 0.0, // Optional
  });
  console.log(translation.text);
}
main();
```

```python
# Default
import os
from groq import Groq

client = Groq()
filename = os.path.dirname(__file__) + "/sample_audio.m4a"

with open(filename, "rb") as file:
    translation = client.audio.translations.create(
      file=(filename, file.read()),
      model="whisper-large-v3",
      prompt="Specify context or spelling",  # Optional
      response_format="json",  # Optional
      temperature=0.0  # Optional
    )
    print(translation.text)
```

Example response:

```json
{
  "text": "Your translated text appears here...",
  "x_groq": {
    "id": "req_unique_id"
  }
}
```

### Create speech

`POST https://api.groq.com/openai/v1/audio/speech`

Generates audio from the input text.

#### Request Body

- `input` string Required — The text to generate audio for.
- `model` string Required — One of the [available TTS models](https://console.groq.com/docs/text-to-speech).
- `voice` string Required — The voice to use when generating the audio. See the [list of voices](https://console.groq.com/docs/text-to-speech).
- `response_format` string Optional, defaults to `mp3`. Allowed values: `flac, mp3, mulaw, ogg, wav`.
- `sample_rate` integer Optional, defaults to `48000`. Allowed values: `8000, 16000, 22050, 24000, 32000, 44100, 48000`.
- `speed` number Optional, defaults to `1`. Range: 0.5-5. Speed of the generated audio.

#### Returns

An audio file in `wav` format.

```bash
curl https://api.groq.com/openai/v1/audio/speech \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "playai-tts",
    "input": "I love building and shipping new features for our users!",
    "voice": "Fritz-PlayAI",
    "response_format": "wav"
  }'
```

```javascript
import fs from "fs";
import path from "path";
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const speechFilePath = "speech.wav";
const model = "playai-tts";
const voice = "Fritz-PlayAI";
const text = "I love building and shipping new features for our users!";
const responseFormat = "wav";

async function main() {
  const response = await groq.audio.speech.create({
    model: model,
    voice: voice,
    input: text,
    response_format: responseFormat
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.promises.writeFile(speechFilePath, buffer);
}

main();
```

```python
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

speech_file_path = "speech.wav"
model = "playai-tts"
voice = "Fritz-PlayAI"
text = "I love building and shipping new features for our users!"
response_format = "wav"

response = client.audio.speech.create(
    model=model,
    voice=voice,
    input=text,
    response_format=response_format
)

response.write_to_file(speech_file_path)
```

## Models

### List models

`GET https://api.groq.com/openai/v1/models`

List all available [models](https://console.groq.com/docs/models).

#### Response Object

- `data` array
- `object` string — Allowed values: `list`

```bash
curl https://api.groq.com/openai/v1/models \
-H "Authorization: Bearer $GROQ_API_KEY"
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const models = await groq.models.list();
  console.log(models);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

models = client.models.list()

print(models)
```

Example response:

```json
{
  "object": "list",
  "data": [
    {
      "id": "gemma2-9b-it",
      "object": "model",
      "created": 1693721698,
      "owned_by": "Google",
      "active": true,
      "context_window": 8192,
      "public_apps": null
    },
    {
      "id": "llama3-8b-8192",
      "object": "model",
      "created": 1693721698,
      "owned_by": "Meta",
      "active": true,
      "context_window": 8192,
      "public_apps": null
    },
    {
      "id": "llama3-70b-8192",
      "object": "model",
      "created": 1693721698,
      "owned_by": "Meta",
      "active": true,
      "context_window": 8192,
      "public_apps": null
    },
    {
      "id": "whisper-large-v3-turbo",
      "object": "model",
      "created": 1728413088,
      "owned_by": "OpenAI",
      "active": true,
      "context_window": 448,
      "public_apps": null
    },
    {
      "id": "whisper-large-v3",
      "object": "model",
      "created": 1693721698,
      "owned_by": "OpenAI",
      "active": true,
      "context_window": 448,
      "public_apps": null
    },
    {
      "id": "llama-guard-3-8b",
      "object": "model",
      "created": 1693721698,
      "owned_by": "Meta",
      "active": true,
      "context_window": 8192,
      "public_apps": null
    },
    {
      "id": "distil-whisper-large-v3-en",
      "object": "model",
      "created": 1693721698,
      "owned_by": "Hugging Face",
      "active": true,
      "context_window": 448,
      "public_apps": null
    },
    {
      "id": "llama-3.1-8b-instant",
      "object": "model",
      "created": 1693721698,
      "owned_by": "Meta",
      "active": true,
      "context_window": 131072,
      "public_apps": null
    }
  ]
}
```

### Retrieve model

`GET https://api.groq.com/openai/v1/models/{model}`

Get detailed information about a [model](https://console.groq.com/docs/models).

#### Response Object

- `created` integer — Unix timestamp (seconds) when the model was created.
- `id` string — Model identifier, referenced in API endpoints.
- `object` string — Always `model`.
- `owned_by` string — Organization that owns the model.

```bash
curl https://api.groq.com/openai/v1/models/llama-3.3-70b-versatile \
-H "Authorization: Bearer $GROQ_API_KEY"
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const model = await groq.models.retrieve("llama-3.3-70b-versatile");
  console.log(model);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

model = client.models.retrieve("llama-3.3-70b-versatile")

print(model)
```

Example response:

```json
{
  "id": "llama3-8b-8192",
  "object": "model",
  "created": 1693721698,
  "owned_by": "Meta",
  "active": true,
  "context_window": 8192,
  "public_apps": null,
  "max_completion_tokens": 8192
}
```

## Batches

### Create batch

`POST https://api.groq.com/openai/v1/batches`

Creates and executes a batch from an uploaded file of requests. [Learn more](https://console.groq.com/docs/batch).

#### Request Body

- `completion_window` string Required — The time frame within which the batch should be processed. Durations from `24h` to `7d` are supported.
- `endpoint` string Required. Allowed values: `/v1/chat/completions`. The endpoint to be used for all requests in the batch.
- `input_file_id` string Required — ID of an uploaded file containing requests for the new batch (see [upload file](#upload-file)). Must be a [JSONL file](https://console.groq.com/docs/batch), uploaded with purpose `batch`. Up to 100 MB.
- `metadata` object or null Optional — Custom metadata for the batch.

#### Response Object

- `cancelled_at` integer — Unix timestamp (seconds) when the batch was cancelled.
- `cancelling_at` integer — Unix timestamp (seconds) when the batch started cancelling.
- `completed_at` integer — Unix timestamp (seconds) when the batch was completed.
- `completion_window` string — Time frame within which the batch should be processed.
- `created_at` integer — Unix timestamp (seconds) when the batch was created.
- `endpoint` string — API endpoint used by the batch.
- `error_file_id` string — ID of the file containing outputs of requests with errors.
- `errors` object
- `expired_at` integer — Unix timestamp (seconds) when the batch expired.
- `expires_at` integer — Unix timestamp (seconds) when the batch will expire.
- `failed_at` integer — Unix timestamp (seconds) when the batch failed.
- `finalizing_at` integer — Unix timestamp (seconds) when the batch started finalizing.
- `id` string
- `in_progress_at` integer — Unix timestamp (seconds) when the batch started processing.
- `input_file_id` string — ID of the input file for the batch.
- `metadata` object or null — Key-value pairs attached to the object.
- `object` string — Always `batch`.
- `output_file_id` string — ID of the file containing outputs of successfully executed requests.
- `request_counts` object — Request counts for different statuses within the batch.
- `status` string — Allowed values: `validating, failed, in_progress, finalizing, completed, expired, cancelling, cancelled`.

```bash
curl https://api.groq.com/openai/v1/batches \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input_file_id": "file_01jh6x76wtemjr74t1fh0faj5t",
    "endpoint": "/v1/chat/completions",
    "completion_window": "24h"
  }'
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const batch = await client.batches.create({
    completion_window: "24h",
    endpoint: "/v1/chat/completions",
    input_file_id: "file_01jh6x76wtemjr74t1fh0faj5t",
  });
  console.log(batch.id);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
batch = client.batches.create(
    completion_window="24h",
    endpoint="/v1/chat/completions",
    input_file_id="file_01jh6x76wtemjr74t1fh0faj5t",
)
print(batch.id)
```

Example response:

```json
{
  "id": "batch_01jh6xa7reempvjyh6n3yst2zw",
  "object": "batch",
  "endpoint": "/v1/chat/completions",
  "errors": null,
  "input_file_id": "file_01jh6x76wtemjr74t1fh0faj5t",
  "completion_window": "24h",
  "status": "validating",
  "output_file_id": null,
  "error_file_id": null,
  "finalizing_at": null,
  "failed_at": null,
  "expired_at": null,
  "cancelled_at": null,
  "request_counts": {
    "total": 0,
    "completed": 0,
    "failed": 0
  },
  "metadata": null,
  "created_at": 1736472600,
  "expires_at": 1736559000,
  "cancelling_at": null,
  "completed_at": null,
  "in_progress_at": null
}
```

### Retrieve batch

`GET https://api.groq.com/openai/v1/batches/{batch_id}`

Retrieves a batch. Same response object shape as [Create batch](#create-batch).

```bash
curl https://api.groq.com/openai/v1/batches/batch_01jh6xa7reempvjyh6n3yst2zw \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const batch = await client.batches.retrieve("batch_01jh6xa7reempvjyh6n3yst2zw");
  console.log(batch.id);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
batch = client.batches.retrieve(
    "batch_01jh6xa7reempvjyh6n3yst2zw",
)
print(batch.id)
```

### List batches

`GET https://api.groq.com/openai/v1/batches`

List your organization's batches.

#### Response Object

- `data` array
- `object` string — Allowed values: `list`

```bash
curl https://api.groq.com/openai/v1/batches \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const batchList = await client.batches.list();
  console.log(batchList.data);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
batch_list = client.batches.list()
print(batch_list.data)
```

### Cancel batch

`POST https://api.groq.com/openai/v1/batches/{batch_id}/cancel`

Cancels a batch. Same response object shape as [Create batch](#create-batch); `status` moves to `cancelling`.

```bash
curl -X POST https://api.groq.com/openai/v1/batches/batch_01jh6xa7reempvjyh6n3yst2zw/cancel \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const batch = await client.batches.cancel("batch_01jh6xa7reempvjyh6n3yst2zw");
  console.log(batch.id);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
batch = client.batches.cancel(
    "batch_01jh6xa7reempvjyh6n3yst2zw",
)
print(batch.id)
```

## Files

### Upload file

`POST https://api.groq.com/openai/v1/files`

Upload a file that can be used across various endpoints. The Batch API only supports `.jsonl`
files up to 100 MB, with a specific required [format](https://console.groq.com/docs/batch).
Contact Groq to increase these storage limits.

#### Request Body

- `file` string Required — The File object (not file name) to be uploaded.
- `purpose` string Required. Allowed values: `batch`. Use `"batch"` for the [Batch API](#batches).

#### Response Object

- `bytes` integer — Size of the file, in bytes.
- `created_at` integer — Unix timestamp (seconds) when the file was created.
- `filename` string — Name of the file.
- `id` string — File identifier, referenced in API endpoints.
- `object` string — Always `file`.
- `purpose` string — Allowed values: `batch, batch_output`.

```bash
curl https://api.groq.com/openai/v1/files \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -F purpose="batch" \
  -F "file=@batch_file.jsonl"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

const fileContent = '{"custom_id": "request-1", "method": "POST", "url": "/v1/chat/completions", "body": {"model": "llama-3.1-8b-instant", "messages": [{"role": "user", "content": "Explain the importance of fast language models"}]}}\n';

async function main() {
  const blob = new Blob([fileContent]);
  const file = new File([blob], 'batch.jsonl');

  const createdFile = await client.files.create({ file: file, purpose: 'batch' });
  console.log(createdFile.id);
}

main();
```

```python
import os
import requests # pip install requests first!

def upload_file_to_groq(api_key, file_path):
    url = "https://api.groq.com/openai/v1/files"

    headers = {
        "Authorization": f"Bearer {api_key}"
    }

    # Prepare the file and form data
    files = {
        "file": ("batch_file.jsonl", open(file_path, "rb"))
    }

    data = {
        "purpose": "batch"
    }

    # Make the POST request
    response = requests.post(url, headers=headers, files=files, data=data)

    return response.json()

# Usage example
api_key = os.environ.get("GROQ_API_KEY")
file_path = "batch_file.jsonl"  # Path to your JSONL file

try:
    result = upload_file_to_groq(api_key, file_path)
    print(result)
except Exception as e:
    print(f"Error: {e}")
```

### List files

`GET https://api.groq.com/openai/v1/files`

Returns a list of files.

#### Response Object

- `data` array
- `object` string — Allowed values: `list`

```bash
curl https://api.groq.com/openai/v1/files \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const fileList = await client.files.list();
  console.log(fileList.data);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
file_list = client.files.list()
print(file_list.data)
```

### Delete file

`DELETE https://api.groq.com/openai/v1/files/{file_id}`

Delete a file.

#### Response Object

- `deleted` boolean
- `id` string
- `object` string — Allowed values: `file`

```bash
curl -X DELETE https://api.groq.com/openai/v1/files/file_01jh6x76wtemjr74t1fh0faj5t \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
  const fileDelete = await client.files.delete("file_01jh6x76wtemjr74t1fh0faj5t");
  console.log(fileDelete);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
file_delete = client.files.delete(
    "file_01jh6x76wtemjr74t1fh0faj5t",
)
print(file_delete)
```

### Retrieve file

`GET https://api.groq.com/openai/v1/files/{file_id}`

Returns information about a file. Same response object shape as [Upload file](#upload-file).

```bash
curl https://api.groq.com/openai/v1/files/file_01jh6x76wtemjr74t1fh0faj5t \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
    const file = await client.files.info('file_01jh6x76wtemjr74t1fh0faj5t');
    console.log(file);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
file = client.files.info(
    "file_01jh6x76wtemjr74t1fh0faj5t",
)
print(file)
```

### Download file

`GET https://api.groq.com/openai/v1/files/{file_id}/content`

Returns the contents of the specified file.

#### Returns

The file content.

```bash
curl https://api.groq.com/openai/v1/files/file_01jh6x76wtemjr74t1fh0faj5t/content \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json"
```

```javascript
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

async function main() {
    const response = await client.files.content('file_01jh6x76wtemjr74t1fh0faj5t');
    console.log(response);
}

main();
```

```python
import os
from groq import Groq

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),  # This is the default and can be omitted
)
response = client.files.content(
    "file_01jh6x76wtemjr74t1fh0faj5t",
)
print(response)
```

## Fine Tuning

Fine tuning endpoints are under `https://api.groq.com/v1/fine_tunings` (note: no `/openai`
prefix) and are in closed beta. [Contact Groq](https://groq.com/contact) for more information.

### List fine tunings

`GET https://api.groq.com/v1/fine_tunings`

#### Response Object

- `data` array
- `object` string

```bash
curl https://api.groq.com/v1/fine_tunings -s \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GROQ_API_KEY"
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const fineTunings = await groq.fine_tunings.list();
    console.log(fineTunings);
}

main();
```

```python
import os

from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

fine_tunings = client.fine_tunings.list()

print(fine_tunings)
```

### Create fine tuning

`POST https://api.groq.com/v1/fine_tunings`

Creates a new fine tuning for already-uploaded files.

#### Request Body

- `base_model` string Optional — The model that the fine tune was originally trained on.
- `input_file_id` string Optional — ID of the file uploaded via the [files API](#upload-file).
- `name` string Optional — Given name for the fine tuned model.
- `type` string Optional — Type of fine tuning format, e.g. `"lora"`.

#### Response Object

- `data` object
- `id` string
- `object` string

```bash
curl https://api.groq.com/v1/fine_tunings -s \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GROQ_API_KEY" \
    -d '{
        "input_file_id": "<file-id>",
        "name": "test-1",
        "type": "lora",
        "base_model": "llama-3.1-8b-instant"
    }'
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const fineTunings = await groq.fine_tunings.create({
        input_file_id: "<file-id>",
        name: "test-1",
        type: "lora",
        base_model: "llama-3.1-8b-instant"
    });
    console.log(fineTunings);
}

main();
```

```python
import os

from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

fine_tunings = client.fine_tunings.create(
    input_file_id="<file-id>",
    name="test-1",
    type="lora",
    base_model="llama-3.1-8b-instant"
)

print(fine_tunings)
```

### Get fine tuning

`GET https://api.groq.com/v1/fine_tunings/{id}`

Retrieves an existing fine tuning by id.

#### Response Object

- `data` object
- `id` string
- `object` string

```bash
curl https://api.groq.com/v1/fine_tunings/:id -s \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GROQ_API_KEY"
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const fineTuning = await groq.fine_tunings.get({id: "<id>"});
    console.log(fineTuning);
}

main();
```

```python
import os

from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

fine_tuning = client.fine_tunings.get(id="<id>")

print(fine_tuning)
```

### Delete fine tuning

`DELETE https://api.groq.com/v1/fine_tunings/{id}`

Deletes an existing fine tuning by id.

#### Response Object

- `deleted` boolean
- `id` string
- `object` string

```bash
curl -X DELETE https://api.groq.com/v1/fine_tunings/:id -s \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $GROQ_API_KEY"
```

```javascript
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    await groq.fine_tunings.delete({id: "<id>"});
}

main();
```

```python
import os

from groq import Groq

client = Groq(
    # This is the default and can be omitted
    api_key=os.environ.get("GROQ_API_KEY"),
)

client.fine_tunings.delete(id="<id>")
```
