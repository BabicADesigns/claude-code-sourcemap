import type { Locale } from "@/lib/i18n/config";
import type { LocalizedText } from "@/lib/types";

/**
 * Resolves an ImageAsset caption (a plain string, or a `LocalizedText` map) down to one locale's
 * text. Plain strings are treated as the `en` value regardless of the requested locale — that's
 * the entire migration story for the ~105 pre-Phase-12 captions: nothing needs rewriting for this
 * to keep working, and a locale gains a real translation only when someone hand-adds one.
 */
export function resolveCaption(
  caption: string | LocalizedText | undefined,
  locale: Locale
): string | undefined {
  if (caption === undefined) return undefined;
  if (typeof caption === "string") return caption;
  return caption[locale] ?? caption.en;
}
