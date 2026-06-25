"use client";

import { useState } from "react";
import type { Destination } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import { generateDestinationGuidePdfBlob } from "@/lib/pdf/generate-destination-guide-pdf";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/utils";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";

/** Download-only — see docs/pdf-delivery-architecture.md for why destination guides skip Storage/email. */
export function DestinationGuidePdfButton({ destination, locale }: { destination: Destination; locale: Locale }) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setIsExporting(true);
    setError(null);
    try {
      const blob = await generateDestinationGuidePdfBlob(destination, locale);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${slugify(destination.name)}-balkanish-guide.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      track(ANALYTICS_EVENTS.PDF_GENERATED, { destination: destination.slug, document_type: "destination_guide" });
      track(ANALYTICS_EVENTS.PDF_DOWNLOADED, { destination: destination.slug, document_type: "destination_guide" });
    } catch {
      setError("Couldn't generate that PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <Button variant="outline" className="w-full" disabled={isExporting} onClick={handleDownload}>
        {isExporting ? "Preparing…" : "Download PDF Guide"}
      </Button>
      {error && <p className="mt-2 font-sans text-sm text-destructive">{error}</p>}
    </div>
  );
}
