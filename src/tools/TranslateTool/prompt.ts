export const TOOL_NAME_FOR_PROMPT = 'Translate'

export const DESCRIPTION =
  'Translates text between languages using a LibreTranslate instance'

export const PROMPT = `Translates text between languages using LibreTranslate (https://github.com/LibreTranslate/LibreTranslate), a free and open source machine translation API.

Usage notes:
- Provide the \`text\` to translate and \`target_lang\` as an ISO 639-1 code (e.g. "es", "fr", "de", "ja")
- \`source_lang\` defaults to "auto" to auto-detect the source language
- By default this connects to the public instance at https://libretranslate.com. Set the \`LIBRETRANSLATE_URL\` environment variable to point at a self-hosted instance, and \`LIBRETRANSLATE_API_KEY\` if that instance requires an API key
- Use this tool when the user asks you to translate text, localize strings, or understand content written in another language`
