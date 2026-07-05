import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { LogisticsPanel } from "@/components/admin/logistics-panel";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { isEditorEmail } from "@/lib/auth/editors";
import { getAllLogisticsConnectionsForAdmin } from "@/lib/data/logistics-connections";

export const metadata: Metadata = { title: "Logistics Management" };

export default async function LogisticsAdminPage() {
  if (!isSupabaseConfigured()) {
    const connections = await getAllLogisticsConnectionsForAdmin();
    return (
      <div>
        <PageHeader
          eyebrow="Trip Logistics Engine"
          title="Logistics connections"
          description="All route connections — including inactive and demo-only records. Active connections enrich route practicality scoring; inactive ones fall back to haversine estimates."
        />
        <div className="container py-8 sm:py-12">
          <p className="mb-6 max-w-md font-serif text-sm text-foreground/70">
            Supabase is not connected. Showing mock data only. All records shown are demo fixtures
            marked <code className="font-mono text-xs">demo_only: true</code>.
          </p>
          <LogisticsPanel connections={connections} />
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  if (!isEditorEmail(user.email)) {
    return (
      <div>
        <PageHeader eyebrow="Trip Logistics Engine" title="Logistics connections" />
        <div className="container py-8 sm:py-12">
          <p className="max-w-md font-serif text-foreground/80">
            You&apos;re signed in, but this account isn&apos;t on the editor allow-list.
          </p>
        </div>
      </div>
    );
  }

  const connections = await getAllLogisticsConnectionsForAdmin();

  return (
    <div>
      <PageHeader
        eyebrow="Trip Logistics Engine"
        title="Logistics connections"
        description="All route connections — including inactive and demo-only records. Active connections enrich route practicality scoring; inactive ones fall back to haversine estimates."
      />
      <div className="container py-8 sm:py-12">
        <LogisticsPanel connections={connections} />
      </div>
    </div>
  );
}
