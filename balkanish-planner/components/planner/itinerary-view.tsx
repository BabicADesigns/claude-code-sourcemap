import type { GeneratedItinerary } from "@/lib/ai/itinerary";
import { ItineraryMap } from "@/components/planner/itinerary-map";

/** Renders a generated itinerary's full day-by-day plan — shared by the live planner result and the My Balkans "reopen" view. */
export function ItineraryView({ itinerary }: { itinerary: GeneratedItinerary }) {
  return (
    <div>
      <p className="font-sans text-xs uppercase tracking-widest text-accent">Your itinerary</p>
      <h2 className="mt-2 font-display text-3xl text-sage-dark sm:text-4xl">{itinerary.trip_title}</h2>
      <p className="mt-3 font-serif text-foreground/85">{itinerary.overview}</p>

      <ItineraryMap itinerary={itinerary} />

      {itinerary.selection_reasons.length > 0 && (
        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-4 sm:mt-10 sm:p-5">
          <h4 className="font-display text-xl text-sage-dark">Why these stops</h4>
          <ul className="mt-3 flex flex-col gap-2 font-serif text-sm text-foreground/85">
            {itinerary.selection_reasons.map((reason) => (
              <li key={reason.destination_slug}>
                <span className="font-medium text-foreground">{reason.destination_name}</span> — {reason.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-5 sm:gap-6">
        {itinerary.days.map((day) => (
          <div key={day.day} className="break-inside-avoid-page rounded-xl border border-border p-4 sm:p-5">
            <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Day {day.day}</p>
            <h3 className="mt-1 font-display text-xl text-sage-dark sm:text-2xl">{day.title}</h3>
            <p className="mt-2 font-serif text-sm text-foreground/85">{day.summary}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Morning</dt>
                <dd className="font-serif text-sm text-foreground/85">{day.morning}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Afternoon</dt>
                <dd className="font-serif text-sm text-foreground/85">{day.afternoon}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Evening</dt>
                <dd className="font-serif text-sm text-foreground/85">{day.evening}</dd>
              </div>
              <div>
                <dt className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Food highlight</dt>
                <dd className="font-serif text-sm text-foreground/85">{day.food_highlight}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {itinerary.day_trips.length > 0 && (
        <div className="mt-8 sm:mt-10">
          <h4 className="font-display text-xl text-sage-dark">Day trips</h4>
          <div className="mt-3 flex flex-col gap-4">
            {itinerary.day_trips.map((trip) => (
              <div
                key={`${trip.destination_slug}-${trip.day}`}
                className="break-inside-avoid-page rounded-xl border border-dashed border-rose/60 bg-rose/5 p-4 sm:p-5"
              >
                <p className="font-sans text-xs uppercase tracking-widest text-rose">
                  Day {trip.day} · Day trip from {trip.origin}
                </p>
                <h5 className="mt-1 font-display text-lg text-sage-dark">{trip.destination_name}</h5>
                <p className="mt-1 font-sans text-xs text-muted-foreground">{trip.drive_time} drive</p>
                <p className="mt-2 font-serif text-sm text-foreground/85">{trip.why_go}</p>
                <p className="mt-2 font-serif text-sm italic text-foreground/70">Local tip: {trip.local_tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 sm:gap-8">
        <ItineraryListSection title="Hidden gems" items={itinerary.hidden_gems} />
        <ItineraryListSection title="Restaurants worth the detour" items={itinerary.restaurant_picks} />
        <ItineraryListSection title="Culture notes" items={itinerary.culture_notes} />
        <ItineraryListSection title="Packing list" items={itinerary.packing_list} />
      </div>
    </div>
  );
}

function ItineraryListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="font-display text-xl text-sage-dark">{title}</h4>
      <ul className="mt-3 flex flex-col gap-2 font-serif text-sm text-foreground/85">
        {items.map((item, i) => (
          <li key={i}>— {item}</li>
        ))}
      </ul>
    </div>
  );
}
