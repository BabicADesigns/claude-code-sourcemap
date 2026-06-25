import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { PdfDeliveryWithDocument } from "@/lib/types";

/** Most recent deliveries first, joined with the PdfDocument each belongs to — powers the My Trips delivery-history view. */
export async function getDeliveryHistoryForUser(userId: string, limit = 20): Promise<PdfDeliveryWithDocument[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pdf_deliveries")
    .select("*, document:pdf_documents(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as PdfDeliveryWithDocument[];
}
