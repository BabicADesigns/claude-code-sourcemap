import type { CommunityNote } from "@/lib/types";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { logError } from "@/lib/monitoring/logger";
import { mockCommunityNotes } from "@/lib/data/community-notes-mock";

/** Returns only approved community notes for public display. */
export async function getApprovedNotesForDestination(destinationSlug: string): Promise<CommunityNote[]> {
  if (!isSupabaseAdminConfigured()) {
    return mockCommunityNotes.filter(
      (n) => n.destination_slug === destinationSlug && n.moderation_status === "approved"
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_notes")
    .select("*")
    .eq("destination_slug", destinationSlug)
    .eq("moderation_status", "approved")
    .order("submitted_at", { ascending: false });
  if (error) {
    logError("data.communityNotes.getApprovedNotesForDestination", error, { destinationSlug });
    return mockCommunityNotes.filter(
      (n) => n.destination_slug === destinationSlug && n.moderation_status === "approved"
    );
  }
  return (data ?? []) as CommunityNote[];
}

/** Returns all notes regardless of status — for admin moderation panel only. */
export async function getAllNotes(): Promise<CommunityNote[]> {
  if (!isSupabaseAdminConfigured()) return mockCommunityNotes;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("community_notes")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (error) {
    logError("data.communityNotes.getAllNotes", error);
    return mockCommunityNotes;
  }
  return (data ?? []) as CommunityNote[];
}
