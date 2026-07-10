import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PartnersPanel } from "@/components/admin/partners-panel";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isEditorEmail } from "@/lib/auth/editors";
import { getAllPartnersForAdmin } from "@/lib/data/partners";

export const metadata: Metadata = { title: "Partner Management" };

export default async function PartnersAdminPage() {
  if (!isSupabaseConfigured()) {
    const partners = await getAllPartnersForAdmin();
    return (
      <div>
        <PageHeader
          eyebrow="Local Trust System"
          title="Partner management"
          description="All registered partners — including inactive and demo-only records."
        />
        <div className="container py-8 sm:py-12">
          <p className="mb-6 max-w-md font-serif text-sm text-foreground/70">
            Supabase is not connected. Showing mock data only.
          </p>
          <PartnersPanel partners={partners} />
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!isEditorEmail(user.email)) {
    return (
      <div>
        <PageHeader eyebrow="Local Trust System" title="Partner management" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            You&apos;re signed in, but this account isn&apos;t on the editor allow-list.
          </p>
        </div>
      </div>
    );
  }

  const partners = await getAllPartnersForAdmin();

  return (
    <div>
      <PageHeader
        eyebrow="Local Trust System"
        title="Partner management"
        description="All registered partners — including inactive and demo-only records. Commercial relationship is stored for disclosure purposes only and never influences ranking."
      />
      <div className="container py-8 sm:py-12">
        <PartnersPanel partners={partners} />
      </div>
    </div>
  );
}
