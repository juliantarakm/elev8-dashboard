// app/composables/useUserActivities.ts
import type { UserActivity } from '~/components/users/data/user-activities'
import { seedActivities } from '~/components/users/data/user-activities'

const STORAGE_KEY = 'elev8-tenant-user-activities'

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function loadFromStorage(): UserActivity[] | null {
  if (!hasStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserActivity[]
  }
  catch {
    return null
  }
}

function saveToStorage(activities: UserActivity[]): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
  }
  catch {
    // ignore quota errors
  }
}

export function useUserActivities() {
  const activities = useState<UserActivity[]>('user-activities', () => {
    const stored = loadFromStorage()
    return stored ?? JSON.parse(JSON.stringify(seedActivities))
  })

  function getActivitiesForUser(userId: string): UserActivity[] {
    return activities.value
      .filter(a => a.userId === userId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }

  function recentActivitiesForUser(userId: string, limit = 5): UserActivity[] {
    return getActivitiesForUser(userId).slice(0, limit)
  }

  function lastActivityForUser(userId: string): UserActivity | undefined {
    return getActivitiesForUser(userId)[0]
  }

  function activityCountByUser(userId: string, withinDays = 30): number {
    const cutoff = new Date('2026-07-15T00:00:00Z')
    cutoff.setUTCDate(cutoff.getUTCDate() - withinDays)
    const cutoffIso = cutoff.toISOString()
    return activities.value.filter(a => a.userId === userId && a.timestamp >= cutoffIso).length
  }

  return {
    activities,
    getActivitiesForUser,
    recentActivitiesForUser,
    lastActivityForUser,
    activityCountByUser,
  }
}