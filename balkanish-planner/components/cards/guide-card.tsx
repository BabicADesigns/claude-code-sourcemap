"use client";

import type { PremiumGuide } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorialImage } from "@/components/brand/editorial";
import { BookOpen, MapPin } from "lucide-react";

export function GuideCard({ guide }: { guide: PremiumGuide }) {
  const { t } = useLocale();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative">
        <EditorialImage
          src={guide.cover_image_url}
          alt={guide.title}
          className="aspect-[3/4]"
          sizes="(min-width: 1024px) 25vw, 50vw"
        >
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 z-20">
            <Badge variant="accent" className="font-sans text-xs font-semibold">
              {formatEUR(guide.price_eur)}
            </Badge>
            {guide.is_sample && (
              <span className="rounded-full bg-sage-dark/80 px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-widest text-cream backdrop-blur-sm">
                Sample available
              </span>
            )}
          </div>
        </EditorialImage>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:gap-2.5 sm:p-5">
        <h3 className="font-display text-xl leading-snug text-sage-dark sm:text-2xl">{guide.title}</h3>

        {(guide.page_count || guide.destination_count) && (
          <div className="flex flex-wrap items-center gap-3">
            {guide.destination_count && (
              <span className="flex items-center gap-1 font-sans text-xs text-foreground/60">
                <MapPin className="h-3 w-3 text-accent" aria-hidden="true" />
                {t("common", "guides.destinations").replace("{n}", String(guide.destination_count))}
              </span>
            )}
            {guide.page_count && (
              <span className="flex items-center gap-1 font-sans text-xs text-foreground/60">
                <BookOpen className="h-3 w-3 text-accent" aria-hidden="true" />
                {t("common", "guides.pages").replace("{n}", String(guide.page_count))}
              </span>
            )}
          </div>
        )}

        <p className="line-clamp-3 flex-1 font-serif text-sm text-foreground/80 sm:line-clamp-4">
          {guide.description}
        </p>

        <Button disabled className="mt-2 w-full">
          {t("common", "guides.checkoutSoon")}
        </Button>
      </div>
    </div>
  );
}
