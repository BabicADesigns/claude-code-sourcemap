import type { LogisticsConnection } from "@/lib/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { mockLogisticsConnections } from "@/lib/data/logistics-connections-mock";
import { logError } from "@/lib/monitoring/logger";

/** Returns all active, non-demo logistics connections. Falls back to empty array when Supabase is unconfigured (the engine uses haversine fallback). */
export async function getLogisticsConnections(): Promise<LogisticsConnection[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("logistics_connections")
    .select("*")
    .eq("active", true)
    .eq("demo_only", false);
  if (error || !data) {
    if (error) logError("data.logistics.getLogisticsConnections", error);
    return [];
  }
  return data as LogisticsConnection[];
}

/** Returns ALL logistics connections including inactive and demo — for admin use only. */
export async function getAllLogisticsConnectionsForAdmin(): Promise<LogisticsConnection[]> {
  if (!isSupabaseConfigured()) return mockLogisticsConnections;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("logistics_connections")
    .select("*")
    .order("from_destination_slug");
  if (error || !data) {
    if (error) logError("data.logistics.getAllLogisticsConnectionsForAdmin", error);
    return mockLogisticsConnections;
  }
  return data as LogisticsConnection[];
}

/** Looks up a specific directional connection. Returns undefined if none exists — caller should use haversine fallback. */
export function findLogisticsConnection(
  connections: LogisticsConnection[],
  fromSlug: string,
  toSlug: string
): LogisticsConnection | undefined {
  return (
    connections.find((c) => c.from_destination_slug === fromSlug && c.to_destination_slug === toSlug) ??
    connections.find((c) => c.from_destination_slug === toSlug && c.to_destination_slug === fromSlug)
  );
}
