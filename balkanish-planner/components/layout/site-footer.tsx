import Link from "next/link";
import { LogoMark } from "@/components/brand/logo-mark";
import { mainNav } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sage-dark text-cream">
      <div className="container py-10 sm:py-14">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark size={32} color="#F5EEE6" />
              <div>
                <p className="font-display text-lg font-semibold">BabicADesigns</p>
                <p className="font-script text-xs italic text-rose">The Balkanish AI Way</p>
              </div>
            </div>
            <p className="mt-4 max-w-xs font-serif text-sm text-cream/80">
              A trusted friend from the Balkans, helping you discover places most tourists miss.
            </p>
          </div>

          <div>
            <p className="mb-3 font-sans text-xs uppercase tracking-widest text-cream/60">Explore</p>
            <ul className="space-y-2">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="font-sans text-sm text-cream/85 hover:text-rose">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 font-sans text-xs uppercase tracking-widest text-cream/60">More</p>
            <ul className="space-y-2">
              <li>
                <Link href="/guides" className="font-sans text-sm text-cream/85 hover:text-rose">
                  Premium Guides
                </Link>
              </li>
              <li>
                <a href="https://babicadesigns.blog" className="font-sans text-sm text-cream/85 hover:text-rose">
                  babicadesigns.blog
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="lace-divider mt-10 opacity-60" aria-hidden="true" />

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="font-serif text-sm text-cream/75">Made in the Balkans.</p>
          <p className="font-serif text-sm text-cream/75">
            Created with Vegeta and Love by BabicADesigns.
          </p>
        </div>
      </div>
    </footer>
  );
}
