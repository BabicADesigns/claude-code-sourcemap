import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { GeneratedItinerary, PlannerInput } from "@/lib/ai/itinerary";
import { TRAVEL_STYLE_LABELS } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, color: "#1C1917" },
  title: { fontSize: 22, marginBottom: 6, color: "#385048" },
  subtitle: { fontSize: 11, color: "#555555", marginBottom: 18 },
  sectionTitle: { fontSize: 14, marginTop: 18, marginBottom: 8, color: "#385048" },
  dayBlock: { marginBottom: 10 },
  dayTitle: { fontSize: 13, marginTop: 12, marginBottom: 2, color: "#8B9B7A" },
  label: { fontSize: 10, marginTop: 4, fontWeight: 700 },
  text: { fontSize: 10, lineHeight: 1.4, marginBottom: 2 },
  listItem: { fontSize: 10, marginBottom: 3 },
  footer: { marginTop: 24, fontSize: 9, color: "#888888" },
});

export function ItineraryPdfDocument({ itinerary, input }: { itinerary: GeneratedItinerary; input: PlannerInput }) {
  return (
    <Document title={itinerary.trip_title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{itinerary.trip_title}</Text>
        <Text style={styles.subtitle}>
          {input.durationDays} days · {input.month} · {TRAVEL_STYLE_LABELS[input.travelStyle]}
        </Text>
        <Text style={styles.text}>{itinerary.overview}</Text>

        <Text style={styles.sectionTitle}>Day by day</Text>
        {itinerary.days.map((day) => (
          <View key={day.day} style={styles.dayBlock} wrap={false}>
            <Text style={styles.dayTitle}>
              Day {day.day} — {day.title}
            </Text>
            <Text style={styles.text}>{day.summary}</Text>
            <Text style={styles.label}>Morning</Text>
            <Text style={styles.text}>{day.morning}</Text>
            <Text style={styles.label}>Afternoon</Text>
            <Text style={styles.text}>{day.afternoon}</Text>
            <Text style={styles.label}>Evening</Text>
            <Text style={styles.text}>{day.evening}</Text>
            <Text style={styles.label}>Food highlight</Text>
            <Text style={styles.text}>{day.food_highlight}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Hidden gems</Text>
        {itinerary.hidden_gems.map((gem, i) => (
          <Text key={i} style={styles.listItem}>
            • {gem}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Restaurants worth the detour</Text>
        {itinerary.restaurant_picks.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Culture notes</Text>
        {itinerary.culture_notes.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Packing list</Text>
        {itinerary.packing_list.map((item, i) => (
          <Text key={i} style={styles.listItem}>
            • {item}
          </Text>
        ))}

        <Text style={styles.footer}>Made in the Balkans. Created with Vegeta and Love by BabicADesigns.</Text>
      </Page>
    </Document>
  );
}
