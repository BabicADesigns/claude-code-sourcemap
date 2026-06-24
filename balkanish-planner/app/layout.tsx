import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PlausibleScript } from "@/components/analytics/plausible-script";
import { getCurrentUser } from "@/lib/supabase/server";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  style: ["italic", "normal"],
  weight: ["500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://balkanish.babicadesigns.blog";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Balkanish Planner — Travel the Balkans like someone invited you",
    template: "%s — Balkanish Planner",
  },
  description:
    "Hidden gems, food stories, cultural insights and AI-crafted itineraries for the Balkans. The Balkanish AI Way, by BabicADesigns.",
  openGraph: {
    title: "Balkanish Planner",
    description: "Travel the Balkans like someone invited you.",
    siteName: "Balkanish Planner",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Balkanish Planner",
    description: "Travel the Balkans like someone invited you.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={`${cormorant.variable} ${ebGaramond.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <PlausibleScript />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <SiteHeader user={user ? { email: user.email ?? "" } : null} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
