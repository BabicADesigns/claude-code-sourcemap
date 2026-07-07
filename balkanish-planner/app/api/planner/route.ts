import { NextResponse } from "next/server";
import { generateItineraryVariants, plannerInputSchema } from "@/lib/ai/itinerary";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { PLANNER_STYLE_TO_TRAVEL_STYLE } from "@/lib/types";
import { logError } from "@/lib/monitoring/logger";
import { getCulturalInsights } from "@/lib/data/cultural-insights";
import { getFounderNotes } from "@/lib/data/founder-notes";
import { getActiveMemorySignals } from "@/lib/data/travel-memory";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = plannerInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid planner input.", issues: parsed.error.issues }, { status: 400 });
  }

  // When Supabase is configured (any real deployment), require an authenticated user before
  // calling OpenAI. Unauthenticated callers could otherwise trigger unlimited paid AI calls.
  // When Supabase is not configured (local dev / demo mode), user remains null and the planner
  // still works — but OpenAI is typically also absent in that environment.
  const user = isSupabaseConfigured() ? await getCurrentUser() : null;
  if (isSupabaseConfigured() && !user) {
    return NextResponse.json({ error: "Sign in to generate an itinerary." }, { status: 401 });
  }

  const [culturalInsights, founderNotes, memorySignals] = await Promise.all([
    getCulturalInsights(),
    getFounderNotes(),
    user ? getActiveMemorySignals(user.id) : Promise.resolve([]),
  ]);
  const culturalContext =
    culturalInsights.length > 0 || founderNotes.length > 0
      ? { insights: culturalInsights, founderNotes }
      : undefined;
  const memoryContext = memorySignals.length > 0 ? { signals: memorySignals } : undefined;

  let itineraries;
  try {
    itineraries = await generateItineraryVariants(parsed.data, culturalContext, memoryContext);
  } catch (error) {
    logError("api.planner.generate", error, { durationDays: parsed.data.durationDays });
    return NextResponse.json({ error: "Could not generate an itinerary. Please try again." }, { status: 502 });
  }

  if (isSupabaseAdminConfigured()) {
    const supabase = createSupabaseAdminClient();
    // The balanced variant is stored as the representative itinerary_json — the other two
    // variants are derived from the same input and can be regenerated on demand.
    const { error } = await supabase.from("generated_itineraries").insert({
      duration_days: parsed.data.durationDays,
      month: parsed.data.month,
      budget: parsed.data.budget,
      travel_style: PLANNER_STYLE_TO_TRAVEL_STYLE[parsed.data.plannerStyle],
      interests: parsed.data.interests,
      itinerary_json: itineraries.balanced,
    });
    // Anonymous itinerary logging is best-effort — a failure here must never block
    // returning the itineraries the user is waiting on.
    if (error) logError("api.planner.logGeneratedItinerary", error);
  }

  return NextResponse.json({ itineraries });
}
