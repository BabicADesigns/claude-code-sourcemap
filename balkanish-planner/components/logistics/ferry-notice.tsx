"use client";

import type { FerryInfo } from "@/lib/types";
import { useLocale } from "@/lib/i18n/locale-provider";

/** Standalone ferry notice card — used when a ferry is required between two stops. */
export function FerryNotice({ ferry, destinationName }: { ferry: FerryInfo; destinationName?: string }) {
  const { t } = useLocale();

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">
        {t("logistics", "ferryNotice.heading")}
        {destinationName ? ` — ${destinationName}` : ""}
      </p>

      {ferry.operator_name && (
        <p className="mt-2 font-sans text-sm font-medium text-foreground">{ferry.operator_name}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-foreground/70">
        {ferry.vehicle_capable && <span>{t("logistics", "ferryNotice.vehicleCapable")}</span>}
        {ferry.advance_booking_required && (
          <span className="text-accent">{t("logistics", "ferryNotice.advanceBooking")}</span>
        )}
        {ferry.last_verified_season && (
          <span className="text-foreground/50">
            {t("logistics", "ferryNotice.lastVerified", { season: ferry.last_verified_season })}
          </span>
        )}
      </div>

      {ferry.frequency_hint && (
        <p className="mt-2 font-serif text-sm text-foreground/80">{ferry.frequency_hint}</p>
      )}

      {ferry.booking_tip && (
        <p className="mt-1 font-serif text-sm italic text-foreground/70">{ferry.booking_tip}</p>
      )}

      <p className="mt-3 font-sans text-xs text-foreground/50">{t("logistics", "ferryNotice.disclaimer")}</p>
    </div>
  );
}
