"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton({
  className,
  children,
  signingOutLabel,
}: {
  className?: string;
  children: React.ReactNode;
  signingOutLabel: string;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function onClick() {
    setIsSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button type="button" onClick={onClick} disabled={isSigningOut} className={className}>
      {isSigningOut ? signingOutLabel : children}
    </button>
  );
}
