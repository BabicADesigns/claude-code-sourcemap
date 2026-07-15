import { useMemo, type ReactNode } from 'react'
import { entriesThisMonth, summarizeByClient, summarizeByProject, sumAmount } from '@/lib/calculations'
import { formatCurrency, formatHours, formatMonthLabel } from '@/lib/date'
import type { Client, EnrichedEntry, Project } from '@/lib/types'

export function StatsView({
  entries,
  projects,
  clients,
}: {
  entries: EnrichedEntry[]
  projects: Project[]
  clients: Client[]
}) {
  const byProject = useMemo(() => summarizeByProject(entries), [entries])
  const byClient = useMemo(() => summarizeByClient(entries, projects), [entries, projects])

  const monthly = useMemo(() => {
    const months: { label: string; amount: number; isCurrent: boolean }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEntries = entriesThisMonth(entries, ref)
      months.push({ label: formatMonthLabel(ref), amount: sumAmount(monthEntries), isCurrent: i === 0 })
    }
    return months
  }, [entries])

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unbekannt'
  const projectColor = (id: string) => projects.find((p) => p.id === id)?.color ?? '#8B9B7A'
  const clientName = (id: string) => clients.find((c) => c.id === id)?.name ?? 'Unbekannt'

  const maxClientAmount = Math.max(1, ...byClient.map((c) => c.amount))
  const maxProjectAmount = Math.max(1, ...byProject.map((p) => p.amount))
  const maxMonthAmount = Math.max(1, ...monthly.map((m) => m.amount))

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pb-28 pt-6">
      <header>
        <h1 className="font-display text-2xl text-ink">Statistik</h1>
      </header>

      <ChartSection title="Umsatz pro Kunde">
        {byClient.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2.5">
            {byClient.map((row) => (
              <li key={row.clientId}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-ink">{clientName(row.clientId)}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(row.amount)} · {formatHours(row.hours)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-cream-dark">
                  <div
                    className="h-full rounded-full bg-sage"
                    style={{ width: `${Math.max(4, Math.round((row.amount / maxClientAmount) * 100))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartSection>

      <ChartSection title="Umsatz pro Projekt">
        {byProject.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2.5">
            {byProject.map((row) => (
              <li key={row.projectId}>
                <div className="mb-1 flex items-baseline justify-between text-sm">
                  <span className="font-medium text-ink">{projectName(row.projectId)}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(row.amount)} · {formatHours(row.hours)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-cream-dark">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(4, Math.round((row.amount / maxProjectAmount) * 100))}%`,
                      backgroundColor: projectColor(row.projectId),
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </ChartSection>

      <ChartSection title="Monatsvergleich">
        <div className="flex h-40 items-end gap-2">
          {monthly.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${Math.max(3, Math.round((m.amount / maxMonthAmount) * 100))}%`,
                    backgroundColor: m.isCurrent ? '#F0C878' : '#8B9B7A',
                  }}
                  title={formatCurrency(m.amount)}
                />
              </div>
              <span className="text-center text-[10px] leading-tight text-muted-foreground">
                {m.label.split(' ')[0].slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </ChartSection>
    </div>
  )
}

function ChartSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="mb-3 font-display text-lg text-ink">{title}</h2>
      {children}
    </section>
  )
}

function EmptyState() {
  return <p className="py-6 text-center text-sm text-muted-foreground">Noch keine Daten.</p>
}
