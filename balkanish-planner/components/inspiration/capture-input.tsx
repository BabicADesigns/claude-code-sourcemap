"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { captureFromUrl, captureFromText, captureFromScreenshot } from "@/lib/actions/inspiration-captures";

type Tab = "url" | "text" | "screenshot";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix — we only want the raw base64 string
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CaptureInput({ onCaptured }: { onCaptured?: () => void }) {
  const [tab, setTab] = useState<Tab>("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function showStatus(message: string, error = false) {
    setStatusMessage(message);
    setIsError(error);
    if (!error) setTimeout(() => setStatusMessage(null), 4000);
  }

  async function handleSubmit() {
    setStatusMessage(null);
    startTransition(async () => {
      if (tab === "url") {
        if (!urlInput.trim()) { showStatus("Paste a URL to get started.", true); return; }
        const result = await captureFromUrl(urlInput.trim(), noteInput.trim() || undefined);
        if (!result.success) { showStatus(result.error, true); return; }
        showStatus(result.extractionNote ?? "Saved to your Balkan Finds.");
        setUrlInput(""); setNoteInput("");
        onCaptured?.();
      } else if (tab === "text") {
        if (!textInput.trim()) { showStatus("Enter a place name or recommendation.", true); return; }
        const result = await captureFromText(textInput.trim(), noteInput.trim() || undefined);
        if (!result.success) { showStatus(result.error, true); return; }
        showStatus("Saved to your Balkan Finds.");
        setTextInput(""); setNoteInput("");
        onCaptured?.();
      } else {
        if (!file) { showStatus("Choose a screenshot to upload.", true); return; }
        try {
          const b64 = await toBase64(file);
          const result = await captureFromScreenshot(b64, noteInput.trim() || undefined);
          if (!result.success) { showStatus(result.error, true); return; }
          showStatus(result.extractionNote ?? "Screenshot processed and saved. The image was not stored.");
          setFile(null);
          if (fileRef.current) fileRef.current.value = "";
          setNoteInput("");
          onCaptured?.();
        } catch {
          showStatus("Could not read the image. Please try a JPEG or PNG.", true);
        }
      }
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "url", label: "URL / Link" },
    { id: "text", label: "Place name" },
    { id: "screenshot", label: "Screenshot" },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">Capture</p>
      <h2 className="mt-1 font-display text-xl text-sage-dark sm:text-2xl">
        Save a new find
      </h2>
      <p className="mt-1 font-serif text-sm text-foreground/70">
        Paste a link, type a place name, or upload a screenshot — your source may disappear, but your find won&apos;t.
      </p>

      {/* Tab switcher */}
      <div className="mt-4 flex gap-1 rounded-lg border border-border bg-background p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); setStatusMessage(null); }}
            className={[
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-sage-dark text-white"
                : "text-foreground/60 hover:text-foreground",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input fields */}
      <div className="mt-4 space-y-3">
        {tab === "url" && (
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://instagram.com/reel/… or any web link"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        )}
        {tab === "text" && (
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. Plitvice Lakes, Croatia — waterfalls worth the drive"
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
          />
        )}
        {tab === "screenshot" && (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-foreground/70 file:mr-3 file:rounded-md file:border-0 file:bg-sage-dark/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sage-dark"
            />
            <p className="mt-1.5 text-xs text-foreground/50">
              Screenshot is analyzed for context and immediately discarded. Never stored.
            </p>
          </div>
        )}

        <input
          type="text"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          placeholder="Your note (optional) — why you saved it, who recommended it"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {/* Status */}
      {statusMessage && (
        <p className={[
          "mt-3 rounded-lg px-3 py-2 text-sm",
          isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700",
        ].join(" ")}>
          {statusMessage}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        className="mt-4 w-full sm:w-auto"
      >
        {isPending ? "Saving…" : "Save this find"}
      </Button>
    </div>
  );
}
