import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DiscoveriesPanel } from "@/components/admin/discoveries-panel";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isEditorEmail } from "@/lib/auth/editors";
import { listDiscoveredDestinations } from "@/lib/data/discovered-destinations";

export const metadata: Metadata = { title: "Discovery Moderation" };

/**
 * Not linked from any nav — reached only by URL. Gated the same way every other optional feature
 * in this codebase is: a blank EDITOR_EMAILS means the feature is simply unavailable, not broken.
 * See docs/ai-expansion-engine-architecture.md "Moderation workflow".
 */
export default async function DiscoveriesModerationPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="AI Expansion Engine" title="Discovery moderation" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            Accounts aren&apos;t connected yet — this page will come alive once the Balkanish Planner is linked to
            its Supabase project.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!isEditorEmail(user.email)) {
    return (
      <div>
        <PageHeader eyebrow="AI Expansion Engine" title="Discovery moderation" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            You&apos;re signed in, but this account isn&apos;t on the editor allow-list.
          </p>
        </div>
      </div>
    );
  }

  const discoveries = await listDiscoveredDestinations();

  return (
    <div>
      <PageHeader
        eyebrow="AI Expansion Engine"
        title="Discovery moderation"
        description="Every real place Layer B has proposed across every itinerary request, deduplicated into one row each. Approve to mark it Community Verified, reject to stop surfacing it, or promote it straight into the curated dataset."
      />
      <div className="container py-8 sm:py-12">
        <DiscoveriesPanel discoveries={discoveries} />
      </div>
    </div>
  );
}
