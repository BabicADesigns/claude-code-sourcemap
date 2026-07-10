"use client";

/**
 * TripShareCard — DOM capture target for html-to-image.
 *
 * Renders at fixed pixel dimensions (see SHARE_CARD_DIMENSIONS).
 * The parent (ShareModal) wraps it in a CSS scale transform for preview.
 * The capture ref points directly to this element — not to the wrapper —
 * so html-to-image always captures at the real CSS dimensions.
 *
 * No external images. All backgrounds are CSS gradients. LogoMark is inline SVG.
 * This ensures html-to-image captures cleanly without CORS issues.
 *
 * Adding a new template: add a case to renderTemplate() below.
 * Adding a new format: add dimensions to SHARE_CARD_DIMENSIONS in types.ts.
 */

import { forwardRef } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import type { TripShareSnapshot, ShareFormat, ShareTemplateId } from "@/lib/share/types";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share/types";

interface TripShareCardProps {
  snapshot: TripShareSnapshot;
  format: ShareFormat;
  template: ShareTemplateId;
}

export const TripShareCard = forwardRef<HTMLDivElement, TripShareCardProps>(
  function TripShareCard({ snapshot, format, template }, ref) {
    const { width, height } = SHARE_CARD_DIMENSIONS[format];

    return (
      <div
        ref={ref}
        style={{ width, height, flexShrink: 0 }}
        className="relative overflow-hidden"
      >
        {renderTemplate(snapshot, format, template)}
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Template renderers
// ---------------------------------------------------------------------------

function renderTemplate(
  snap: TripShareSnapshot,
  format: ShareFormat,
  template: ShareTemplateId
): React.ReactNode {
  switch (template) {
    case "JOURNEY_SUMMARY":
      return <JourneySummaryCard snap={snap} format={format} />;
    case "BALKAN_STORY":
      return <BalkanStoryCard snap={snap} format={format} />;
    case "POSTCARD":
      return <PostcardStyleCard snap={snap} format={format} />;
    default:
      return <JourneySummaryCard snap={snap} format={format} />;
  }
}

// ---------------------------------------------------------------------------
// JOURNEY_SUMMARY template
// ---------------------------------------------------------------------------

function JourneySummaryCard({
  snap,
  format,
}: {
  snap: TripShareSnapshot;
  format: ShareFormat;
}) {
  const { brandConfig } = snap;

  if (format === "story") {
    return (
      <div
        className="relative flex h-full w-full flex-col"
        style={{ background: "linear-gradient(160deg, #1C1917 0%, #385048 100%)" }}
      >
        {/* Logo */}
        <div className="absolute left-6 top-6">
          <LogoMark size={22} color="#F5EEE6" />
        </div>

        {/* Main stat */}
        <div className="flex flex-1 flex-col items-center justify-center px-8 pb-8 pt-16">
          <p
            className="font-display leading-none text-cream"
            style={{ fontSize: 96, lineHeight: 1 }}
          >
            {snap.durationDays}
          </p>
          <p
            className="mt-2 font-sans uppercase tracking-[0.25em] text-cream/60"
            style={{ fontSize: 11 }}
          >
            nights
          </p>

          {/* Rose divider */}
          <div
            className="my-6"
            style={{ width: 48, height: 2, background: "#C4A096" }}
          />

          {/* Country */}
          <p
            className="text-center font-display text-cream"
            style={{ fontSize: 22 }}
          >
            {snap.countryLabel}
          </p>

          {/* Route */}
          {snap.routeText && (
            <p
              className="mt-3 text-center font-sans text-cream/60"
              style={{ fontSize: 13 }}
            >
              {snap.routeText}
            </p>
          )}

          {/* Month + pace */}
          <p
            className="mt-2 text-center font-sans text-cream/40"
            style={{ fontSize: 11 }}
          >
            {snap.month} · {snap.paceLabel} pace
          </p>

          {/* Stats row */}
          {snap.stopCount > 0 && (
            <div className="mt-8 flex gap-6">
              <div className="text-center">
                <p
                  className="font-display text-cream"
                  style={{ fontSize: 28 }}
                >
                  {snap.stopCount}
                </p>
                <p
                  className="font-sans uppercase tracking-widest text-cream/40"
                  style={{ fontSize: 9 }}
                >
                  stops
                </p>
              </div>
              {snap.dayTripCount !== null && snap.dayTripCount > 0 && (
                <div className="text-center">
                  <p
                    className="font-display text-cream"
                    style={{ fontSize: 28 }}
                  >
                    {snap.dayTripCount}
                  </p>
                  <p
                    className="font-sans uppercase tracking-widest text-cream/40"
                    style={{ fontSize: 9 }}
                  >
                    day trips
                  </p>
                </div>
              )}
              {snap.totalDistanceKm !== null && (
                <div className="text-center">
                  <p
                    className="font-display text-cream"
                    style={{ fontSize: 28 }}
                  >
                    {snap.totalDistanceKm.toLocaleString()}
                  </p>
                  <p
                    className="font-sans uppercase tracking-widest text-cream/40"
                    style={{ fontSize: 9 }}
                  >
                    km
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Attribution */}
        {brandConfig.attributionEnabled && (
          <div className="flex items-center justify-center pb-5">
            <p
              className="font-sans tracking-wide text-cream/30"
              style={{ fontSize: 9 }}
            >
              {brandConfig.shortAttribution}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (format === "feed") {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center px-10"
        style={{ background: "#F5EEE6" }}
      >
        {/* Logo */}
        <div className="absolute left-6 top-6">
          <LogoMark size={20} color="#385048" />
        </div>

        {/* Eyebrow */}
        <p
          className="mb-2 font-sans uppercase tracking-[0.18em] text-sage-dark/50"
          style={{ fontSize: 10 }}
        >
          my trip plan
        </p>

        {/* Big stat */}
        <p
          className="font-display leading-none text-sage-dark"
          style={{ fontSize: 64 }}
        >
          {snap.durationDays}
        </p>
        <p
          className="mt-1 font-sans uppercase tracking-[0.2em] text-sage-dark/60"
          style={{ fontSize: 11 }}
        >
          nights in {snap.countryLabel}
        </p>

        {/* Rose divider */}
        <div
          className="my-5"
          style={{ width: 48, height: 1.5, background: "#C4A096" }}
        />

        {/* Route */}
        {snap.routeText && (
          <p
            className="text-center font-sans text-sage"
            style={{ fontSize: 13 }}
          >
            {snap.routeText}
          </p>
        )}

        {/* Stats */}
        <p
          className="mt-2 font-sans text-sage-dark/40"
          style={{ fontSize: 11 }}
        >
          {[
            snap.stopCount > 0 && `${snap.stopCount} stops`,
            snap.month,
            snap.paceLabel,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {/* Attribution */}
        {brandConfig.attributionEnabled && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <p
              className="font-sans tracking-wide text-sage-dark/25"
              style={{ fontSize: 9 }}
            >
              {brandConfig.shortAttribution}
            </p>
          </div>
        )}
      </div>
    );
  }

  // postcard format
  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{ background: "#F5EEE6", border: "5px solid #1C1917" }}
    >
      {/* Logo top-left */}
      <div className="absolute left-5 top-5">
        <LogoMark size={18} color="#385048" />
      </div>

      {/* Stamp-style badge top-right */}
      <div
        className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ border: "2px dashed #C4A096" }}
      >
        <p
          className="text-center font-sans uppercase leading-tight text-rose/80"
          style={{ fontSize: 7, letterSpacing: "0.12em" }}
        >
          Balkan
          <br />
          Plan
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-10">
        <p
          className="mb-1 font-sans uppercase tracking-[0.18em] text-sage-dark/40"
          style={{ fontSize: 9 }}
        >
          balkan itinerary
        </p>
        <p
          className="font-display leading-tight text-sage-dark"
          style={{ fontSize: 40 }}
        >
          {snap.durationDays} nights
        </p>
        <p
          className="mt-1 font-display text-rose"
          style={{ fontSize: 22 }}
        >
          {snap.countryLabel}
        </p>

        {/* Divider */}
        <div
          className="my-5"
          style={{ width: 40, height: 1, background: "#C4A096" }}
        />

        {snap.routeText && (
          <p
            className="text-center font-sans text-sage-dark"
            style={{ fontSize: 12 }}
          >
            {snap.routeText}
          </p>
        )}
        <p
          className="mt-2 font-sans text-sage-dark/50"
          style={{ fontSize: 11 }}
        >
          {[snap.stopCount > 0 && `${snap.stopCount} stops`, snap.month]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {/* Attribution */}
      {brandConfig.attributionEnabled && (
        <div className="flex items-center justify-center pb-4">
          <p
            className="font-sans tracking-wide text-sage-dark/25"
            style={{ fontSize: 9 }}
          >
            {brandConfig.shortAttribution}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BALKAN_STORY template
// ---------------------------------------------------------------------------

function BalkanStoryCard({
  snap,
  format,
}: {
  snap: TripShareSnapshot;
  format: ShareFormat;
}) {
  const { brandConfig } = snap;

  if (format === "story") {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center px-8"
        style={{ background: "#F5EEE6" }}
      >
        {/* Subtle rose corner accent */}
        <div
          className="absolute right-0 top-0"
          style={{
            width: 120,
            height: 120,
            background:
              "radial-gradient(circle at top right, #C4A09620 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div className="absolute left-6 top-6">
          <LogoMark size={20} color="#C4A096" />
        </div>

        {/* Italic eyebrow */}
        <p
          className="mb-8 font-serif italic text-sage-dark/60"
          style={{ fontSize: 14 }}
        >
          My Balkan Story
        </p>

        {/* Huge number */}
        <p
          className="font-display leading-none text-charcoal"
          style={{ fontSize: 112 }}
        >
          {snap.durationDays}
        </p>
        <p
          className="mt-1 font-sans uppercase tracking-[0.22em] text-rose"
          style={{ fontSize: 11 }}
        >
          nights
        </p>

        {/* Country / multi-country */}
        <p
          className="mt-8 text-center font-display text-sage-dark"
          style={{ fontSize: 24 }}
        >
          {snap.routeText ?? snap.countryLabel}
        </p>

        {/* Month */}
        <p
          className="mt-2 font-sans text-sage-dark/50"
          style={{ fontSize: 12 }}
        >
          {snap.month} · {snap.paceLabel} pace
        </p>

        {brandConfig.attributionEnabled && (
          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <p
              className="font-sans tracking-wide text-sage-dark/25"
              style={{ fontSize: 9 }}
            >
              {brandConfig.shortAttribution}
            </p>
          </div>
        )}
      </div>
    );
  }

  // feed + postcard share similar landscape layout
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center px-8"
      style={{
        background:
          "linear-gradient(135deg, #F5EEE6 0%, #EDE4D8 100%)",
      }}
    >
      <LogoMark size={18} color="#8B9B7A" />

      <p
        className="mt-4 font-serif italic text-sage-dark/60"
        style={{ fontSize: 13 }}
      >
        My Balkan Story
      </p>

      <p
        className="mt-2 font-display text-charcoal"
        style={{ fontSize: format === "feed" ? 52 : 44 }}
      >
        {snap.durationDays}
      </p>
      <p
        className="font-sans uppercase tracking-widest text-rose"
        style={{ fontSize: 10 }}
      >
        nights
      </p>

      <div
        className="my-4"
        style={{ width: 32, height: 1, background: "#C4A096" }}
      />

      <p
        className="text-center font-display text-sage-dark"
        style={{ fontSize: 18 }}
      >
        {snap.countryLabel}
      </p>
      {snap.routeText && (
        <p
          className="mt-2 text-center font-sans text-sage-dark/50"
          style={{ fontSize: 11 }}
        >
          {snap.routeText}
        </p>
      )}

      {brandConfig.attributionEnabled && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <p
            className="font-sans tracking-wide text-sage-dark/25"
            style={{ fontSize: 9 }}
          >
            {brandConfig.shortAttribution}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// POSTCARD template
// ---------------------------------------------------------------------------

function PostcardStyleCard({
  snap,
  format,
}: {
  snap: TripShareSnapshot;
  format: ShareFormat;
}) {
  const { brandConfig } = snap;

  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={{ background: "#F5EEE6" }}
    >
      {/* Textured stamp corner */}
      <div
        className="absolute right-4 top-4"
        style={{
          width: 52,
          height: 64,
          border: "1.5px solid #C4A096",
          padding: 4,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #C4A09660",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontSize: 6,
              letterSpacing: "0.08em",
              color: "#C4A09699",
              fontFamily: "inherit",
              textTransform: "uppercase",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Balkan
            <br />
            Travel
          </p>
        </div>
      </div>

      {/* Postmark circle */}
      <div
        className="absolute left-4 top-4 flex h-12 w-12 flex-col items-center justify-center rounded-full"
        style={{ border: "1.5px solid #38504860" }}
      >
        <p
          style={{
            fontSize: 6,
            color: "#38504870",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {snap.month.slice(0, 3).toUpperCase()}
        </p>
      </div>

      {/* Main content */}
      <div
        className="flex flex-1 flex-col justify-center px-10"
        style={{ paddingTop: format === "postcard" ? 80 : 60 }}
      >
        <p
          className="font-sans uppercase tracking-[0.15em] text-sage-dark/40"
          style={{ fontSize: 9 }}
        >
          with love from
        </p>
        <p
          className="mt-1 font-display text-sage-dark"
          style={{ fontSize: format === "postcard" ? 38 : 32 }}
        >
          {snap.countryLabel}
        </p>
        <p
          className="mt-1 font-serif italic text-rose"
          style={{ fontSize: 16 }}
        >
          {snap.durationDays} nights, {snap.month}
        </p>

        {snap.routeText && (
          <p
            className="mt-4 font-sans text-sage-dark/60"
            style={{ fontSize: 12 }}
          >
            {snap.routeText}
          </p>
        )}

        {snap.stopCount > 0 && (
          <p
            className="mt-2 font-sans text-sage-dark/40"
            style={{ fontSize: 11 }}
          >
            {snap.stopCount} stops
            {snap.dayTripCount !== null && snap.dayTripCount > 0
              ? ` · ${snap.dayTripCount} day trips`
              : ""}
          </p>
        )}
      </div>

      {/* Divider line */}
      {format === "postcard" && (
        <div
          className="mx-10"
          style={{ height: 1, background: "#38504820", marginBottom: 60 }}
        />
      )}

      {/* Attribution */}
      {brandConfig.attributionEnabled && (
        <div className="flex items-center justify-center pb-4">
          <p
            className="font-sans tracking-wide text-sage-dark/25"
            style={{ fontSize: 9 }}
          >
            {brandConfig.shortAttribution}
          </p>
        </div>
      )}
    </div>
  );
}
