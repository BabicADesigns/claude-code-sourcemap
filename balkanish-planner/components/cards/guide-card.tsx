import type { PremiumGuide } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditorialImage } from "@/components/brand/editorial";

export function GuideCard({ guide }: { guide: PremiumGuide }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <EditorialImage src={guide.cover_image_url} alt={guide.title} className="aspect-[3/4]" sizes="(min-width: 1024px) 25vw, 50vw">
        <Badge variant="accent" className="absolute right-3 top-3 z-20">
          {formatEUR(guide.price_eur)}
        </Badge>
      </EditorialImage>
      <div className="flex flex-1 flex-col gap-1.5 p-4 sm:gap-2 sm:p-5">
        <h3 className="font-display text-xl leading-snug text-sage-dark sm:text-2xl">{guide.title}</h3>
        <p className="line-clamp-3 flex-1 font-serif text-sm text-foreground/80 sm:line-clamp-4">{guide.description}</p>
        <Button disabled className="mt-3 w-full">
          Checkout coming soon
        </Button>
      </div>
    </div>
  );
}
