import { NextResponse } from "next/server";
import { generateItineraryVariants, plannerInputSchema } from "@/lib/ai/itinerary";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { PLANNER_STYLE_TO_TRAVEL_STYLE } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = plannerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid planner input.", issues: parsed.error.issues }, { status: 400 });
  }

  let itineraries;
  try {
    itineraries = await generateItineraryVariants(parsed.data);
  } catch (error) {
    console.error("Itinerary generation failed", error);
    return NextResponse.json({ error: "Could not generate an itinerary. Please try again." }, { status: 502 });
  }

  if (isSupabaseAdminConfigured()) {
    const supabase = createSupabaseAdminClient();
    // The balanced variant is stored as the representative itinerary_json — the other two
    // variants are derived from the same input and can be regenerated on demand.
    await supabase.from("generated_itineraries").insert({
      duration_days: parsed.data.durationDays,
      month: parsed.data.month,
      budget: parsed.data.budget,
      travel_style: PLANNER_STYLE_TO_TRAVEL_STYLE[parsed.data.plannerStyle],
      interests: parsed.data.interests,
      itinerary_json: itineraries.balanced,
    });
  }

  return NextResponse.json({ itineraries });
}
