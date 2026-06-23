"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/brand/logo-mark";
import { mainNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between sm:h-20">
        <Link href="/" className="flex items-center gap-2 sm:gap-3" onClick={() => setOpen(false)}>
          <LogoMark size={30} className="sm:hidden" />
          <LogoMark size={36} className="hidden sm:block" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold text-sage-dark sm:text-xl">BabicADesigns</span>
            <span className="hidden font-script text-xs italic text-rose sm:block">The Balkanish AI Way</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "font-sans text-sm tracking-wide text-foreground/80 transition-colors hover:text-primary",
                pathname?.startsWith(item.href) && "text-primary font-medium"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link href="/sign-in" className="font-sans text-sm text-foreground/80 transition-colors hover:text-primary">
            Sign In
          </Link>
          <Button asChild size="sm">
            <Link href="/planner">Plan My Trip</Link>
          </Button>
        </div>

        <button
          className="-mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-border bg-background lg:hidden">
          <p className="container pt-3 font-script text-xs italic text-rose">The Balkanish AI Way</p>
          <ul className="container flex flex-col gap-1 py-3">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block min-h-11 rounded-sm px-2 py-3 font-sans text-base text-foreground/85 hover:bg-muted"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="block min-h-11 rounded-sm px-2 py-3 font-sans text-base text-foreground/85 hover:bg-muted"
              >
                Sign In
              </Link>
            </li>
            <li className="pt-1">
              <Link
                href="/planner"
                onClick={() => setOpen(false)}
                className="block rounded-md bg-primary px-2 py-3 text-center font-sans text-base font-medium text-primary-foreground"
              >
                Plan My Trip
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
