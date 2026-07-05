"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { CommercialRelationship } from "@/lib/types";

export function CommercialDisclosure({
  relationship,
  customText,
  className,
}: {
  relationship: CommercialRelationship;
  customText?: string | null;
  className?: string;
}) {
  if (relationship === "none") return null;

  return (
    <DisclosureText customText={customText} relationship={relationship} className={className} />
  );
}

function DisclosureText({
  relationship,
  customText,
  className,
}: {
  relationship: CommercialRelationship;
  customText?: string | null;
  className?: string;
}) {
  const { t } = useLocale();
  const text = customText ?? t("partners", `disclosure.${relationship}`);

  return (
    <p
      className={cn(
        "font-sans text-xs text-muted-foreground/80 italic leading-snug",
        className
      )}
    >
      {text}
    </p>
  );
}
