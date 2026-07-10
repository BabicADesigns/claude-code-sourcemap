import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CulturalPanel } from "@/components/admin/cultural-panel";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isEditorEmail } from "@/lib/auth/editors";
import { getAllCulturalInsightsForAdmin } from "@/lib/data/cultural-insights";
import { getAllLocalPhrasesForAdmin } from "@/lib/data/local-phrases";
import { getAllFounderNotesForAdmin } from "@/lib/data/founder-notes";

export const metadata: Metadata = { title: "Cultural Intelligence Management" };

export default async function CulturalAdminPage() {
  if (!isSupabaseConfigured()) {
    const [insights, phrases, founderNotes] = await Promise.all([
      getAllCulturalInsightsForAdmin(),
      getAllLocalPhrasesForAdmin(),
      getAllFounderNotesForAdmin(),
    ]);
    return (
      <div>
        <PageHeader
          eyebrow="Cultural Intelligence Engine"
          title="Cultural content"
          description="All cultural insights, local phrases, and founder notes — including inactive and demo-only records."
        />
        <div className="container py-8 sm:py-12">
          <p className="mb-6 max-w-md font-serif text-sm text-foreground/70">
            Supabase is not connected. Showing mock data only. All records shown are demo fixtures
            marked <code className="font-mono text-xs">demo_only: true</code>.
          </p>
          <CulturalPanel insights={insights} phrases={phrases} founderNotes={founderNotes} />
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!isEditorEmail(user.email)) {
    return (
      <div>
        <PageHeader eyebrow="Cultural Intelligence Engine" title="Cultural content" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            You&apos;re signed in, but this account isn&apos;t on the editor allow-list.
          </p>
        </div>
      </div>
    );
  }

  const [insights, phrases, founderNotes] = await Promise.all([
    getAllCulturalInsightsForAdmin(),
    getAllLocalPhrasesForAdmin(),
    getAllFounderNotesForAdmin(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Cultural Intelligence Engine"
        title="Cultural content"
        description="All cultural insights, local phrases, and founder notes — including inactive and demo-only records."
      />
      <div className="container py-8 sm:py-12">
        <CulturalPanel insights={insights} phrases={phrases} founderNotes={founderNotes} />
      </div>
    </div>
  );
}
