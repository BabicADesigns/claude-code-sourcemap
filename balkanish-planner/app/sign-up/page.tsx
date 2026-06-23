import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function SignUpPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Create your account"
        description="Save trips, favorite hidden gems, and keep your AI-generated itineraries in one place."
      />
      <div className="container py-12">
        <AuthForm mode="sign-up" />
      </div>
    </div>
  );
}
