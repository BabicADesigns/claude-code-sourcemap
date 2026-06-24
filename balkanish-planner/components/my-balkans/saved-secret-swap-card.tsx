import Link from "next/link";
import type { SecretSwap } from "@/lib/types";
import { EditorialImage } from "@/components/brand/editorial";
import { SaveButton } from "@/components/save/save-button";
import { Button } from "@/components/ui/button";

export function SavedSecretSwapCard({ swap }: { swap: SecretSwap }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <EditorialImage src={swap.alternative.hero_image_url} alt={swap.alternative.name} className="aspect-[4/3]">
        <SaveButton
          entityType="secret_swap"
          entityId={swap.id}
          initialSaved
          className="absolute right-3 top-3 z-20"
        />
      </EditorialImage>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:p-5">
        <p className="font-sans text-xs uppercase tracking-widest text-muted-foreground">
          Instead of {swap.famous_name}
        </p>
        <h3 className="font-display text-xl leading-snug text-sage-dark">{swap.alternative.name}</h3>
        <Button asChild variant="outline" size="sm" className="mt-2 self-start">
          <Link href={`/hidden-gems/${swap.alternative.slug}`}>Explore {swap.alternative.name} →</Link>
        </Button>
      </div>
    </div>
  );
}
