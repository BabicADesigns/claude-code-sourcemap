"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <p className="max-w-md font-serif text-foreground/80">
        Accounts aren&apos;t connected yet — this page will come alive once the Balkanish Planner is linked to its
        Supabase project. Until then, every Hidden Gem, Food Find, and Culture Note is open to everyone.
      </p>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    if (mode === "sign-up") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      setIsSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      setConfirmationSent(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (confirmationSent) {
    return (
      <p className="max-w-md font-serif text-foreground/80">
        Almost there — check {email} for a confirmation link to activate your account.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm">
      <div className="flex flex-col gap-5">
        {mode === "sign-up" && (
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              className="mt-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            className="mt-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            className="mt-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
      </div>

      {error && <p className="mt-4 font-sans text-sm text-destructive">{error}</p>}

      <Button type="submit" className="mt-6 w-full" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>

      <p className="mt-6 font-sans text-sm text-muted-foreground">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
