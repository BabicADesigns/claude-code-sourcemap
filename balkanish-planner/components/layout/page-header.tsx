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
    <header className="border-b border-border bg-muted/30 py-16">
      <div className="container">
        <p className="font-sans text-xs uppercase tracking-widest text-accent">{eyebrow}</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl text-sage-dark sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-xl font-serif text-foreground/80">{description}</p>}
      </div>
    </header>
  );
}
