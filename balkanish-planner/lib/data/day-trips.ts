import type { DayTrip } from "@/lib/types";

export const mockDayTrips: DayTrip[] = [
  {
    id: "split-trogir",
    slug: "split-trogir",
    origin: "Split",
    destination_slug: "trogir",
    destination_name: "Trogir",
    drive_time: "20 minutes",
    why_go: "A full UNESCO old town that fits into half a day, without giving up Split as your base.",
    highlights: ["Trogir Cathedral", "The fish market on the riva", "Kamerlengo Fortress at sunset"],
    best_season: "April–October",
    local_tip: "Go for the early-evening light — the day-trip buses clear out by 6pm and the cathedral square empties with them.",
  },
  {
    id: "dubrovnik-cavtat",
    slug: "dubrovnik-cavtat",
    origin: "Dubrovnik",
    destination_slug: "cavtat",
    destination_name: "Cavtat",
    drive_time: "25 minutes",
    why_go: "The same stone-and-cypress Adriatic views as the Old Town, minus the cruise-ship surge.",
    highlights: ["Waterfront promenade walk", "Rector's Palace", "Lunch at a konoba with no queue"],
    best_season: "May–October",
    local_tip: "Take the passenger boat from the Old Town harbour instead of a taxi — it's the same price and a better view.",
  },
  {
    id: "zagreb-varazdin",
    slug: "zagreb-varazdin",
    origin: "Zagreb",
    destination_slug: "varazdin",
    destination_name: "Varaždin",
    drive_time: "1 hour",
    why_go: "A baroque old town and moated castle that most Zagreb visitors never realize is this close.",
    highlights: ["Varaždin Castle", "Old Town baroque facades", "Mirogoj-style flower cemetery"],
    best_season: "May–September",
    local_tip: "Check if Špancirfest is on before you go — it's worth timing around, not stumbling into unprepared.",
  },
  {
    id: "mostar-blagaj",
    slug: "mostar-blagaj",
    origin: "Mostar",
    destination_slug: "blagaj",
    destination_name: "Blagaj",
    drive_time: "15 minutes",
    why_go: "The Buna river's source and a 600-year-old dervish house, ten times calmer than the bridge crowds.",
    highlights: ["Blagaj Tekija", "Lunch on the riverside terrace", "The cliff face above the spring"],
    best_season: "April–October",
    local_tip: "Order the trout — it was almost certainly swimming in the river you're sitting next to an hour ago.",
  },
  {
    id: "kotor-perast",
    slug: "kotor-perast",
    origin: "Kotor",
    destination_slug: "perast",
    destination_name: "Perast",
    drive_time: "20 minutes",
    why_go: "The Bay of Kotor's entire postcard, condensed into one baroque street and two islet churches.",
    highlights: ["Boat to Our Lady of the Rocks", "St. Nikola's bell tower", "Bay views without the cruise tide"],
    best_season: "May–October",
    local_tip: "Hire a kayak instead of the tourist boat — paddling out at golden hour is the whole experience.",
  },
  {
    id: "zagreb-plitvice",
    slug: "zagreb-plitvice",
    origin: "Zagreb",
    destination_slug: "plitvice",
    destination_name: "Plitvice Lakes",
    drive_time: "2 hours",
    why_go: "Sixteen turquoise lakes and waterfalls, doable as a long day trip if you start early.",
    highlights: ["Lower lakes boardwalks", "Veliki Slap waterfall", "The boat crossing between lake clusters"],
    best_season: "May–June, September–October",
    local_tip: "Enter at the upper entrance and walk down — it puts you ahead of the tour buses, not behind them.",
  },
  {
    id: "pula-rovinj",
    slug: "pula-rovinj",
    origin: "Pula",
    destination_slug: "rovinj",
    destination_name: "Rovinj",
    drive_time: "40 minutes",
    why_go: "Trade Roman ruins for pastel harbour views without leaving Istria.",
    highlights: ["Sunset on the harbour quay", "St. Euphemia's bell tower climb", "Malvazija tasting by the water"],
    best_season: "April–October",
    local_tip: "Park outside the old town and walk in — the lanes weren't built for cars and neither was your patience.",
  },
  {
    id: "novi-sad-subotica",
    slug: "novi-sad-subotica",
    origin: "Novi Sad",
    destination_slug: "subotica",
    destination_name: "Subotica",
    drive_time: "1 hour 45 minutes",
    why_go: "Vojvodina's two architectural personalities — Habsburg fortress city and Hungarian Art Nouveau border town — in one road trip.",
    highlights: ["Subotica Town Hall", "Synagogue exterior", "A Hungarian bakery stop on the way back"],
    best_season: "May–September",
    local_tip: "Go on a weekday — the Town Hall's interior tours run a tighter, less crowded schedule than weekends.",
  },
];

export function getDayTrips(): DayTrip[] {
  return mockDayTrips;
}

export function getDayTripBySlug(slug: string): DayTrip | undefined {
  return mockDayTrips.find((trip) => trip.slug === slug);
}

export function getDayTripsFromOrigin(origin: string): DayTrip[] {
  const normalized = origin.trim().toLowerCase();
  return mockDayTrips.filter((trip) => trip.origin.toLowerCase() === normalized);
}
