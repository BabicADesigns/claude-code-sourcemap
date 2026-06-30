"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiscoveredDestination, ModerationStatus } from "@/lib/types";
import {
  approveDiscoveredDestination,
  rejectDiscoveredDestination,
  promoteDiscoveredDestination,
} from "@/lib/actions/discovered-destinations";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<ModerationStatus, string> = {
  pending: "Pending review",
  approved: "Community Verified",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<ModerationStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-sage/15 text-sage-dark",
  rejected: "bg-destructive/10 text-destructive",
};

type Action = "approve" | "reject" | "promote";

export function DiscoveriesPanel({ discoveries }: { discoveries: DiscoveredDestination[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<{ id: string; action: Action } | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { isError: boolean; text: string }>>({});

  async function runAction(id: string, action: Action) {
    setPending({ id, action });
    const result =
      action === "approve"
        ? await approveDiscoveredDestination(id)
        : action === "reject"
          ? await rejectDiscoveredDestination(id)
          : await promoteDiscoveredDestination(id);
    setPending(null);

    if (result.error) {
      setFeedback((prev) => ({ ...prev, [id]: { isError: true, text: result.error! } }));
      return;
    }
    const successText =
      action === "approve"
        ? "Approved — now showing as Community Verified."
        : action === "reject"
          ? "Rejected — won't be surfaced as a suggestion again."
          : `Promoted to an official destination (slug: ${"destinationSlug" in result ? result.destinationSlug : ""}).`;
    setFeedback((prev) => ({ ...prev, [id]: { isError: false, text: successText } }));
    router.refresh();
  }

  if (discoveries.length === 0) {
    return <p className="font-serif text-foreground/80">No AI-discovered destinations yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {discoveries.map((discovery) => (
        <div key={discovery.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                {discovery.region}, {discovery.country} · {Math.round(discovery.confidence_score * 100)}% confidence ·
                suggested {discovery.times_suggested}x · saved {discovery.times_saved}x
              </p>
              <h3 className="mt-1 font-display text-xl text-sage-dark">{discovery.name}</h3>
              <p className="mt-1 font-serif text-sm text-foreground/80">{discovery.rationale}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs uppercase tracking-widest ${STATUS_CLASS[discovery.moderation_status]}`}>
              {STATUS_LABEL[discovery.moderation_status]}
            </span>
          </div>

          {discovery.promoted_destination_id ? (
            <p className="font-sans text-sm text-sage-dark">Already promoted to an official destination.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pending?.id === discovery.id}
                onClick={() => runAction(discovery.id, "approve")}
              >
                {pending?.id === discovery.id && pending.action === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending?.id === discovery.id}
                onClick={() => runAction(discovery.id, "reject")}
              >
                {pending?.id === discovery.id && pending.action === "reject" ? "Rejecting…" : "Reject"}
              </Button>
              <Button
                size="sm"
                disabled={pending?.id === discovery.id}
                onClick={() => runAction(discovery.id, "promote")}
              >
                {pending?.id === discovery.id && pending.action === "promote" ? "Promoting…" : "Promote to Official Destination"}
              </Button>
            </div>
          )}

          {feedback[discovery.id] && (
            <p className={feedback[discovery.id].isError ? "font-sans text-sm text-destructive" : "font-sans text-sm text-sage-dark"}>
              {feedback[discovery.id].text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
