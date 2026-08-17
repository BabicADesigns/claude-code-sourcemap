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

/**
 * Forward handoff rendered below Trip Companion content.
 * href determines which i18n label to use:
 *  - contains "/today"      → navigation.goToLiveTrip
 *  - contains "/reflection" → navigation.reflectOnTrip
 */
export function TripCompanionForwardHandoff({ href }: { href: string }) {
  const { t } = useLocale();
  const label = href.includes("/today")
    ? t("common", "navigation.goToLiveTrip")
    : t("common", "navigation.reflectOnTrip");

  return (
    <div className="mt-8 border-t border-border pt-6">
      <Link href={href} className="font-medium text-accent hover:underline">
        {label}
      </Link>
    </div>
  );
}

/**
 * Forward handoff rendered below Trip Reflection content for COMPLETED lifecycle.
 * Links to /planner to plan next trip.
 */
export function ReflectionForwardHandoff() {
  const { t } = useLocale();

  return (
    <div className="mt-8 border-t border-border pt-6">
      <Link href="/planner" className="font-medium text-accent hover:underline">
        {t("common", "navigation.planNextTrip")} →
      </Link>
    </div>
  );
}
