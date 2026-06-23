import { WaveDivider } from "@/components/brand/editorial";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-border bg-muted/30 py-10 sm:py-16">
      <div className="container">
        <p className="font-sans text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
        <h1 className="mt-2 max-w-2xl font-display text-3xl leading-tight text-sage-dark sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-xl font-serif text-sm text-foreground/80 sm:mt-4 sm:text-base">{description}</p>}
        <WaveDivider className="mt-5 w-16 sm:mt-6" />
      </div>
    </header>
  );
}
