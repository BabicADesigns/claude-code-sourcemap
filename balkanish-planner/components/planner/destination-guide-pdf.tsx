import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Destination } from "@/lib/types";
import { DESTINATION_CATEGORY_LABELS, DESTINATION_SCORES } from "@/lib/types";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getDictionary, translate } from "@/lib/i18n/dictionaries";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Brand palette duplicated from components/planner/itinerary-pdf.tsx rather than imported —
 * these are the same brand-wide hex constants already duplicated between this app's Tailwind
 * tokens and the itinerary PDF; a second react-pdf document reading them is the same situation,
 * not a new one. Keep the two documents' StyleSheet objects independent so a future redesign of
 * one doesn't have to thread through the other.
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
  coverBrand: { fontSize: 13, color: COLOR.cream },
  coverBrandScript: { fontSize: 10, color: COLOR.rose, marginTop: 3, fontStyle: "italic" },
  page: {
    paddingTop: 48,
    paddingBottom: 54,
    paddingHorizontal: 40,
    fontSize: 11,
    color: COLOR.charcoal,
    backgroundColor: COLOR.cream,
  },
  sectionEyebrow: { fontSize: 10, letterSpacing: 1.5, color: COLOR.rose, textTransform: "uppercase", marginBottom: 6 },
  sectionTitle: { fontSize: 20, color: COLOR.sageDark, marginBottom: 16 },
  text: { fontSize: 10.5, lineHeight: 1.5, marginBottom: 10, color: COLOR.charcoal },
  pullQuote: { fontSize: 13, lineHeight: 1.6, fontStyle: "italic", color: COLOR.sageDark, marginBottom: 16 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLOR.hairline },
  scoreLabel: { fontSize: 10.5, color: COLOR.charcoal },
  scoreHint: { fontSize: 9, color: COLOR.muted, marginTop: 2, maxWidth: 360 },
  scoreValue: { fontSize: 13, color: COLOR.sageDark },
  factRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16 },
  fact: { marginRight: 22, marginBottom: 8, minWidth: 110 },
  factLabel: { fontSize: 8.5, letterSpacing: 1, color: COLOR.muted, textTransform: "uppercase", marginBottom: 3 },
  factValue: { fontSize: 12, color: COLOR.sageDark },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: COLOR.muted },
});

function PageFooter({ t }: { t: Translate }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{t("footer.tagline")}</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function DestinationGuidePdfDocument({
  destination,
  locale = DEFAULT_LOCALE,
}: {
  destination: Destination;
  locale?: Locale;
}) {
  const dictionary = getDictionary(locale);
  const t: Translate = (key, vars) => translate(dictionary, "pdf", key, vars);

  return (
    <Document title={destination.name}>
      <Page size="A4" style={styles.coverPage}>
        <View>
          <Text style={styles.coverEyebrow}>{t("destinationGuide.eyebrowPrefix")}</Text>
          <Text style={styles.coverTitle}>{destination.name}</Text>
          <Text style={styles.coverMeta}>
            {destination.region}, {destination.country}
          </Text>
          <Text style={styles.coverMeta}>{DESTINATION_CATEGORY_LABELS[destination.category]}</Text>
        </View>
        <View>
          <Text style={styles.coverBrand}>{t("cover.brand")}</Text>
          <Text style={styles.coverBrandScript}>{t("cover.brandScript")}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionEyebrow}>{t("destinationGuide.overview.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("destinationGuide.overview.title")}</Text>
        <Text style={styles.text}>{destination.description}</Text>
        <Text style={styles.pullQuote}>{destination.why_we_love_it}</Text>

        <View style={styles.factRow}>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>{t("destinationGuide.region")}</Text>
            <Text style={styles.factValue}>{destination.region}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>{t("destinationGuide.category")}</Text>
            <Text style={styles.factValue}>{DESTINATION_CATEGORY_LABELS[destination.category]}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>{t("destinationGuide.bestSeason")}</Text>
            <Text style={styles.factValue}>{destination.best_season}</Text>
          </View>
        </View>

        <Text style={styles.sectionEyebrow}>{t("destinationGuide.scorecard.eyebrow")}</Text>
        <Text style={styles.sectionTitle}>{t("destinationGuide.scorecard.title")}</Text>
        {DESTINATION_SCORES.map((score) => (
          <View key={score.key} style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>{score.label}</Text>
              <Text style={styles.scoreHint}>{score.hint}</Text>
            </View>
            <Text style={styles.scoreValue}>{destination[score.key]}/10</Text>
          </View>
        ))}

        <PageFooter t={t} />
      </Page>
    </Document>
  );
}
