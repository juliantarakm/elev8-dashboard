// app/composables/useUserAttendance.ts
import type { UserAttendanceRecord } from '~/components/users/data/user-attendance'
import { seedAttendance } from '~/components/users/data/user-attendance'

const STORAGE_KEY = 'elev8-tenant-user-attendance'

function hasStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function loadFromStorage(): UserAttendanceRecord[] | null {
  if (!hasStorage()) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserAttendanceRecord[]
  }
  catch {
    return null
  }
}

function saveToStorage(records: UserAttendanceRecord[]): void {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  }
  catch {
    // ignore quota errors
  }
}

export interface AttendanceSummary {
  present: number
  late: number
  absent: number
  halfDay: number
  total: number
  attendancePct: number
  totalHours: number
}

export function useUserAttendance() {
  const attendance = useState<UserAttendanceRecord[]>('user-attendance', () => {
    const stored = loadFromStorage()
    return stored ?? JSON.parse(JSON.stringify(seedAttendance))
  })

  function getAttendanceForUser(userId: string): UserAttendanceRecord[] {
    return attendance.value
      .filter(r => r.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
  }

  // Summary across all attendance records for a user (no date filter — matches the data scope of 14 days)
  function attendanceSummaryForUser(userId: string): AttendanceSummary {
    const records = getAttendanceForUser(userId)
    const present = records.filter(r => r.status === 'present').length
    const late = records.filter(r => r.status === 'late').length
    const absent = records.filter(r => r.status === 'absent').length
    const halfDay = records.filter(r => r.status === 'half_day').length
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours ?? 0), 0)
    // Attendance % = (present + late + half_day) / total. Absent drags down.
    const attended = present + late + halfDay
    const total = records.length
    const attendancePct = total === 0 ? 0 : Math.round((attended / total) * 100)
    return { present, late, absent, halfDay, total, attendancePct, totalHours }
  }

  return {
    attendance,
    getAttendanceForUser,
    attendanceSummaryForUser,
  }
}