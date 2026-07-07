"use client";

/**
 * ShareModal — Entry point for the share flow.
 *
 * Renders a Dialog with:
 * - Format picker (Story / Feed / Postcard)
 * - Template picker (Journey Summary / Balkan Story / Postcard)
 * - TripShareCard preview (the html-to-image capture target)
 * - Download button (always available)
 * - Share button (only when navigator.share + File API are supported)
 * - Privacy note
 *
 * The TripShareCard is rendered off-screen at its true pixel dimensions.
 * The visible preview is a CSS-scaled copy in the dialog.
 * toPng() is called with explicit width/height to avoid bounding-rect issues.
 */

import { useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TripShareCard } from "@/components/share/trip-share-card";
import { useWebShare } from "@/lib/share/use-web-share";
import { SHARE_CARD_DIMENSIONS } from "@/lib/share/types";
import { SHARE_TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/lib/share/templates";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import type { TripShareSnapshot, ShareFormat, ShareTemplateId } from "@/lib/share/types";

// Preview scale for the modal: the card renders at this scale visually only.
// The off-screen capture target renders at 1× and is captured at 2× pixelRatio.
const PREVIEW_SCALE = 0.72;

interface ShareModalProps {
  open: boolean;
  onClose(): void;
  snapshot: TripShareSnapshot;
}

const FORMAT_LABELS: Record<ShareFormat, string> = {
  story: "Story",
  feed: "Feed",
  postcard: "Postcard",
};

const FORMAT_HINT: Record<ShareFormat, string> = {
  story: "9:16 · portrait",
  feed: "1:1 · square",
  postcard: "4:5 · portrait",
};

export function ShareModal({ open, onClose, snapshot }: ShareModalProps) {
  const [format, setFormat] = useState<ShareFormat>("feed");
  const [template, setTemplate] = useState<ShareTemplateId>(DEFAULT_TEMPLATE_ID);
  const [isExporting, startExport] = useTransition();
  const captureRef = useRef<HTMLDivElement>(null);
  const { canShare, status: shareStatus, shareImage } = useWebShare();

  const dims = SHARE_CARD_DIMENSIONS[format];
  const fileName = `balkanish-trip-${snapshot.durationDays}n-${snapshot.month.toLowerCase()}.png`;

  async function captureCard(): Promise<string | null> {
    if (!captureRef.current) return null;
    const { toPng } = await import("html-to-image");
    return toPng(captureRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      width: dims.width,
      height: dims.height,
    });
  }

  function handleDownload() {
    startExport(async () => {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      track(ANALYTICS_EVENTS.SHARE_DOWNLOADED, { format, template });
    });
  }

  function handleShare() {
    startExport(async () => {
      const dataUrl = await captureCard();
      if (!dataUrl) return;
      track(ANALYTICS_EVENTS.SHARE_NATIVE_OPENED, { format, template });
      await shareImage(dataUrl, fileName, snapshot.title);
    });
  }

  function handleFormatChange(f: ShareFormat) {
    setFormat(f);
    track(ANALYTICS_EVENTS.SHARE_FORMAT_SELECTED, { format: f });
  }

  const availableTemplates = SHARE_TEMPLATES.filter((t) =>
    t.formats.includes(format)
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-sage-dark">
            Share this trip
          </DialogTitle>
          <DialogDescription className="font-sans text-sm text-foreground/60">
            {snapshot.title}
          </DialogDescription>
        </DialogHeader>

        {/* Format picker */}
        <div>
          <p className="mb-2 font-sans text-xs uppercase tracking-widest text-foreground/40">
            Format
          </p>
          <div className="flex gap-2">
            {(["feed", "story", "postcard"] as ShareFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleFormatChange(f)}
                className={[
                  "flex flex-col items-center rounded-lg border px-3 py-2 text-left transition-colors",
                  format === f
                    ? "border-sage-dark bg-sage-dark/5 text-sage-dark"
                    : "border-border text-foreground/60 hover:border-sage-dark/30",
                ].join(" ")}
              >
                <span className="font-sans text-sm font-medium">
                  {FORMAT_LABELS[f]}
                </span>
                <span className="font-sans text-[10px] text-foreground/40">
                  {FORMAT_HINT[f]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Template picker */}
        {availableTemplates.length > 1 && (
          <div>
            <p className="mb-2 font-sans text-xs uppercase tracking-widest text-foreground/40">
              Style
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={[
                    "rounded-full border px-3 py-1 font-sans text-xs transition-colors",
                    template === t.id
                      ? "border-sage-dark bg-sage-dark text-cream"
                      : "border-border text-foreground/60 hover:border-sage-dark/30",
                  ].join(" ")}
                >
                  {TEMPLATE_NAMES[t.id]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview area */}
        <div className="flex flex-col items-center gap-2">
          <p className="self-start font-sans text-xs uppercase tracking-widest text-foreground/40">
            Preview
          </p>
          {/* Scaled preview wrapper — visual only */}
          <div
            style={{
              width: dims.width * PREVIEW_SCALE,
              height: dims.height * PREVIEW_SCALE,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: "top left" }}>
              {/* This clone is the visual preview; capture happens on the hidden element below */}
              <TripShareCard snapshot={snapshot} format={format} template={template} />
            </div>
          </div>
        </div>

        {/* Hidden off-screen capture target — no parent transform, exact pixel size */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: -9999,
            left: -9999,
            pointerEvents: "none",
          }}
        >
          <TripShareCard
            ref={captureRef}
            snapshot={snapshot}
            format={format}
            template={template}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? "Preparing…" : "Save image"}
          </Button>
          {canShare && (
            <Button
              variant="outline"
              onClick={handleShare}
              disabled={isExporting || shareStatus.state === "sharing"}
              className="flex-1"
            >
              {shareStatus.state === "sharing" ? "Opening…" : "Share"}
            </Button>
          )}
        </div>

        {/* Share status feedback */}
        {shareStatus.state === "error" && (
          <p className="font-sans text-xs text-destructive">
            {shareStatus.message}
          </p>
        )}

        {/* Privacy note */}
        <p className="font-sans text-[11px] text-foreground/30">
          The image is created in your browser and never uploaded automatically.
          Only what you choose to share leaves your device.
        </p>
      </DialogContent>
    </Dialog>
  );
}

const TEMPLATE_NAMES: Record<ShareTemplateId, string> = {
  JOURNEY_SUMMARY: "Journey",
  BALKAN_STORY: "Story",
  POSTCARD: "Postcard",
};
