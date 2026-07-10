"use client";

import { useState, useTransition } from "react";
import { ResolutionConfirm } from "@/components/inspiration/resolution-confirm";
import { dismissCapture, deleteCapture } from "@/lib/actions/inspiration-captures";
import type { InspirationCapture, CaptureResolutionStatus } from "@/lib/types";
import {
  INSPIRATION_CAPTURE_SOURCE_LABELS,
  INSPIRATION_SOURCE_PROVIDER_LABELS,
} from "@/lib/types";

const STATUS_BADGE: Record<CaptureResolutionStatus, { label: string; className: string }> = {
  RESOLVED_HIGH_CONFIDENCE: { label: "Resolved", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  NEEDS_CONFIRMATION:       { label: "Confirm place?", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  AMBIGUOUS:                { label: "Ambiguous", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  UNRESOLVED:               { label: "Unresolved", className: "bg-muted text-muted-foreground" },
  USER_CONFIRMED:           { label: "Confirmed", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  USER_CORRECTED:           { label: "Corrected", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  DISMISSED:                { label: "Dismissed", className: "bg-muted text-muted-foreground" },
};

function sourceLabel(capture: InspirationCapture): string {
  if (capture.source_provider && capture.source_type === "SOCIAL_URL") {
    return INSPIRATION_SOURCE_PROVIDER_LABELS[capture.source_provider];
  }
  return INSPIRATION_CAPTURE_SOURCE_LABELS[capture.source_type];
}

function needsConfirmation(status: CaptureResolutionStatus): boolean {
  return status === "NEEDS_CONFIRMATION" || status === "AMBIGUOUS";
}

interface FindCardProps {
  capture: InspirationCapture;
}

export function FindCard({ capture }: FindCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (dismissed) return null;

  const badge = STATUS_BADGE[capture.resolution_status] ?? STATUS_BADGE.UNRESOLVED;

  function handleDismiss() {
    startTransition(async () => {
      await dismissCapture(capture.id);
      setDismissed(true);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this find permanently?")) return;
    startTransition(async () => {
      await deleteCapture(capture.id);
      setDismissed(true);
    });
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base text-sage-dark sm:text-lg">
            {capture.place_name ?? capture.capture_context ?? "Unnamed find"}
          </p>
          {capture.region || capture.country_code ? (
            <p className="mt-0.5 text-xs text-foreground/60">
              {[capture.region, capture.country_code].filter(Boolean).join(", ")}
            </p>
          ) : null}
        </div>
        <span className={["shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", badge.className].join(" ")}>
          {badge.label}
        </span>
      </div>

      {/* Memory Spark */}
      {capture.memory_spark && (
        <p className="mt-2 font-serif text-sm text-foreground/80 italic line-clamp-2">
          {capture.memory_spark}
        </p>
      )}

      {/* User note */}
      {capture.user_note && (
        <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground/70">
          {capture.user_note}
        </p>
      )}

      {/* Confirmation prompt */}
      {needsConfirmation(capture.resolution_status) && capture.place_name && (
        <ResolutionConfirm capture={capture} />
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-foreground/40">
          {sourceLabel(capture)}
          {capture.source_url ? (
            <>
              {" · "}
              <a
                href={capture.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground/70"
              >
                View source
              </a>
            </>
          ) : null}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            className="text-xs text-foreground/40 hover:text-foreground/70 disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
