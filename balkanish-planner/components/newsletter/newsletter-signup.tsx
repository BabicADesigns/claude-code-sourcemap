"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/newsletter";
import { track, ANALYTICS_EVENTS } from "@/lib/analytics";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Reusable newsletter capture — "Join the Hidden List". Drop into any page; tags the subscription with its source. */
export function NewsletterSignup({ sourcePage, className }: { sourcePage: string; className?: string }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("sourcePage", sourcePage);
    const result = await subscribeToNewsletter(formData);
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    track(ANALYTICS_EVENTS.NEWSLETTER_SIGNUP, { source_page: sourcePage });
    setSubscribed(true);
  }

  return (
    <div className={cn("rounded-xl border border-accent/40 bg-accent/5 p-6 sm:p-8", className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sage-dark">
          <Mail className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-sage-dark">Join the Hidden List</p>
      </div>

      {subscribed ? (
        <p className="mt-4 font-serif text-foreground/85">
          You&rsquo;re on the list. Check {email} the next time we find something worth the detour.
        </p>
      ) : (
        <>
          <p className="mt-4 font-display text-xl leading-snug text-foreground sm:text-2xl">
            Occasional dispatches. No itinerary spam, no algorithm-chasing — just the next hidden gem before it stops
            being hidden.
          </p>
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <Label htmlFor={`newsletter-email-${sourcePage}`} className="sr-only">
                Email address
              </Label>
              <Input
                id={`newsletter-email-${sourcePage}`}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="shrink-0">
              {isSubmitting ? "Joining…" : "Join the list"}
            </Button>
          </form>
          {error && <p className="mt-3 font-sans text-sm text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}
