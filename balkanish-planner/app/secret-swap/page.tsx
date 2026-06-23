import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { SwapFinder } from "@/components/secret-swap/swap-finder";
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
      <div className="container py-12">
        <SwapFinder swaps={swaps} />
      </div>
    </div>
  );
}
