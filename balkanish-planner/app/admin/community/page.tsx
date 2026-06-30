import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { CommunityPanel } from "@/components/admin/community-panel";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isEditorEmail } from "@/lib/auth/editors";
import { getAllNotes } from "@/lib/data/community-notes";

export const metadata: Metadata = { title: "Community Note Moderation" };

export default async function CommunityModerationPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="Community Intelligence" title="Community note moderation" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            Accounts aren&apos;t connected yet — this page will come alive once the Balkanish Planner is linked
            to its Supabase project.
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
        <PageHeader eyebrow="Community Intelligence" title="Community note moderation" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            You&apos;re signed in, but this account isn&apos;t on the editor allow-list.
          </p>
        </div>
      </div>
    );
  }

  const notes = await getAllNotes();

  return (
    <div>
      <PageHeader
        eyebrow="Community Intelligence"
        title="Community note moderation"
        description="User-submitted travel tips, sorted newest first. Approve to surface them on destination pages, reject to discard them. Pending notes are never shown publicly."
      />
      <div className="container py-8 sm:py-12">
        <CommunityPanel notes={notes} />
      </div>
    </div>
  );
}
