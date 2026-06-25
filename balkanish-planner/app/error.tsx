"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/monitoring/logger";

// Catches rendering/data errors thrown by any page or layout below the root layout.
// The header/footer chrome from app/layout.tsx keeps rendering around this boundary.
// See docs/production-readiness.md "Error Handling".
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("app.error-boundary", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-16 text-center">
      <p className="font-sans text-xs uppercase tracking-widest text-accent">Something went wrong</p>
      <h1 className="max-w-xl font-display text-3xl leading-tight text-sage-dark sm:text-4xl">
        We hit a snag putting this page together.
      </h1>
      <p className="max-w-md font-serif text-foreground/80">
        Please try again — if it keeps happening, the trip is still saved and nothing has been lost.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
