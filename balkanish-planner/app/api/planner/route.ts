import { NextResponse } from "next/server";
import { generateItinerary, plannerInputSchema } from "@/lib/ai/itinerary";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = plannerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid planner input.", issues: parsed.error.issues }, { status: 400 });
  }

  let itinerary;
  try {
    itinerary = await generateItinerary(parsed.data);
  } catch (error) {
    console.error("Itinerary generation failed", error);
    return NextResponse.json({ error: "Could not generate an itinerary. Please try again." }, { status: 502 });
  }

  if (isSupabaseAdminConfigured()) {
    const supabase = createSupabaseAdminClient();
    await supabase.from("generated_itineraries").insert({
      duration_days: parsed.data.durationDays,
      month: parsed.data.month,
      budget: parsed.data.budget,
      travel_style: parsed.data.travelStyle,
      interests: parsed.data.interests,
      itinerary_json: itinerary,
    });
  }

  return NextResponse.json({ itinerary });
}
