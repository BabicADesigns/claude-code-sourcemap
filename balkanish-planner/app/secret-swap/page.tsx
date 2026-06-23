import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SwapFinder } from "@/components/secret-swap/swap-finder";
import { RakijaDiplomacy } from "@/components/brand/content-blocks";
import { getSecretSwaps } from "@/lib/data/secret-swaps";

export const metadata: Metadata = {
  title: "Secret Swap",
  description: "Loved a famous Balkan destination? Find the quieter alternative locals actually visit.",
};

export default async function SecretSwapPage() {
  const swaps = await getSecretSwaps();

  return (
    <div>
      <PageHeader
        eyebrow="Secret Swap"
        title="Loved the famous spot? Try this instead."
        description="Pick a destination everyone already knows. We'll point you to the version locals actually prefer."
      />
      <div className="container py-8 sm:py-12">
        <RakijaDiplomacy>
          Tell a local their favorite town is overrated and they&rsquo;ll argue for an hour, pour you a glass, and quietly agree.
        </RakijaDiplomacy>
        <div className="mt-8 sm:mt-10">
          <SwapFinder swaps={swaps} />
        </div>
      </div>
    </div>
  );
}
