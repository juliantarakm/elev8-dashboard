import { computed } from 'vue'
import { latestChangelogEntry } from '~/components/changelog/data/changelog'

const STORAGE_KEY = 'elev8-changelog-last-seen-version'

function loadLastSeen(): string | null {
  if (!import.meta.client) return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  }
  catch {
    return null
  }
}

function saveLastSeen(version: string) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(STORAGE_KEY, version)
  }
  catch {
    // ignore quota / privacy mode errors
  }
}

export function useChangelog() {
  // Reactive cache of the last-seen version so the popup reacts if it's marked
  // as seen elsewhere in the session.
  const lastSeenVersion = useState<string | null>('changelog-last-seen-version', () => loadLastSeen())

  const latestVersion = computed(() => latestChangelogEntry.version)

  const hasNewVersion = computed(() => {
    if (!latestVersion.value) return false
    return lastSeenVersion.value !== latestVersion.value
  })

  function markAsSeen(version?: string) {
    const target = version ?? latestVersion.value
    if (!target) return
    lastSeenVersion.value = target
    saveLastSeen(target)
  }

  return {
    lastSeenVersion,
    latestVersion,
    hasNewVersion,
    markAsSeen,
  }
}