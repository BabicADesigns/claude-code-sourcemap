import Image from "next/image";
import type { PremiumGuide } from "@/lib/types";
import { formatEUR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function GuideCard({ guide }: { guide: PremiumGuide }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border bg-card">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={guide.cover_image_url}
          alt={guide.title}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
        <Badge variant="accent" className="absolute right-3 top-3">
          {formatEUR(guide.price_eur)}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-2xl leading-snug text-sage-dark">{guide.title}</h3>
        <p className="line-clamp-4 flex-1 font-serif text-sm text-foreground/80">{guide.description}</p>
        <Button disabled className="mt-3 w-full">
          Checkout coming soon
        </Button>
      </div>
    </div>
  );
}
