import { computed, watch } from 'vue'

/**
 * How often the AI should re-scan for findings across the portfolio.
 * Single global setting — applies to all findings uniformly.
 *
 * - `on_open` (default): scan when the AI panel opens.
 * - `hourly` / `daily` / `weekly`: scan on a fixed cadence from the
 *   last scan timestamp.
 * - `off`: don't surface findings until the user re-enables scanning.
 */
export type FindingCadence = 'on_open' | 'hourly' | 'daily' | 'weekly' | 'off'

export interface FindingCheckState {
  /** Whether the user marked this finding as resolved/handled. */
  checked: boolean
  /** ISO timestamp of when the finding was marked resolved. */
  checkedAt?: string
  /** Linked task id (set when a Task was created from this finding). */
  taskId?: string
}

const STATE_STORAGE_KEY = 'elevai-findings-state'
const CADENCE_STORAGE_KEY = 'elevai-findings-cadence'
const LAST_SCAN_STORAGE_KEY = 'elevai-findings-last-scan'

export const FINDING_CADENCE_LABELS: Record<FindingCadence, string> = {
  on_open: 'On open',
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  off: 'Off',
}

export const FINDING_CADENCE_DESCRIPTIONS: Record<FindingCadence, string> = {
  on_open: 'Scan whenever you open the AI panel.',
  hourly: 'Scan every hour from the last scan.',
  daily: 'Scan once a day from the last scan.',
  weekly: 'Scan once a week from the last scan.',
  off: 'Don\'t scan automatically. Findings are hidden.',
}

/** Re-check interval in ms for each cadence (null = not time-based). */
const CADENCE_INTERVAL_MS: Record<FindingCadence, number | null> = {
  on_open: null,
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  off: null,
}

const DEFAULT_CADENCE: FindingCadence = 'on_open'

/**
 * Hydrate one localStorage-backed useState from storage (client-only).
 * `hydrated` flag prevents clobbering later writes back to the empty
 * server value during hydration.
 */
function hydrateState<T>(hydrated: ReturnType<typeof useState<boolean>>, state: { value: T }, key: string) {
  if (import.meta.client && !hydrated.value) {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw) state.value = JSON.parse(raw) as T
    }
    catch {
      // Corrupted storage — ignore.
    }
    hydrated.value = true
  }
  if (import.meta.client) {
    watch(state, (value) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
      catch {
        // Quota exceeded or disabled — fail silently.
      }
    }, { deep: true })
  }
}

/**
 * Per-finding resolved state. Survives reloads via localStorage.
 */
export function useAssistantFindings() {
  const state = useState<Record<string, FindingCheckState>>('elevai-findings-state', () => ({}))
  const hydrated = useState<boolean>('elevai-findings-hydrated', () => false)

  hydrateState(hydrated, state, STATE_STORAGE_KEY)

  function entry(id: string): FindingCheckState {
    return state.value[id] ?? { checked: false }
  }

  function isChecked(id: string): boolean {
    return Boolean(state.value[id]?.checked)
  }

  function toggle(id: string) {
    const current = entry(id)
    const nextChecked = !current.checked
    state.value = {
      ...state.value,
      [id]: {
        ...current,
        checked: nextChecked,
        checkedAt: nextChecked ? new Date().toISOString() : undefined,
      },
    }
  }

  function setChecked(id: string, checked: boolean) {
    const current = entry(id)
    state.value = {
      ...state.value,
      [id]: {
        ...current,
        checked,
        checkedAt: checked ? (current.checkedAt ?? new Date().toISOString()) : undefined,
      },
    }
  }

  function getTaskId(id: string): string | undefined {
    return state.value[id]?.taskId
  }

  /** Link a freshly-created task to a finding. */
  function linkTaskToFinding(findingId: string, taskId: string) {
    const current = entry(findingId)
    state.value = {
      ...state.value,
      [findingId]: { ...current, taskId },
    }
  }

  function resetAll() {
    state.value = {}
  }

  const checkedCount = computed(() =>
    Object.values(state.value).filter(s => s.checked).length,
  )

  return {
    state,
    isChecked,
    toggle,
    setChecked,
    getTaskId,
    linkTaskToFinding,
    resetAll,
    checkedCount,
  }
}

/**
 * Global AI findings cadence + scan tracking.
 *
 * Single shared value — applies to every finding uniformly. The
 * `lastScanAt` timestamp lets the UI compute "next scan" without
 * scheduling a real background job (v1 displays the value; v2 would
 * actually trigger a scan).
 */
export function useAssistantFindingsCadence() {
  const cadence = useState<FindingCadence>('elevai-findings-cadence', () => DEFAULT_CADENCE)
  const lastScanAt = useState<string | null>('elevai-findings-last-scan', () => null)
  const hydrated = useState<boolean>('elevai-findings-cadence-hydrated', () => false)

  hydrateState<FindingCadence>(hydrated, cadence, CADENCE_STORAGE_KEY)
  // Last scan is hydrated separately (different shape).
  if (import.meta.client && !hydrated.value) {
    try {
      const raw = window.localStorage.getItem(LAST_SCAN_STORAGE_KEY)
      if (raw) lastScanAt.value = JSON.parse(raw) as string | null
    }
    catch {
      // ignore
    }
  }
  if (import.meta.client) {
    watch(lastScanAt, (value) => {
      try {
        window.localStorage.setItem(LAST_SCAN_STORAGE_KEY, JSON.stringify(value))
      }
      catch {
        // ignore
      }
    }, { deep: true })
  }

  function setCadence(next: FindingCadence) {
    cadence.value = next
    // Toggling off then back on resets the schedule clock.
    if (next !== 'off') {
      lastScanAt.value = new Date().toISOString()
    }
  }

  /** Record that a scan just happened (used by "Run scan now"). */
  function markScannedNow() {
    lastScanAt.value = new Date().toISOString()
  }

  /** When the next scan should run, as an ISO string. Null if not time-based. */
  function nextScanAt(): string | null {
    if (cadence.value === 'on_open' || cadence.value === 'off') return null
    const interval = CADENCE_INTERVAL_MS[cadence.value]
    if (!interval) return null
    const last = lastScanAt.value ? new Date(lastScanAt.value) : new Date()
    return new Date(last.getTime() + interval).toISOString()
  }

  return {
    cadence,
    lastScanAt,
    setCadence,
    markScannedNow,
    nextScanAt,
  }
}
