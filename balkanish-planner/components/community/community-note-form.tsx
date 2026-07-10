"use client";

import { useState } from "react";
import { COMMUNITY_NOTE_CATEGORY_LABELS, type CommunityNoteCategory } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { submitCommunityNote } from "@/lib/actions/community-notes";
import { Button } from "@/components/ui/button";

const CATEGORIES = Object.keys(COMMUNITY_NOTE_CATEGORY_LABELS) as CommunityNoteCategory[];

export function CommunityNoteForm({
  destinationSlug,
  locale,
}: {
  destinationSlug: string;
  locale: Locale;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CommunityNoteCategory>("other");
  const [authorName, setAuthorName] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    const result = await submitCommunityNote({
      destination_slug: destinationSlug,
      content,
      category,
      author_name: authorName || undefined,
      language: locale,
    });
    if (result.error) {
      setErrorMessage(result.error);
      setState("error");
    } else {
      setState("success");
      setContent("");
      setAuthorName("");
    }
  }

  if (state === "success") {
    return (
      <p className="rounded-xl border border-secondary/40 bg-secondary/10 px-5 py-4 font-serif text-sm text-sage-dark">
        Thank you — your tip is pending editorial review.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Share a Tip
      </p>
      <div>
        <label className="block font-sans text-xs font-medium uppercase tracking-widest text-foreground/70 mb-1.5">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CommunityNoteCategory)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-sans text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {COMMUNITY_NOTE_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-sans text-xs font-medium uppercase tracking-widest text-foreground/70 mb-1.5">
          Your tip
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={10}
          maxLength={500}
          rows={3}
          placeholder="Something you discovered that others would love to know…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40 resize-none"
        />
        <p className="mt-1 font-sans text-[10px] text-muted-foreground">{content.length}/500</p>
      </div>
      <div>
        <label className="block font-sans text-xs font-medium uppercase tracking-widest text-foreground/70 mb-1.5">
          Your name (optional)
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Leave blank to stay anonymous"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/40"
        />
      </div>
      {state === "error" && (
        <p className="font-sans text-sm text-destructive">{errorMessage}</p>
      )}
      <Button type="submit" disabled={state === "submitting"} size="sm">
        {state === "submitting" ? "Sharing…" : "Share tip"}
      </Button>
    </form>
  );
}
