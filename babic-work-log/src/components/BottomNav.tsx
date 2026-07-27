import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/services/utils'
import { BarChart3, CalendarRange, LayoutGrid, Users } from 'lucide-react'

const ITEMS = [
  { value: 'dashboard', label: 'Übersicht', icon: LayoutGrid },
  { value: 'periods', label: 'Zeiträume', icon: CalendarRange },
  { value: 'clients-projects', label: 'Kunden & Projekte', icon: Users },
  { value: 'stats', label: 'Statistik', icon: BarChart3 },
] as const

export function BottomNav() {
  return (
    <TabsList className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-white/95 backdrop-blur safe-bottom">
      {ITEMS.map(({ value, label, icon: Icon }) => (
        <TabsTrigger
          key={value}
          value={value}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2.5 text-center text-[10px] font-medium leading-tight text-muted-foreground transition-colors',
            'data-[state=active]:text-sage-dark',
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
          {label}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
