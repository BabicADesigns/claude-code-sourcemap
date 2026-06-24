import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/account/profile-form";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfile } from "@/lib/data/profile";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader eyebrow="Account" title="Your Balkanish account" />
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

  const profile = await getProfile(user.id);

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Your Balkanish account"
        description="Update your profile so we can tailor what we show you."
      />
      <div className="container py-8 sm:py-12">
        <ProfileForm email={user.email ?? ""} profile={profile} />
      </div>
    </div>
  );
}
