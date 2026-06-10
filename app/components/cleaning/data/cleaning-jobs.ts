import { staffMembers } from '~/components/inbox/data/conversations'
import { listings } from '~/components/listings/data/listings'

export type CleaningJobStatus = 'draft' | 'scheduled' | 'confirmed' | 'in_progress' | 'done' | 'cancelled'
export type CleaningJobPriority = 'low' | 'normal' | 'high' | 'urgent'
export type CleaningJobSource = 'manual' | 'checkout'
export type CleaningRecurrenceFrequency = 'weekly' | 'monthly'

export interface CleaningJobRecurrence {
  enabled: boolean
  frequency: CleaningRecurrenceFrequency
  interval: number
}

export interface CleaningJob {
  id: string
  listingId: string
  listingName: string
  scheduledAt: string
  cleanerId: string | null
  cleanerName: string | null
  teamName: string | null
  status: CleaningJobStatus
  priority: CleaningJobPriority
  durationMinutes: number
  notes: string
  source: CleaningJobSource
  reservationId?: string | null
  recurrence?: CleaningJobRecurrence | null
}

export interface CleaningJobInput {
  listingId: string
  listingName: string
  scheduledAt: string
  cleanerId: string | null
  cleanerName: string | null
  teamName: string | null
  status: CleaningJobStatus
  priority: CleaningJobPriority
  durationMinutes: number
  notes: string
  source: CleaningJobSource
  reservationId?: string | null
  recurrence?: CleaningJobRecurrence | null
}

export interface CleaningFilters {
  listingIds: string[]
  cleanerIds: string[]
  statuses: CleaningJobStatus[]
  priorities: CleaningJobPriority[]
}

export const cleaningJobStatusLabels: Record<CleaningJobStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  done: 'Done',
  cancelled: 'Cancelled',
}

export const cleaningJobPriorityLabels: Record<CleaningJobPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const cleaningJobSourceLabels: Record<CleaningJobSource, string> = {
  manual: 'Manual',
  checkout: 'Checkout',
}

export const cleaningJobStatusVariants: Record<CleaningJobStatus, 'outline' | 'default' | 'secondary' | 'destructive'> = {
  draft: 'outline',
  scheduled: 'secondary',
  confirmed: 'default',
  in_progress: 'default',
  done: 'outline',
  cancelled: 'destructive',
}

export const cleaningJobPriorityVariants: Record<CleaningJobPriority, 'outline' | 'secondary' | 'default' | 'destructive'> = {
  low: 'outline',
  normal: 'secondary',
  high: 'default',
  urgent: 'destructive',
}

export const cleanerOptions = staffMembers
  .filter(member => member.id !== 'staff-1')
  .map(member => ({
    id: member.id,
    name: member.name,
    role: member.role,
  }))

export const cleaningJobs = ref<CleaningJob[]>([
  {
    id: 'cln-1',
    listingId: 'lst-1',
    listingName: '5BR Pool the R Villa Luwa – Serene near Canggu',
    scheduledAt: '2026-06-05T11:30:00+08:00',
    cleanerId: 'staff-3',
    cleanerName: 'Made Surya',
    teamName: 'Housekeeping',
    status: 'scheduled',
    priority: 'high',
    durationMinutes: 180,
    notes: 'Checkout cleaning after Sarah Mitchell departure.',
    source: 'checkout',
    reservationId: 'bk-1',
    recurrence: null,
  },
  {
    id: 'cln-2',
    listingId: 'lst-2',
    listingName: 'Apartments Pool',
    scheduledAt: '2026-06-08T09:00:00+08:00',
    cleanerId: 'staff-4',
    cleanerName: 'Wayan Adi',
    teamName: 'Housekeeping',
    status: 'confirmed',
    priority: 'normal',
    durationMinutes: 120,
    notes: 'Manual deep clean before weekend arrivals.',
    source: 'manual',
    reservationId: null,
    recurrence: null,
  },
])

export const cleaningJobStatuses: CleaningJobStatus[] = ['draft', 'scheduled', 'confirmed', 'in_progress', 'done', 'cancelled']

export function getListingName(listingId: string) {
  return listings.value.find(listing => listing.id === listingId)?.name ?? listingId
}

export function getWeekDays(anchorDate = new Date()) {
  const start = new Date(anchorDate)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      date,
    }
  })
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateKey(value: string) {
  return value.slice(0, 10)
}

export function formatWeekRange(days: Array<{ date: Date }>) {
  if (!days.length)
    return ''
  const startDay = days[0]
  const endDay = days[days.length - 1]
  if (!startDay || !endDay)
    return ''
  const start = startDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end = endDay.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${start} - ${end}`
}

export function getListingColorIndex(listingId: string) {
  const sum = listingId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return sum % 5
}

export function getStatusTone(status: CleaningJobStatus) {
  return cleaningJobStatusVariants[status]
}
