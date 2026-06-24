import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

import enCommon from "@/locales/en/common.json";
import enPlanner from "@/locales/en/planner.json";
import enPdf from "@/locales/en/pdf.json";
import deCommon from "@/locales/de/common.json";
import dePlanner from "@/locales/de/planner.json";
import dePdf from "@/locales/de/pdf.json";
import itCommon from "@/locales/it/common.json";
import itPlanner from "@/locales/it/planner.json";
import itPdf from "@/locales/it/pdf.json";
import hrCommon from "@/locales/hr/common.json";
import hrPlanner from "@/locales/hr/planner.json";
import hrPdf from "@/locales/hr/pdf.json";

export type TranslationDictionary = Record<string, unknown>;

export interface Dictionary {
  common: TranslationDictionary;
  planner: TranslationDictionary;
  pdf: TranslationDictionary;
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: { common: enCommon, planner: enPlanner, pdf: enPdf },
  de: { common: deCommon, planner: dePlanner, pdf: dePdf },
  it: { common: itCommon, planner: itPlanner, pdf: itPdf },
  hr: { common: hrCommon, planner: hrPlanner, pdf: hrPdf },
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export type Namespace = keyof Dictionary;

function resolveKey(namespaceDict: TranslationDictionary, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (acc, part) => (typeof acc === "object" && acc !== null ? (acc as Record<string, unknown>)[part] : undefined),
      namespaceDict
    );
}

/** Looks up a dot-notation key within one translation namespace and interpolates {var} placeholders. */
export function translate(
  dictionary: Dictionary,
  namespace: Namespace,
  key: string,
  vars?: Record<string, string | number>
): string {
  const value = resolveKey(dictionary[namespace], key);
  if (typeof value !== "string") return key;
  if (!vars) return value;

  return Object.entries(vars).reduce(
    (str, [varKey, varValue]) => str.replaceAll(`{${varKey}}`, String(varValue)),
    value
  );
}

/** Looks up a dot-notation key that resolves to a string array (e.g. translated month names). */
export function translateList(dictionary: Dictionary, namespace: Namespace, key: string): string[] {
  const value = resolveKey(dictionary[namespace], key);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
