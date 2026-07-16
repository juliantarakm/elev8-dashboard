// app/components/users/data/user-attendance.ts

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day'

export interface UserAttendanceRecord {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  clockIn: string // HH:mm
  clockOut?: string // HH:mm
  status: AttendanceStatus
  totalHours?: number
  notes?: string
}

export const attendanceStatusMeta: Record<AttendanceStatus, { label: string, badgeClass: string }> = {
  present: {
    label: 'Present',
    badgeClass: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  },
  late: {
    label: 'Late',
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  },
  absent: {
    label: 'Absent',
    badgeClass: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  },
  half_day: {
    label: 'Half day',
    badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
}

// Anchor: 2026-07-15 (matches seedUsers). Generate the past 14 days (2026-07-01..2026-07-14)
// so the table fills naturally. Absent on Sundays for everyone.
function dateNDaysAgo(n: number): string {
  const d = new Date('2026-07-15T00:00:00Z')
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

function isSunday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 0
}

// Build attendance for a single user across the past 14 days
function buildAttendance(
  userId: string,
  defaults: { hour: number, minute: number, clockOutHour?: number, clockOutMinute?: number },
  absences: number[] = [], // 1-indexed positions from "today" (1 = 2 days ago, etc.)
  halfDays: number[] = [],
  lates: number[] = [],
): UserAttendanceRecord[] {
  const records: UserAttendanceRecord[] = []
  for (let daysAgo = 14; daysAgo >= 1; daysAgo--) {
    const date = dateNDaysAgo(daysAgo)
    if (isSunday(date)) continue // skip Sundays

    let status: AttendanceStatus = 'present'
    if (absences.includes(daysAgo)) status = 'absent'
    else if (halfDays.includes(daysAgo)) status = 'half_day'
    else if (lates.includes(daysAgo)) status = 'late'

    const clockInHour = status === 'late' ? defaults.hour + 1 : defaults.hour
    const clockInMinute = status === 'late' ? 25 : defaults.minute

    let clockOut: string | undefined
    let totalHours: number | undefined
    if (status !== 'absent') {
      const outHour = status === 'half_day' ? 13 : (defaults.clockOutHour ?? 17)
      const outMinute = status === 'half_day' ? 0 : (defaults.clockOutMinute ?? 0)
      clockOut = `${String(outHour).padStart(2, '0')}:${String(outMinute).padStart(2, '0')}`
      const startMins = clockInHour * 60 + clockInMinute
      const endMins = outHour * 60 + outMinute
      totalHours = Math.max(0, (endMins - startMins) / 60)
    }

    records.push({
      id: `att-${userId}-${date}`,
      userId,
      date,
      clockIn: `${String(clockInHour).padStart(2, '0')}:${String(clockInMinute).padStart(2, '0')}`,
      clockOut,
      status,
      totalHours: status === 'absent' ? undefined : Number(totalHours!.toFixed(2)),
    })
  }
  return records
}

export const seedAttendance: UserAttendanceRecord[] = [
  ...buildAttendance('user-1', { hour: 8, minute: 30, clockOutHour: 17, clockOutMinute: 30 }, [11], [], [4]),
  ...buildAttendance('user-2', { hour: 8, minute: 0, clockOutHour: 17, clockOutMinute: 0 }, [], [6], []),
  ...buildAttendance('user-3', { hour: 8, minute: 15, clockOutHour: 17, clockOutMinute: 15 }, [], [9], []),
  ...buildAttendance('user-4', { hour: 9, minute: 0, clockOutHour: 18, clockOutMinute: 0 }, [12], [], []),
  ...buildAttendance('user-5', { hour: 8, minute: 30, clockOutHour: 18, clockOutMinute: 0 }, [], [], [7]),
  ...buildAttendance('user-6', { hour: 7, minute: 0, clockOutHour: 16, clockOutMinute: 0 }, [], [3, 10], []),
  ...buildAttendance('user-7', { hour: 7, minute: 30, clockOutHour: 16, clockOutMinute: 30 }, [8], [], []),
  ...buildAttendance('user-8', { hour: 8, minute: 0, clockOutHour: 17, clockOutMinute: 0 }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], [], []), // inactive
]