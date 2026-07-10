import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CaptureInput } from "@/components/inspiration/capture-input";
import { FindCard } from "@/components/inspiration/find-card";
import { FindsEmpty } from "@/components/inspiration/finds-empty";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getInspirationCaptures } from "@/lib/data/inspiration-captures";

export const metadata: Metadata = { title: "My Balkan Finds" };

export default async function MyBalkanFindsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader
          eyebrow="My Finds"
          title="My Balkan Finds"
          description="Connect the planner to Supabase to start saving your travel finds."
        />
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const captures = await getInspirationCaptures(user.id);

  const pending = captures.filter(
    (c) => c.resolution_status === "NEEDS_CONFIRMATION" || c.resolution_status === "AMBIGUOUS",
  );
  const resolved = captures.filter(
    (c) =>
      c.resolution_status === "RESOLVED_HIGH_CONFIDENCE" ||
      c.resolution_status === "USER_CONFIRMED" ||
      c.resolution_status === "USER_CORRECTED",
  );
  const unresolved = captures.filter(
    (c) => c.resolution_status === "UNRESOLVED",
  );

  return (
    <div>
      <PageHeader
        eyebrow="My Finds"
        title="My Balkan Finds"
        description="Places spotted online, sent by friends, or remembered from a dream trip. Your source may disappear — your find won't."
      />
      <div className="container py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          {/* Main column */}
          <div className="space-y-8">
            {/* Pending confirmation */}
            {pending.length > 0 && (
              <section>
                <h2 className="font-sans text-xs uppercase tracking-widest text-accent">
                  Waiting for you
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {pending.map((c) => (
                    <FindCard key={c.id} capture={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Resolved finds */}
            {resolved.length > 0 && (
              <section>
                <h2 className="font-sans text-xs uppercase tracking-widest text-accent">
                  Saved finds
                </h2>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {resolved.map((c) => (
                    <FindCard key={c.id} capture={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Unresolved / needs a note */}
            {unresolved.length > 0 && (
              <section>
                <h2 className="font-sans text-xs uppercase tracking-widest text-foreground/40">
                  Needs a note
                </h2>
                <p className="mt-1 text-xs text-foreground/50">
                  The system couldn&apos;t identify the place. Add a note to remember why you saved it.
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {unresolved.map((c) => (
                    <FindCard key={c.id} capture={c} />
                  ))}
                </div>
              </section>
            )}

            {captures.length === 0 && <FindsEmpty />}
          </div>

          {/* Sidebar: capture input */}
          <aside className="lg:sticky lg:top-20">
            <CaptureInput />
          </aside>
        </div>
      </div>
    </div>
  );
}
