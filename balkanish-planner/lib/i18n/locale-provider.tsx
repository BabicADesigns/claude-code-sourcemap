"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { getDictionary, translate, translateList, type Namespace } from "@/lib/i18n/dictionaries";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (namespace: Namespace, key: string, vars?: Record<string, string | number>) => string;
  tList: (namespace: Namespace, key: string) => string[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    },
    [router]
  );

  const t = useCallback(
    (namespace: Namespace, key: string, vars?: Record<string, string | number>) =>
      translate(dictionary, namespace, key, vars),
    [dictionary]
  );

  const tList = useCallback(
    (namespace: Namespace, key: string) => translateList(dictionary, namespace, key),
    [dictionary]
  );

  const value = useMemo(() => ({ locale, setLocale, t, tList }), [locale, setLocale, t, tList]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
