"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { runCapturePipeline, runImageCapturePipeline } from "@/lib/capture/pipeline";
import {
  createInspirationCapture,
  confirmInspirationCapture,
  correctInspirationCapture,
  dismissInspirationCapture,
  deleteInspirationCapture,
  updateInspirationCapture,
} from "@/lib/data/inspiration-captures";
import type { InspirationCapturePatch } from "@/lib/types";

const FINDS_PATH = "/my-balkans/finds";

export type CaptureActionResult =
  | { success: true; captureId: string; extractionNote: string | null }
  | { success: false; error: string };

export async function captureFromUrl(
  url: string,
  userNote?: string,
): Promise<CaptureActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sign in to save your finds." };

  const { adapterResult, resolution, memorySpark } = await runCapturePipeline({
    source_url: url,
    user_note: userNote ?? null,
  });

  const record = await createInspirationCapture(user.id, {
    source_type: adapterResult.source_type,
    source_url: url,
    source_provider: adapterResult.source_provider,
    source_creator: adapterResult.source_creator,
    original_source_reference: adapterResult.original_source_reference,
    place_name: resolution.place_name,
    country_code: resolution.country_code,
    region: resolution.region,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    place_type: resolution.place_type,
    user_note: userNote ?? null,
    capture_context: adapterResult.capture_context,
    memory_spark: memorySpark,
    resolution_confidence: resolution.resolution_confidence,
    resolution_status: resolution.resolution_status,
    provenance: {
      adapter: adapterResult.provenance_metadata.adapter ?? "unknown",
      adapter_version: adapterResult.provenance_metadata.adapter_version ?? "unknown",
      extracted_at: adapterResult.provenance_metadata.extracted_at ?? new Date().toISOString(),
      resolution_method: resolution.resolution_method,
      raw_metadata: adapterResult.provenance_metadata,
      user_correction_applied: false,
      screenshot_analyzed: false,
      screenshot_retained: false,
    },
    captured_at: new Date().toISOString(),
    confirmed_at: null,
    dismissed_at: null,
  });

  if (!record) return { success: false, error: "Could not save your find. Please try again." };
  revalidatePath(FINDS_PATH);
  return { success: true, captureId: record.id, extractionNote: adapterResult.extraction_note };
}

export async function captureFromText(
  text: string,
  userNote?: string,
): Promise<CaptureActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sign in to save your finds." };

  const { adapterResult, resolution, memorySpark } = await runCapturePipeline({
    manual_text: text,
    user_note: userNote ?? null,
  });

  const record = await createInspirationCapture(user.id, {
    source_type: "MANUAL_TEXT",
    source_url: null,
    source_provider: null,
    source_creator: null,
    original_source_reference: null,
    place_name: resolution.place_name,
    country_code: resolution.country_code,
    region: resolution.region,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    place_type: resolution.place_type,
    user_note: userNote ?? null,
    capture_context: adapterResult.capture_context,
    memory_spark: memorySpark,
    resolution_confidence: resolution.resolution_confidence,
    resolution_status: resolution.resolution_status,
    provenance: {
      adapter: adapterResult.provenance_metadata.adapter ?? "unknown",
      adapter_version: adapterResult.provenance_metadata.adapter_version ?? "unknown",
      extracted_at: adapterResult.provenance_metadata.extracted_at ?? new Date().toISOString(),
      resolution_method: resolution.resolution_method,
      raw_metadata: adapterResult.provenance_metadata,
      user_correction_applied: false,
      screenshot_analyzed: false,
      screenshot_retained: false,
    },
    captured_at: new Date().toISOString(),
    confirmed_at: null,
    dismissed_at: null,
  });

  if (!record) return { success: false, error: "Could not save your find. Please try again." };
  revalidatePath(FINDS_PATH);
  return { success: true, captureId: record.id, extractionNote: null };
}

export async function captureFromScreenshot(
  imageDataBase64: string,
  userNote?: string,
): Promise<CaptureActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Sign in to save your finds." };

  // Image is analyzed transiently and immediately discarded — not stored anywhere
  const { adapterResult, resolution, memorySpark } = await runImageCapturePipeline(
    imageDataBase64,
    userNote,
  );

  const record = await createInspirationCapture(user.id, {
    source_type: "SCREENSHOT",
    source_url: null,
    source_provider: null,
    source_creator: null,
    original_source_reference: null,
    place_name: resolution.place_name,
    country_code: resolution.country_code,
    region: resolution.region,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    place_type: resolution.place_type,
    user_note: userNote ?? null,
    capture_context: adapterResult.capture_context,
    memory_spark: memorySpark,
    resolution_confidence: resolution.resolution_confidence,
    resolution_status: resolution.resolution_status,
    provenance: {
      adapter: adapterResult.provenance_metadata.adapter ?? "unknown",
      adapter_version: adapterResult.provenance_metadata.adapter_version ?? "unknown",
      extracted_at: adapterResult.provenance_metadata.extracted_at ?? new Date().toISOString(),
      resolution_method: resolution.resolution_method,
      raw_metadata: adapterResult.provenance_metadata,
      user_correction_applied: false,
      screenshot_analyzed: adapterResult.provenance_metadata.screenshot_analyzed === "true",
      screenshot_retained: false,  // Always false
    },
    captured_at: new Date().toISOString(),
    confirmed_at: null,
    dismissed_at: null,
  });

  if (!record) return { success: false, error: "Could not save your find. Please try again." };
  revalidatePath(FINDS_PATH);
  return { success: true, captureId: record.id, extractionNote: adapterResult.extraction_note };
}

export type PatchActionResult = { success: boolean; error?: string };

export async function confirmCapture(
  captureId: string,
  patch: InspirationCapturePatch,
): Promise<PatchActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  const result = await confirmInspirationCapture(user.id, captureId, patch);
  if (!result) return { success: false, error: "Could not confirm find." };
  revalidatePath(FINDS_PATH);
  return { success: true };
}

export async function correctCapture(
  captureId: string,
  patch: InspirationCapturePatch,
): Promise<PatchActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  const result = await correctInspirationCapture(user.id, captureId, patch);
  if (!result) return { success: false, error: "Could not correct find." };
  revalidatePath(FINDS_PATH);
  return { success: true };
}

export async function addNoteToCapture(
  captureId: string,
  note: string,
): Promise<PatchActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  const result = await updateInspirationCapture(user.id, captureId, { user_note: note });
  if (!result) return { success: false, error: "Could not update note." };
  revalidatePath(FINDS_PATH);
  return { success: true };
}

export async function dismissCapture(captureId: string): Promise<PatchActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  const ok = await dismissInspirationCapture(user.id, captureId);
  if (!ok) return { success: false, error: "Could not dismiss find." };
  revalidatePath(FINDS_PATH);
  return { success: true };
}

export async function deleteCapture(captureId: string): Promise<PatchActionResult> {
  if (!isSupabaseConfigured()) return { success: false, error: "Service unavailable." };
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated." };
  const ok = await deleteInspirationCapture(user.id, captureId);
  if (!ok) return { success: false, error: "Could not delete find." };
  revalidatePath(FINDS_PATH);
  return { success: true };
}
