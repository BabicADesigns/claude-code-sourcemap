"use server";

import { revalidatePath } from "next/cache";
import type { CommunityNoteCategory } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isEditorEmail } from "@/lib/auth/editors";
import { logError } from "@/lib/monitoring/logger";

const COMMUNITY_PAGE_PATH = "/admin/community";

export interface SubmitNoteInput {
  destination_slug: string;
  content: string;
  category: CommunityNoteCategory;
  author_name?: string;
  language: Locale;
}

/**
 * Public submission — anyone may submit a note; it lands in pending and awaits editorial review.
 * When Supabase isn't configured, returns a no-op success so the form still works in local dev.
 */
export async function submitCommunityNote(input: SubmitNoteInput): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return {};

  const content = input.content.trim();
  if (!content || content.length < 10) return { error: "Tip must be at least 10 characters." };
  if (content.length > 500) return { error: "Tip must be 500 characters or fewer." };

  const supabase = createSupabaseAdminClient();
  if (!isSupabaseAdminConfigured()) return {};

  const { error } = await supabase.from("community_notes").insert({
    destination_slug: input.destination_slug,
    content,
    category: input.category,
    author_name: input.author_name?.trim() || null,
    language: input.language,
    moderation_status: "pending",
  });

  if (error) {
    logError("actions.communityNotes.submit", error, { destination_slug: input.destination_slug });
    return { error: "Couldn't save your tip. Please try again." };
  }

  return {};
}

async function requireEditor(): Promise<{ error?: string }> {
  if (!isSupabaseConfigured()) return { error: "Accounts aren't connected yet." };
  const user = await getCurrentUser();
  if (!isEditorEmail(user?.email)) return { error: "You're not authorized to moderate notes." };
  return {};
}

export async function approveCommunityNote(id: string): Promise<{ error?: string }> {
  const gate = await requireEditor();
  if (gate.error) return gate;
  if (!isSupabaseAdminConfigured()) return { error: "Moderation isn't connected yet." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("community_notes")
    .update({ moderation_status: "approved" })
    .eq("id", id);
  if (error) {
    logError("actions.communityNotes.approve", error, { id });
    return { error: "Couldn't approve that note." };
  }
  revalidatePath(COMMUNITY_PAGE_PATH);
  return {};
}

export async function rejectCommunityNote(id: string): Promise<{ error?: string }> {
  const gate = await requireEditor();
  if (gate.error) return gate;
  if (!isSupabaseAdminConfigured()) return { error: "Moderation isn't connected yet." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("community_notes")
    .update({ moderation_status: "rejected" })
    .eq("id", id);
  if (error) {
    logError("actions.communityNotes.reject", error, { id });
    return { error: "Couldn't reject that note." };
  }
  revalidatePath(COMMUNITY_PAGE_PATH);
  return {};
}
