import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
  return (
    <div>
      <PageHeader eyebrow="Account" title="Welcome back" description="Sign in to pick up your saved trips and favorites." />
      <div className="container py-12">
        <AuthForm mode="sign-in" />
      </div>
    </div>
  );
}
