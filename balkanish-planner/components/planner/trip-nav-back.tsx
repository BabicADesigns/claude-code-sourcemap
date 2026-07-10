"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";

export function TripNavBack({ tripId }: { tripId: string }) {
  const { t } = useLocale();

  return (
    <div className="mb-6 flex gap-4">
      <Link
        href="/my-trips"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("common", "navigation.backToMyTrips")}
      </Link>
      <Link
        href={`/trips/${tripId}/today`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("common", "navigation.todayView")}
      </Link>
    </div>
  );
}

export function TripNavBackSimple() {
  const { t } = useLocale();

  return (
    <div className="mb-6">
      <Link
        href="/my-trips"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("common", "navigation.backToMyTrips")}
      </Link>
    </div>
  );
}

export function TripNavLiveTrip({ tripId }: { tripId: string }) {
  const { t } = useLocale();

  return (
    <div className="mb-6 flex gap-4">
      <Link
        href="/my-trips"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("common", "navigation.backToMyTrips")}
      </Link>
      <Link
        href={`/trips/${tripId}/companion`}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {t("common", "navigation.companion")}
      </Link>
    </div>
  );
}
