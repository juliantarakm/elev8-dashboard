export type SyncType = 'Cost' | 'Revenue'
export type SyncStatus = 'Success' | 'Failed' | 'Partial'

export interface SyncLog {
  id: string
  date: string
  type: SyncType
  entriesTotal: number
  entriesSuccess: number
  status: SyncStatus
  jurnalReference?: string
  errorMessage?: string
  pushedBy: string
}

export const mockSyncLogs: SyncLog[] = [
  {
    id: 'sync-1',
    date: '2026-05-07T14:22:00Z',
    type: 'Cost',
    entriesTotal: 4,
    entriesSuccess: 4,
    status: 'Success',
    jurnalReference: 'JRN-2026-0501',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-2',
    date: '2026-05-07T14:20:00Z',
    type: 'Revenue',
    entriesTotal: 12,
    entriesSuccess: 12,
    status: 'Success',
    jurnalReference: 'JRN-2026-0502',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-3',
    date: '2026-04-30T09:10:00Z',
    type: 'Cost',
    entriesTotal: 6,
    entriesSuccess: 5,
    status: 'Partial',
    jurnalReference: 'JRN-2026-0489',
    errorMessage: '1 entry failed: account code not found in Jurnal chart of accounts.',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-4',
    date: '2026-04-30T09:05:00Z',
    type: 'Revenue',
    entriesTotal: 16,
    entriesSuccess: 16,
    status: 'Success',
    jurnalReference: 'JRN-2026-0488',
    pushedBy: 'Komang Juliantara',
  },
  {
    id: 'sync-5',
    date: '2026-04-15T11:45:00Z',
    type: 'Cost',
    entriesTotal: 3,
    entriesSuccess: 0,
    status: 'Failed',
    errorMessage: 'Authentication failed. API key may have expired.',
    pushedBy: 'Komang Juliantara',
  },
]
