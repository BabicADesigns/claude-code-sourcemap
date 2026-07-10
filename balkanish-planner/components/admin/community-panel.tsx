"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMUNITY_NOTE_CATEGORY_LABELS, type CommunityNote, type ModerationStatus } from "@/lib/types";
import { approveCommunityNote, rejectCommunityNote } from "@/lib/actions/community-notes";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<ModerationStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<ModerationStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-sage/15 text-sage-dark",
  rejected: "bg-destructive/10 text-destructive",
};

type NoteAction = "approve" | "reject";

export function CommunityPanel({ notes }: { notes: CommunityNote[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<{ id: string; action: NoteAction } | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { isError: boolean; text: string }>>({});

  async function runAction(id: string, action: NoteAction) {
    setPending({ id, action });
    const result =
      action === "approve" ? await approveCommunityNote(id) : await rejectCommunityNote(id);
    setPending(null);

    if (result.error) {
      setFeedback((prev) => ({ ...prev, [id]: { isError: true, text: result.error! } }));
      return;
    }
    const successText =
      action === "approve"
        ? "Approved — now visible to the public."
        : "Rejected — won't be surfaced again.";
    setFeedback((prev) => ({ ...prev, [id]: { isError: false, text: successText } }));
    router.refresh();
  }

  if (notes.length === 0) {
    return <p className="font-serif text-foreground/80">No community notes yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                {note.destination_slug} · {COMMUNITY_NOTE_CATEGORY_LABELS[note.category]} ·{" "}
                {note.language.toUpperCase()} ·{" "}
                {note.author_name ?? "Anonymous"} ·{" "}
                {new Date(note.submitted_at).toLocaleDateString()}
              </p>
              <p className="mt-2 font-serif text-sm leading-relaxed text-foreground/85">{note.content}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs uppercase tracking-widest ${STATUS_CLASS[note.moderation_status]}`}
            >
              {STATUS_LABEL[note.moderation_status]}
            </span>
          </div>

          {note.moderation_status === "pending" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pending?.id === note.id}
                onClick={() => runAction(note.id, "approve")}
              >
                {pending?.id === note.id && pending.action === "approve" ? "Approving…" : "Approve"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pending?.id === note.id}
                onClick={() => runAction(note.id, "reject")}
              >
                {pending?.id === note.id && pending.action === "reject" ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          )}

          {feedback[note.id] && (
            <p
              className={
                feedback[note.id].isError
                  ? "font-sans text-sm text-destructive"
                  : "font-sans text-sm text-sage-dark"
              }
            >
              {feedback[note.id].text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
