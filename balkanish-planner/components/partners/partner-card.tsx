"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { LocalPartner } from "@/lib/types";
import { TrustBadge } from "@/components/partners/trust-badge";
import { CommercialDisclosure } from "@/components/partners/commercial-disclosure";

export function PartnerCard({
  partner,
  className,
}: {
  partner: LocalPartner;
  className?: string;
}) {
  const { t } = useLocale();

  const primaryCta = resolvePrimaryCta(partner);

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background p-4 sm:p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("partners", `categories.${partner.category}`)}
          </span>
          <h4 className="font-display text-lg text-sage-dark leading-tight">{partner.name}</h4>
        </div>
        <TrustBadge level={partner.trust_level} showHint />
      </div>

      <p className="font-serif text-sm text-foreground/85 leading-relaxed">
        {partner.short_description}
      </p>

      {partner.editorial_note && (
        <p className="font-serif text-sm text-foreground/70 leading-relaxed border-l-2 border-terracotta/40 pl-3">
          {partner.editorial_note}
        </p>
      )}

      {partner.founder_note && partner.trust_level === "founder_pick" && (
        <blockquote className="font-serif text-sm italic text-foreground/75 border-l-2 border-terracotta/60 pl-3">
          &ldquo;{partner.founder_note}&rdquo;
        </blockquote>
      )}

      {primaryCta && (
        <a
          href={primaryCta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start rounded-full border border-sage-dark/30 bg-sage-dark/5 px-3 py-1.5 font-sans text-xs uppercase tracking-widest text-sage-dark transition-colors hover:bg-sage-dark/10"
        >
          {t("partners", `cta.${primaryCta.type}`)}
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="sr-only">{t("partners", "cta.external_note")}</span>
        </a>
      )}

      <CommercialDisclosure
        relationship={partner.commercial_relationship}
        customText={partner.disclosure_text}
        className="mt-auto pt-1"
      />
    </div>
  );
}

function resolvePrimaryCta(
  partner: LocalPartner
): { type: string; url: string } | null {
  if (partner.booking_url) return { type: "booking", url: partner.booking_url };
  if (partner.website_url) return { type: "website", url: partner.website_url };
  if (partner.app_url) return { type: "app", url: partner.app_url };
  if (partner.instagram_url) return { type: "instagram", url: partner.instagram_url };
  return null;
}
