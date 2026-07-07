"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { confirmCapture, correctCapture } from "@/lib/actions/inspiration-captures";
import type { InspirationCapture } from "@/lib/types";

interface ResolutionConfirmProps {
  capture: InspirationCapture;
  onDone?: () => void;
}

export function ResolutionConfirm({ capture, onDone }: ResolutionConfirmProps) {
  const [mode, setMode] = useState<"ask" | "correct" | "done">("ask");
  const [correctedPlace, setCorrectedPlace] = useState(capture.place_name ?? "");
  const [correctedCountry, setCorrectedCountry] = useState(capture.country_code ?? "");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (mode === "done") return null;

  function handleConfirm() {
    startTransition(async () => {
      const result = await confirmCapture(capture.id, {
        place_name: capture.place_name,
        country_code: capture.country_code,
        region: capture.region ?? undefined,
        place_type: capture.place_type ?? undefined,
      });
      if (!result.success) { setErrorMsg(result.error ?? "Could not confirm."); return; }
      setMode("done");
      onDone?.();
    });
  }

  function handleCorrect() {
    startTransition(async () => {
      if (!correctedPlace.trim()) { setErrorMsg("Please enter a place name."); return; }
      const result = await correctCapture(capture.id, {
        place_name: correctedPlace.trim(),
        country_code: correctedCountry.trim() || undefined,
      });
      if (!result.success) { setErrorMsg(result.error ?? "Could not save correction."); return; }
      setMode("done");
      onDone?.();
    });
  }

  if (mode === "correct") {
    return (
      <div className="mt-3 rounded-lg border border-border bg-background p-3 space-y-2">
        <p className="text-xs font-medium text-foreground/70">Correct the place name</p>
        <input
          type="text"
          value={correctedPlace}
          onChange={(e) => setCorrectedPlace(e.target.value)}
          placeholder="Place name"
          className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <input
          type="text"
          value={correctedCountry}
          onChange={(e) => setCorrectedCountry(e.target.value)}
          placeholder="Country code (e.g. HR, ME, SI)"
          className="w-full rounded border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCorrect} disabled={isPending}>
            {isPending ? "Saving…" : "Save correction"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("ask")} disabled={isPending}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-amber-50/50 p-3 dark:bg-amber-950/20">
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Is this{" "}
        <strong>
          {capture.place_name ?? "the right place"}
          {capture.country_code ? `, ${capture.country_code}` : ""}
        </strong>
        ?
      </p>
      {errorMsg && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isPending}
          className="rounded-md bg-sage-dark px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
        >
          Yes, that&apos;s right
        </button>
        <button
          type="button"
          onClick={() => setMode("correct")}
          disabled={isPending}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/70 hover:text-foreground disabled:opacity-60"
        >
          Not quite
        </button>
      </div>
    </div>
  );
}
