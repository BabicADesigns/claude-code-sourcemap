import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import { PLANNER_STYLE_LABELS, ITINERARY_FOCUS_LABELS, TRIP_PACE_LABELS, ROUTE_VARIANT_LABELS } from "@/lib/types";
import { ItineraryMapPdf } from "@/components/planner/itinerary-map-pdf";
import { buildMapModel } from "@/lib/maps/itinerary-map-model";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getDictionary, translate } from "@/lib/i18n/dictionaries";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Future photography architecture (not yet wired — see docs/image-direction-v2.md §6):
 * once real on-location photography exists, this document would gain an `Image` import
 * from "@react-pdf/renderer" and render destination/food photos in four places — cover,
 * the destination-facing sections (Daily Itinerary, Day Trips), Map Overview, and Food
 * Recommendations — each marked with a comment at the relevant spot below. Left unwired
 * for now because `@react-pdf/renderer`'s `Image` resolves its `src` over the network at
 * render time; doing that with the current picsum.photos placeholders would make every
 * PDF export depend on a third-party image host, which is a reliability change beyond
 * "architecture only." Reserved style slots are defined alongside the rest of `styles`
 * below so the layout math (dimensions, spacing) is already decided.
 */

const COLOR = {
  sageDark: "#385048",
  sage: "#8B9B7A",
  rose: "#C4A096",
  cream: "#F5EEE6",
  charcoal: "#1C1917",
  muted: "#6B6B63",
  hairline: "#E3D9C9",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 54,
    paddingHorizontal: 40,
    fontSize: 11,
    color: COLOR.charcoal,
    backgroundColor: COLOR.cream,
  },
  coverPage: {
    paddingHorizontal: 44,
    paddingVertical: 56,
    height: "100%",
    backgroundColor: COLOR.sageDark,
    justifyContent: "space-between",
  },
  coverEyebrow: { fontSize: 11, letterSpacing: 2, color: COLOR.rose, textTransform: "uppercase" },
  coverTitle: { fontSize: 30, lineHeight: 1.3, marginTop: 16, color: COLOR.cream },
  coverMeta: { fontSize: 12, marginTop: 18, color: COLOR.cream },
  coverStopsLabel: { fontSize: 10, letterSpacing: 1.5, color: COLOR.rose, textTransform: "uppercase", marginBottom: 8 },
  coverStop: { fontSize: 12, marginBottom: 4, color: COLOR.cream },
  coverBrand: { fontSize: 13, color: COLOR.cream },
  coverBrandScript: { fontSize: 10, color: COLOR.rose, marginTop: 3, fontStyle: "italic" },
  sectionEyebrow: { fontSize: 10, letterSpacing: 1.5, color: COLOR.rose, textTransform: "uppercase", marginBottom: 6 },
  sectionTitle: { fontSize: 20, color: COLOR.sageDark, marginBottom: 16 },
  text: { fontSize: 10.5, lineHeight: 1.5, marginBottom: 4, color: COLOR.charcoal },
  label: {
    fontSize: 9.5,
    fontWeight: 700,
    color: COLOR.sageDark,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dayBlock: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  dayEyebrow: { fontSize: 9.5, letterSpacing: 1.5, color: COLOR.muted, textTransform: "uppercase", marginBottom: 2 },
  dayTitle: { fontSize: 14, color: COLOR.sage, marginBottom: 4 },
  listItem: { fontSize: 10.5, lineHeight: 1.5, marginBottom: 6, color: COLOR.charcoal },
  dayTripCard: { marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  dayTripEyebrow: { fontSize: 9.5, letterSpacing: 1.5, color: COLOR.rose, textTransform: "uppercase", marginBottom: 3 },
  dayTripTitle: { fontSize: 14, color: COLOR.sageDark, marginBottom: 2 },
  mapImageWrap: { alignItems: "center", marginBottom: 18 },
  mapLegendItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 7 },
  mapLegendMarkerWrap: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLOR.sageDark,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLegendMarkerText: { fontSize: 8, color: COLOR.cream },
  mapLegendDayTripMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLOR.rose,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  mapLegendDayTripDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLOR.rose },
  summaryFactsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  summaryFact: { marginRight: 22, marginBottom: 8, minWidth: 90 },
  summaryFactLabel: { fontSize: 8.5, letterSpacing: 1, color: COLOR.muted, textTransform: "uppercase", marginBottom: 3 },
  summaryFactValue: { fontSize: 12, color: COLOR.sageDark },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: COLOR.muted },

  // --- Reserved photography slots (unused today — see the file-level comment above) ---
  /** Would sit as a full-bleed background layer behind the cover's text block, e.g. the trip's first stop's hero_image. */
  coverImageSlot: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  /** A small destination thumbnail next to a Daily Itinerary day's title or a Day Trip card's title. */
  destinationThumb: { width: 64, height: 64, borderRadius: 4, marginBottom: 6 },
  /** A small circular destination photo beside a Map Overview legend row, in place of the numbered marker text. */
  mapStopThumb: { width: 16, height: 16, borderRadius: 8 },
  /** A small square photo beside a Food Recommendations list item, once restaurant picks carry an ImageAsset. */
  foodItemThumb: { width: 40, height: 40, borderRadius: 4, marginRight: 8 },
});

function PageFooter({ t }: { t: Translate }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{t("footer.tagline")}</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function ItineraryPdfDocument({
  itinerary,
  input,
  locale = DEFAULT_LOCALE,
}: {
  itinerary: GeneratedItinerary;
  input: PlannerInput;
  locale?: Locale;
}) {
  const mapModel = buildMapModel(itinerary);
  const dictionary = getDictionary(locale);
  const t: Translate = (key, vars) => translate(dictionary, "pdf", key, vars);

  return (
    <Document title={itinerary.trip_title}>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        {/*
          Future photography slot: an `<Image style={styles.coverImageSlot} src={...} />`
          would render here, behind the text blocks below, using the first stop's
          hero_image (mapModel.stops[0].slug → getDestinationBySlug → hero_image.url).
        */}
        <View>
          <Text style={styles.coverEyebrow}>
            {t("cover.eyebrowPrefix")} · {ITINERARY_FOCUS_LABELS[itinerary.focus]}
          </Text>
          <Text style={styles.coverTitle}>{itinerary.trip_title}</Text>
          <Text style={styles.coverMeta}>
            {input.durationDays} days · {input.month} · {PLANNER_STYLE_LABELS[input.plannerStyle]}
          </Text>
          <Text style={styles.coverMeta}>
            {ROUTE_VARIANT_LABELS[itinerary.variant]} · {TRIP_PACE_LABELS[itinerary.pace]} {t("cover.paceSuffix")}
          </Text>
        </View>

        <View>
          <Text style={styles.coverStopsLabel}>{t("cover.routeLabel")}</Text>
          {mapModel.stops.map((stop) => (
            <Text key={stop.slug} style={styles.coverStop}>
              {stop.order}. {stop.name}
            </Text>
          ))}
        </View>

        <View>
          <Text style={styles.coverBrand}>{t("cover.brand")}</Text>
          <Text style={styles.coverBrandScript}>{t("cover.brandScript")}</Text>
        </View>
      </Page>

      {/* Trip Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("sections.tripSummary.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{itinerary.trip_title}</Text>
        <Text style={styles.text}>{itinerary.overview}</Text>

        <View style={[styles.summaryFactsRow, { marginTop: 14 }]}>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.duration")}</Text>
            <Text style={styles.summaryFactValue}>{input.durationDays} days</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.travelMonth")}</Text>
            <Text style={styles.summaryFactValue}>{input.month}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.travelStyle")}</Text>
            <Text style={styles.summaryFactValue}>{PLANNER_STYLE_LABELS[input.plannerStyle]}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.tripFocus")}</Text>
            <Text style={styles.summaryFactValue}>{ITINERARY_FOCUS_LABELS[itinerary.focus]}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.route")}</Text>
            <Text style={styles.summaryFactValue}>{ROUTE_VARIANT_LABELS[itinerary.variant]}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.pace")}</Text>
            <Text style={styles.summaryFactValue}>{TRIP_PACE_LABELS[itinerary.pace]}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.stops")}</Text>
            <Text style={styles.summaryFactValue}>{mapModel.stops.length}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.dayTrips")}</Text>
            <Text style={styles.summaryFactValue}>{itinerary.day_trips.length}</Text>
          </View>
          <View style={styles.summaryFact}>
            <Text style={styles.summaryFactLabel}>{t("summaryFacts.avgDistance")}</Text>
            <Text style={styles.summaryFactValue}>{itinerary.route_summary.average_distance_km} km</Text>
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>{t("summaryFacts.whatToPack")}</Text>
        {itinerary.packing_list.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}

        <PageFooter t={t} />
      </Page>

      {/* Why These Stops */}
      {itinerary.selection_reasons.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionEyebrow}>{t("sections.whyTheseStops.eyebrow")}</Text>
          <Text style={styles.sectionTitle}>{t("sections.whyTheseStops.title")}</Text>
          {itinerary.selection_reasons.map((reason) => (
            <View key={reason.destination_slug} style={styles.dayTripCard} wrap={false}>
              <Text style={styles.dayTripTitle}>{reason.destination_name}</Text>
              <Text style={styles.text}>{reason.reason}</Text>
            </View>
          ))}
          <PageFooter t={t} />
        </Page>
      )}

      {/* Daily Itinerary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("sections.dailyItinerary.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("sections.dailyItinerary.title")}</Text>
        {itinerary.days.map((day) => (
          <View key={day.day} style={styles.dayBlock} wrap={false}>
            {/*
              Future photography slot: a `<Image style={styles.destinationThumb} src={...} />`
              would render here, sourced by matching this day number against
              itinerary.map_points (slug → getDestinationBySlug → hero_image.url).
            */}
            <Text style={styles.dayEyebrow}>{t("day.dayLabel", { day: day.day })}</Text>
            <Text style={styles.dayTitle}>{day.title}</Text>
            <Text style={styles.text}>{day.summary}</Text>
            <Text style={styles.label}>{t("day.morning")}</Text>
            <Text style={styles.text}>{day.morning}</Text>
            <Text style={styles.label}>{t("day.afternoon")}</Text>
            <Text style={styles.text}>{day.afternoon}</Text>
            <Text style={styles.label}>{t("day.evening")}</Text>
            <Text style={styles.text}>{day.evening}</Text>
            <Text style={styles.label}>{t("day.foodHighlight")}</Text>
            <Text style={styles.text}>{day.food_highlight}</Text>
          </View>
        ))}
        <PageFooter t={t} />
      </Page>

      {/* Map Overview */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("sections.mapOverview.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("sections.mapOverview.title")}</Text>

        <View style={styles.mapImageWrap}>
          <ItineraryMapPdf itinerary={itinerary} />
        </View>

        {mapModel.stops.map((stop) => (
          <View key={stop.slug} style={styles.mapLegendItem}>
            {/*
              Future photography slot: swap this numbered marker for an
              `<Image style={styles.mapStopThumb} src={...} />` using
              getDestinationBySlug(stop.slug)?.hero_image.url once available.
            */}
            <View style={styles.mapLegendMarkerWrap}>
              <Text style={styles.mapLegendMarkerText}>{stop.order}</Text>
            </View>
            <Text style={styles.text}>
              {t("map.baseLabel", {
                name: stop.name,
                dayRange:
                  stop.dayStart === stop.dayEnd
                    ? t("map.daySingle", { day: stop.dayStart })
                    : t("map.dayRange", { start: stop.dayStart, end: stop.dayEnd }),
              })}
            </Text>
          </View>
        ))}
        {mapModel.dayTrips.map((trip) => (
          <View key={`${trip.slug}-${trip.day}`} style={styles.mapLegendItem}>
            <View style={styles.mapLegendDayTripMarker}>
              <View style={styles.mapLegendDayTripDot} />
            </View>
            <Text style={styles.text}>
              {t("map.dayTripLabel", {
                name: trip.name,
                day: trip.day,
                from: trip.fromStopName,
                driveTime: trip.driveTime,
              })}
            </Text>
          </View>
        ))}

        <PageFooter t={t} />
      </Page>

      {/* Day Trips */}
      {itinerary.day_trips.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionEyebrow}>{t("sections.dayTrips.eyebrow")}</Text>
          <Text style={styles.sectionTitle}>{t("sections.dayTrips.title")}</Text>
          {itinerary.day_trips.map((trip) => (
            <View key={`${trip.destination_slug}-${trip.day}`} style={styles.dayTripCard} wrap={false}>
              {/*
                Future photography slot: an `<Image style={styles.destinationThumb} src={...} />`
                would render here — trip.destination_slug already gives a direct
                getDestinationBySlug lookup, the most direct of the four image hooks.
              */}
              <Text style={styles.dayTripEyebrow}>{t("dayTripCard.header", { day: trip.day, origin: trip.origin })}</Text>
              <Text style={styles.dayTripTitle}>{trip.destination_name}</Text>
              <Text style={styles.text}>
                {trip.drive_time} {t("dayTripCard.driveSuffix")}
              </Text>
              <Text style={styles.text}>{trip.why_go}</Text>
              <Text style={[styles.text, { fontStyle: "italic" }]}>
                {t("dayTripCard.localTipLabel")} {trip.local_tip}
              </Text>
            </View>
          ))}
          <PageFooter t={t} />
        </Page>
      )}

      {/* Food Recommendations */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("sections.foodRecommendations.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("sections.foodRecommendations.title")}</Text>
        {/*
          Future photography slot: each restaurant_picks string is free text today
          (no FoodFind slug carried through). Once grounding passes through a slug,
          each row below would gain a leading `<Image style={styles.foodItemThumb} src={...} />`
          sourced from a FoodFind hero image — see docs/image-direction-v2.md §2 for the
          note on extending the ImageAsset pattern beyond Destination to FoodFind.
        */}
        {itinerary.restaurant_picks.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}
        <PageFooter t={t} />
      </Page>

      {/* Hidden Gems */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("sections.hiddenGems.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("sections.hiddenGems.title")}</Text>
        {itinerary.hidden_gems.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}
        <PageFooter t={t} />
      </Page>

      {/* Local Notes */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("sections.localNotes.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("sections.localNotes.title")}</Text>
        {itinerary.culture_notes.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}
        <PageFooter t={t} />
      </Page>
    </Document>
  );
}
