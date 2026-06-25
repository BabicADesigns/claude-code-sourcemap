"use client";

import { useEffect } from "react";
import { logError } from "@/lib/monitoring/logger";

// Last-resort boundary: only renders if the root layout itself throws, so it
// must define its own <html>/<body> instead of relying on app/layout.tsx.
// See docs/production-readiness.md "Error Handling".
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("app.global-error-boundary", error, { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
        <p className="text-xs uppercase tracking-widest text-accent">Something went wrong</p>
        <h1 className="max-w-xl text-3xl font-semibold leading-tight text-sage-dark sm:text-4xl">
          Balkanish Planner hit an unexpected error.
        </h1>
        <p className="max-w-md text-foreground/80">
          Please try again — if it keeps happening, refresh the page or come back in a moment.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
