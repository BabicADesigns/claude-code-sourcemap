import { useState } from 'react'
import { Pause, Play, Square, Timer as TimerIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatElapsed, type UseTimerReturn } from '@/hooks/useTimer'
import { CATEGORIES } from '@/lib/types'
import type { Project } from '@/lib/types'

export function TimerCard({
  timer,
  projects,
  onStopped,
}: {
  timer: UseTimerReturn
  projects: Project[]
  onStopped: (result: { projectId: string; category: string; hours: number }) => void
}) {
  const activeProjects = projects.filter((p) => !p.archived)
  const [projectId, setProjectId] = useState(activeProjects[0]?.id ?? '')
  const [category, setCategory] = useState<string>(CATEGORIES[0])

  const activeProject = projects.find((p) => p.id === timer.state.projectId)

  function handleStop() {
    const result = timer.stop()
    if (result) onStopped(result)
  }

  if (timer.isIdle) {
    return (
      <div className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <TimerIcon className="h-4 w-4" />
          Timer
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Projekt" />
            </SelectTrigger>
            <SelectContent>
              {activeProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="mt-3 w-full"
          variant="gold"
          disabled={!projectId}
          onClick={() => timer.start(projectId, category)}
        >
          <Play className="h-4 w-4" />
          Timer starten
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <TimerIcon className="h-4 w-4" />
        {activeProject?.name ?? 'Timer'} · {timer.state.category}
      </div>
      <p className="mb-3 font-display text-3xl tabular-nums text-ink">{formatElapsed(timer.elapsedMs)}</p>
      <div className="flex gap-2">
        {timer.state.running ? (
          <Button variant="secondary" className="flex-1" onClick={timer.pause}>
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button variant="secondary" className="flex-1" onClick={timer.resume}>
            <Play className="h-4 w-4" />
            Weiter
          </Button>
        )}
        <Button variant="gold" className="flex-1" onClick={handleStop}>
          <Square className="h-4 w-4" />
          Stop
        </Button>
      </div>
    </div>
  )
}
