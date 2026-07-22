import { z } from 'zod'
import { Box, Text } from 'ink'
import * as React from 'react'
import { Tool } from '../../Tool.js'
import { DESCRIPTION, PROMPT, TOOL_NAME_FOR_PROMPT } from './prompt.js'
import { FallbackToolUseRejectedMessage } from '../../components/FallbackToolUseRejectedMessage.js'

const DEFAULT_LIBRETRANSLATE_URL = 'https://libretranslate.com'

const inputSchema = z.strictObject({
  text: z.string().describe('The text to translate'),
  target_lang: z
    .string()
    .describe(
      'ISO 639-1 code of the language to translate into (e.g. "es", "fr", "ja")',
    ),
  source_lang: z
    .string()
    .optional()
    .describe(
      'ISO 639-1 code of the source language. Defaults to "auto" to auto-detect.',
    ),
})

type Input = typeof inputSchema
type Output = {
  translatedText: string
  detectedSourceLang?: string
}

export const TranslateTool = {
  name: TOOL_NAME_FOR_PROMPT,
  async description() {
    return DESCRIPTION
  },
  userFacingName() {
    return 'Translate'
  },
  inputSchema,
  isReadOnly() {
    return true
  },
  async isEnabled() {
    return true
  },
  needsPermissions() {
    return false
  },
  async prompt() {
    return PROMPT
  },
  renderToolUseMessage({ text, target_lang, source_lang }) {
    const preview = text.length > 50 ? `${text.slice(0, 50)}...` : text
    return `text: "${preview}", target_lang: "${target_lang}"${source_lang ? `, source_lang: "${source_lang}"` : ''}`
  },
  renderToolUseRejectedMessage() {
    return <FallbackToolUseRejectedMessage />
  },
  renderToolResultMessage(output) {
    return (
      <Box justifyContent="space-between" width="100%">
        <Box flexDirection="row">
          <Text>&nbsp;&nbsp;⎿ &nbsp;</Text>
          <Text>{output.translatedText}</Text>
        </Box>
      </Box>
    )
  },
  renderResultForAssistant({ translatedText }) {
    return translatedText
  },
  async *call({ text, target_lang, source_lang }, { abortController }) {
    const baseUrl = (
      process.env.LIBRETRANSLATE_URL ?? DEFAULT_LIBRETRANSLATE_URL
    ).replace(/\/+$/, '')
    const apiKey = process.env.LIBRETRANSLATE_API_KEY

    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortController.signal,
      body: JSON.stringify({
        q: text,
        source: source_lang ?? 'auto',
        target: target_lang,
        format: 'text',
        ...(apiKey ? { api_key: apiKey } : {}),
      }),
    })

    if (!response.ok) {
      throw new Error(
        `LibreTranslate request failed: ${response.status} ${response.statusText}`,
      )
    }

    const json = (await response.json()) as {
      translatedText: string
      detectedLanguage?: { language: string }
    }

    const output = {
      translatedText: json.translatedText,
      detectedSourceLang: json.detectedLanguage?.language,
    }

    yield {
      type: 'result',
      resultForAssistant: this.renderResultForAssistant(output),
      data: output,
    }
  },
} satisfies Tool<Input, Output>
