import { PDF_DOCUMENT_TYPE_LABELS, DELIVERY_STATUS_LABELS, type PdfDeliveryWithDocument } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Read-only log of every PDF download/email send, newest first — see lib/data/pdf-delivery.ts. */
export function DeliveryHistory({ deliveries }: { deliveries: PdfDeliveryWithDocument[] }) {
  return (
    <div className="flex flex-col gap-2">
      {deliveries.map((delivery) => (
        <div
          key={delivery.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-sans text-sm text-foreground">
              {PDF_DOCUMENT_TYPE_LABELS[delivery.document.document_type]} ·{" "}
              {delivery.channel === "email" ? "Emailed" : "Downloaded"}
              {delivery.recipient_email ? ` to ${delivery.recipient_email}` : ""}
            </p>
            <p className="font-sans text-xs text-muted-foreground">{formatDate(delivery.created_at)}</p>
          </div>
          <span
            className={
              delivery.status === "failed"
                ? "font-sans text-xs uppercase tracking-widest text-destructive"
                : "font-sans text-xs uppercase tracking-widest text-sage-dark"
            }
          >
            {DELIVERY_STATUS_LABELS[delivery.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
