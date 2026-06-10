export type TimelineEventType
  = | 'entry_created'
    | 'condition_changed'
    | 'quantity_changed'
    | 'stock_changed'
    | 'note_updated'
    | 'task_linked'
    | 'task_completed'
    | 'task_canceled'
    | 'status_changed'
    | 'maintenance_completed'

export type TimelineActor = 'hostbuddy' | 'staff'

export interface InventoryTimelineEvent {
  id: string
  entryId?: string
  itemId?: string
  type: TimelineEventType
  actor: TimelineActor
  timestamp: string
  details: {
    from?: string | number
    to?: string | number
    taskId?: string
    taskTitle?: string
    scheduleName?: string
  }
}

export const mockTimelineEvents: InventoryTimelineEvent[] = [
  // entry-001 (Kasur King, Villa Merapi)
  {
    id: 'evt-001-a',
    entryId: 'entry-001',
    type: 'entry_created',
    actor: 'staff',
    timestamp: '2026-05-20T08:00:00.000Z',
    details: {},
  },

  // entry-004 (AC Split, Villa Merapi → damaged via task)
  {
    id: 'evt-004-a',
    entryId: 'entry-004',
    type: 'entry_created',
    actor: 'staff',
    timestamp: '2026-05-15T09:00:00.000Z',
    details: {},
  },
  {
    id: 'evt-004-b',
    entryId: 'entry-004',
    type: 'task_linked',
    actor: 'hostbuddy',
    timestamp: '2026-05-27T10:15:00.000Z',
    details: {
      taskId: 'TASK-INV-001',
      taskTitle: 'AC Split tidak dingin — perlu servis',
      to: 'damaged',
    },
  },

  // entry-005 (Sabun Mandi, Villa Merapi → low stock)
  {
    id: 'evt-005-a',
    entryId: 'entry-005',
    type: 'entry_created',
    actor: 'staff',
    timestamp: '2026-05-22T07:45:00.000Z',
    details: {},
  },
  {
    id: 'evt-005-b',
    entryId: 'entry-005',
    type: 'stock_changed',
    actor: 'staff',
    timestamp: '2026-05-27T08:30:00.000Z',
    details: { from: 8, to: 2 },
  },

  // entry-006 (Shampoo, Villa Merapi → low stock)
  {
    id: 'evt-006-a',
    entryId: 'entry-006',
    type: 'entry_created',
    actor: 'staff',
    timestamp: '2026-05-22T07:45:00.000Z',
    details: {},
  },
  {
    id: 'evt-006-b',
    entryId: 'entry-006',
    type: 'stock_changed',
    actor: 'staff',
    timestamp: '2026-05-28T07:00:00.000Z',
    details: { from: 5, to: 3 },
  },

  // entry-008 (Kasur King, BRATAN)
  {
    id: 'evt-008-a',
    entryId: 'entry-008',
    type: 'entry_created',
    actor: 'staff',
    timestamp: '2026-05-19T11:00:00.000Z',
    details: {},
  },

  // entry-009 (Coffee Maker, BRATAN → damaged)
  {
    id: 'evt-009-a',
    entryId: 'entry-009',
    type: 'entry_created',
    actor: 'staff',
    timestamp: '2026-05-21T14:20:00.000Z',
    details: {},
  },
  {
    id: 'evt-009-b',
    entryId: 'entry-009',
    type: 'condition_changed',
    actor: 'staff',
    timestamp: '2026-05-21T14:25:00.000Z',
    details: { from: 'good', to: 'damaged' },
  },
  {
    id: 'evt-009-c',
    entryId: 'entry-009',
    type: 'task_linked',
    actor: 'hostbuddy',
    timestamp: '2026-05-28T08:00:00.000Z',
    details: {
      taskId: 'TASK-INV-002',
      taskTitle: 'Coffee maker rusak, perlu penggantian',
      to: 'damaged',
    },
  },

  // inv-004 (Coffee Maker catalog item → under_maintenance via HostBuddy)
  {
    id: 'evt-item-004-a',
    itemId: 'inv-004',
    type: 'status_changed',
    actor: 'hostbuddy',
    timestamp: '2026-05-28T08:00:00.000Z',
    details: { from: 'active', to: 'under_maintenance', taskTitle: 'Coffee maker rusak, perlu penggantian' },
  },

  // inv-010 (AC Split catalog item → under_maintenance via HostBuddy)
  {
    id: 'evt-item-010-a',
    itemId: 'inv-010',
    type: 'status_changed',
    actor: 'hostbuddy',
    timestamp: '2026-05-27T10:15:00.000Z',
    details: { from: 'active', to: 'under_maintenance', taskTitle: 'AC Split tidak dingin — perlu servis' },
  },

  // inv-002 (Smart TV → Screen Cleaning completed)
  {
    id: 'evt-item-002-a',
    itemId: 'inv-002',
    type: 'maintenance_completed',
    actor: 'staff',
    timestamp: '2026-03-10T09:00:00.000Z',
    details: { scheduleName: 'Screen Cleaning' },
  },

  // inv-009 (Rice Cooker → Descaling completed — last time, now overdue)
  {
    id: 'evt-item-009-a',
    itemId: 'inv-009',
    type: 'maintenance_completed',
    actor: 'staff',
    timestamp: '2025-11-15T10:00:00.000Z',
    details: { scheduleName: 'Descaling' },
  },
]
