import { useCallback, useEffect, useState } from 'react'

interface TimerState {
  projectId: string
  category: string
  startedAt: number | null
  accumulatedMs: number
  running: boolean
}

const TIMER_KEY = 'babic-work-log:timer'
const IDLE: TimerState = { projectId: '', category: '', startedAt: null, accumulatedMs: 0, running: false }

function loadTimer(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_KEY)
    if (!raw) return IDLE
    return { ...IDLE, ...JSON.parse(raw) }
  } catch {
    return IDLE
  }
}

function saveTimer(state: TimerState): void {
  try {
    localStorage.setItem(TIMER_KEY, JSON.stringify(state))
  } catch (err) {
    console.error('Failed to persist timer state', err)
  }
}

export interface StoppedTimer {
  projectId: string
  category: string
  hours: number
}

/** Persisted start/pause/stop timer, shared (via a single hook call lifted to
 * App) between the Dashboard widget and the EntryForm's Timer tab. */
export function useTimer() {
  const [state, setState] = useState<TimerState>(() => loadTimer())
  const [nowTick, setNowTick] = useState(Date.now())

  useEffect(() => {
    saveTimer(state)
  }, [state])

  useEffect(() => {
    if (!state.running) return
    const interval = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [state.running])

  const elapsedMs = state.accumulatedMs + (state.running && state.startedAt ? nowTick - state.startedAt : 0)

  const start = useCallback((projectId: string, category: string) => {
    setState({ projectId, category, startedAt: Date.now(), accumulatedMs: 0, running: true })
  }, [])

  const pause = useCallback(() => {
    setState((s) =>
      !s.running || !s.startedAt
        ? s
        : { ...s, running: false, accumulatedMs: s.accumulatedMs + (Date.now() - s.startedAt), startedAt: null },
    )
  }, [])

  const resume = useCallback(() => {
    setState((s) => (s.running ? s : { ...s, running: true, startedAt: Date.now() }))
  }, [])

  const stop = useCallback((): StoppedTimer | null => {
    if (!state.projectId) return null
    const finalMs = state.accumulatedMs + (state.running && state.startedAt ? Date.now() - state.startedAt : 0)
    const result: StoppedTimer = {
      projectId: state.projectId,
      category: state.category,
      hours: Math.round((finalMs / 3600000) * 100) / 100,
    }
    setState(IDLE)
    return result
  }, [state])

  const discard = useCallback(() => setState(IDLE), [])

  return { state, elapsedMs, isIdle: state.projectId === '', start, pause, resume, stop, discard }
}

export type UseTimerReturn = ReturnType<typeof useTimer>

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}
