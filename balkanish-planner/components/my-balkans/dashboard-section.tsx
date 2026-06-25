import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function DashboardSection({
  eyebrow,
  title,
  isEmpty,
  emptyMessage,
  emptyHref,
  emptyCta,
  children,
}: {
  eyebrow: string;
  title: string;
  isEmpty: boolean;
  emptyMessage: string;
  emptyHref: string;
  emptyCta: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="font-sans text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl text-sage-dark sm:text-3xl">{title}</h2>
      {isEmpty ? (
        <div className="mt-5 rounded-xl border border-dashed border-border p-6 sm:mt-6 sm:p-8">
          <p className="font-serif text-foreground/80">{emptyMessage}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={emptyHref}>{emptyCta}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-5 sm:mt-6">{children}</div>
      )}
    </section>
  );
}
