import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { mainNav } from "@/lib/nav";
import { getDictionary, translate } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

export function SiteFooter({ locale }: { locale: Locale }) {
  const dictionary = getDictionary(locale);
  const t = (key: string) => translate(dictionary, "common", key);

  return (
    <footer className="border-t border-border bg-sage-dark text-cream print:hidden">
      <div className="container py-10 sm:py-14">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={32} color="#F5EEE6" />
              <div>
                <p className="font-display text-lg font-semibold">BabicADesigns</p>
                <p className="font-script text-xs italic text-rose">The Balkanish AI Way</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs font-serif text-sm text-cream/80">{t("footer.tagline")}</p>
          </div>

          <div>
            <p className="mb-3 font-sans text-xs uppercase tracking-widest text-cream/60">
              {t("footer.exploreHeading")}
            </p>
            <ul className="space-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="font-sans text-sm text-cream/85 hover:text-rose">
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-sans text-xs uppercase tracking-widest text-cream/60">{t("footer.moreHeading")}</p>
            <ul className="space-y-2">
              <li>
                <Link href="/guides" className="font-sans text-sm text-cream/85 hover:text-rose">
                  {t("footer.premiumGuides")}
                </Link>
              </li>
              <li>
                <a href="https://babicadesigns.blog" className="font-sans text-sm text-cream/85 hover:text-rose">
                  babicadesigns.blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="lace-divider mt-10 opacity-60" aria-hidden="true" />

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="font-serif text-sm text-cream/75">{t("footer.madeIn")}</p>
          <p className="font-serif text-sm text-cream/75">{t("footer.copyright")}</p>
          <p className="font-serif text-sm text-cream/75">{t("footer.createdWith")}</p>
        </div>
      </div>
    </footer>
  );
}
