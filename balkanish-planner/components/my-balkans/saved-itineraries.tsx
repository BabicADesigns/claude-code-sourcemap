"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { SavedItinerary } from "@/lib/types";
import { TRAVEL_STYLE_LABELS } from "@/lib/types";
import { deleteItinerary, renameItinerary } from "@/lib/actions/itineraries";
import { downloadItineraryPdf, emailItineraryPdf, regenerateItineraryPdf } from "@/lib/actions/pdf-delivery";
import { ItineraryView } from "@/components/planner/itinerary-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocale } from "@/lib/i18n/locale-provider";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

function tripName(saved: SavedItinerary) {
  return saved.title ?? saved.itinerary_json.trip_title;
}

type PdfAction = "download" | "email" | "regenerate";

export function SavedItineraries({ itineraries }: { itineraries: SavedItinerary[] }) {
  const router = useRouter();
  const { locale } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pdfPending, setPdfPending] = useState<{ id: string; action: PdfAction } | null>(null);
  const [pdfFeedback, setPdfFeedback] = useState<Record<string, { isError: boolean; text: string }>>({});

  const openItinerary = itineraries.find((i) => i.id === openId) ?? null;

  async function handleDelete(id: string) {
    setPendingId(id);
    await deleteItinerary(id);
    setPendingId(null);
    router.refresh();
  }

  function startRename(saved: SavedItinerary) {
    setRenamingId(saved.id);
    setRenameValue(tripName(saved));
  }

  async function confirmRename(id: string) {
    setPendingId(id);
    await renameItinerary(id, renameValue);
    setPendingId(null);
    setRenamingId(null);
    router.refresh();
  }

  async function handleDownloadPdf(saved: SavedItinerary) {
    setPdfPending({ id: saved.id, action: "download" });
    const result = await downloadItineraryPdf(saved.id, locale);
    setPdfPending(null);
    if (result.error || !result.url) {
      setPdfFeedback((prev) => ({ ...prev, [saved.id]: { isError: true, text: result.error ?? "Something went wrong." } }));
      return;
    }
    setPdfFeedback((prev) => ({ ...prev, [saved.id]: { isError: false, text: "Download ready." } }));
    track(ANALYTICS_EVENTS.PDF_DOWNLOADED, { itinerary_id: saved.id });
    window.open(result.url, "_blank");
    router.refresh();
  }

  async function handleEmailPdf(saved: SavedItinerary) {
    setPdfPending({ id: saved.id, action: "email" });
    const result = await emailItineraryPdf(saved.id, locale);
    setPdfPending(null);
    if (result.error) {
      setPdfFeedback((prev) => ({ ...prev, [saved.id]: { isError: true, text: result.error! } }));
      return;
    }
    setPdfFeedback((prev) => ({ ...prev, [saved.id]: { isError: false, text: "Emailed to your inbox." } }));
    track(ANALYTICS_EVENTS.PDF_EMAILED, { itinerary_id: saved.id });
    router.refresh();
  }

  async function handleRegeneratePdf(saved: SavedItinerary) {
    setPdfPending({ id: saved.id, action: "regenerate" });
    const result = await regenerateItineraryPdf(saved.id, locale);
    setPdfPending(null);
    if (result.error || !result.url) {
      setPdfFeedback((prev) => ({ ...prev, [saved.id]: { isError: true, text: result.error ?? "Something went wrong." } }));
      return;
    }
    setPdfFeedback((prev) => ({ ...prev, [saved.id]: { isError: false, text: "Regenerated — download ready." } }));
    track(ANALYTICS_EVENTS.PDF_GENERATED, { itinerary_id: saved.id });
    window.open(result.url, "_blank");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {itineraries.map((saved) => (
          <div
            key={saved.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
                {saved.duration_days} days · {saved.month} · {TRAVEL_STYLE_LABELS[saved.travel_style]}
              </p>
              {renamingId === saved.id ? (
                <div className="mt-1 flex max-w-sm items-center gap-2">
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmRename(saved.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                  />
                  <Button size="sm" disabled={pendingId === saved.id} onClick={() => confirmRename(saved.id)}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startRename(saved)}
                  className="group mt-1 flex items-center gap-2 text-left"
                  aria-label="Rename trip"
                >
                  <h3 className="font-display text-xl text-sage-dark">{tripName(saved)}</h3>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )}
            </div>
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpenId(saved.id)}>
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pdfPending?.id === saved.id}
                  onClick={() => handleDownloadPdf(saved)}
                >
                  {pdfPending?.id === saved.id && pdfPending.action === "download" ? "Preparing…" : "Download PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pdfPending?.id === saved.id}
                  onClick={() => handleEmailPdf(saved)}
                >
                  {pdfPending?.id === saved.id && pdfPending.action === "email" ? "Sending…" : "Email PDF"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pdfPending?.id === saved.id}
                  onClick={() => handleRegeneratePdf(saved)}
                >
                  {pdfPending?.id === saved.id && pdfPending.action === "regenerate" ? "Regenerating…" : "Regenerate PDF"}
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/planner">Edit in Planner</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pendingId === saved.id}
                  onClick={() => handleDelete(saved.id)}
                >
                  {pendingId === saved.id ? "Removing…" : "Delete"}
                </Button>
              </div>
              {pdfFeedback[saved.id] && (
                <p
                  className={
                    pdfFeedback[saved.id].isError
                      ? "font-sans text-sm text-destructive"
                      : "font-sans text-sm text-sage-dark"
                  }
                >
                  {pdfFeedback[saved.id].text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {openItinerary && (
            <>
              <DialogHeader>
                <DialogTitle>{tripName(openItinerary)}</DialogTitle>
                <DialogDescription>
                  {openItinerary.duration_days} days · {openItinerary.month} ·{" "}
                  {TRAVEL_STYLE_LABELS[openItinerary.travel_style]}
                </DialogDescription>
              </DialogHeader>
              <div className="mb-4 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print
                </Button>
              </div>
              <ItineraryView itinerary={openItinerary.itinerary_json} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
