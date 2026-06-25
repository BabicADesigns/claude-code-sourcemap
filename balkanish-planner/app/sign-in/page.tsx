import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader eyebrow="Account" title="Welcome back" description="Sign in to pick up your saved trips and favorites." />
      <div className="container py-8 sm:py-12">
        {error === "auth_callback_failed" && (
          <p className="mb-6 max-w-md font-sans text-sm text-destructive">
            That sign-in link didn&apos;t work — it may have expired. Please sign in again.
          </p>
        )}
        <AuthForm mode="sign-in" />
      </div>
    </div>
  );
}
