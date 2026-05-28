import type { Task } from '@/components/tasks/data/schema'
import type { ItemCondition } from '@/components/inventory/data/listing-entries'
import { useInventoryCatalog } from './useInventoryCatalog'
import { useInventoryListings } from './useInventoryListings'
import { useInventoryTimeline } from './useInventoryTimeline'

export function useHostBuddyInventorySync() {
  const { items } = useInventoryCatalog()
  const { entries, updateEntry } = useInventoryListings()
  const { addEvent } = useInventoryTimeline()

  function detectInventoryItem(title: string, listing: string): {
    itemId: string
    itemName: string
    entryId: string
  } | null {
    if (!title.trim() || !listing) return null
    const normalizedTitle = title.toLowerCase()

    for (const item of items.value) {
      const nameLower = item.name.toLowerCase()
      const words = nameLower.split(' ').filter(w => w.length > 2)
      const directMatch = normalizedTitle.includes(nameLower)
      const wordMatch
        = words.length >= 2
        && words.filter(w => normalizedTitle.includes(w)).length >= Math.min(2, words.length)

      if (directMatch || wordMatch) {
        const entry = entries.value.find(e => e.itemId === item.id && e.listingName === listing)
        if (entry) return { itemId: item.id, itemName: item.name, entryId: entry.id }
      }
    }
    return null
  }

  function syncOnCreate(task: Task) {
    if (!task.linkedInventoryEntryId) return
    updateEntry(task.linkedInventoryEntryId, { condition: 'damaged' }, 'hostbuddy')
    addEvent({
      entryId: task.linkedInventoryEntryId,
      type: 'task_linked',
      actor: 'hostbuddy',
      details: { taskId: task.id, taskTitle: task.title, to: 'damaged' },
    })
  }

  function syncOnStatusChange(task: Task, newStatus: string) {
    if (!task.linkedInventoryEntryId) return
    if (newStatus === 'done') {
      updateEntry(task.linkedInventoryEntryId, { condition: 'good' }, 'hostbuddy')
      addEvent({
        entryId: task.linkedInventoryEntryId,
        type: 'task_completed',
        actor: 'hostbuddy',
        details: { taskId: task.id, taskTitle: task.title, to: 'good' },
      })
    }
    else if (newStatus === 'canceled') {
      const before = (task.conditionBefore as ItemCondition | undefined) ?? 'good'
      updateEntry(task.linkedInventoryEntryId, { condition: before }, 'hostbuddy')
      addEvent({
        entryId: task.linkedInventoryEntryId,
        type: 'task_canceled',
        actor: 'hostbuddy',
        details: { taskId: task.id, taskTitle: task.title, to: before },
      })
    }
  }

  function syncOnDelete(task: Task) {
    if (!task.linkedInventoryEntryId) return
    const before = (task.conditionBefore as ItemCondition | undefined) ?? 'good'
    updateEntry(task.linkedInventoryEntryId, { condition: before }, 'hostbuddy')
    addEvent({
      entryId: task.linkedInventoryEntryId,
      type: 'task_canceled',
      actor: 'hostbuddy',
      details: { taskId: task.id, taskTitle: task.title, to: before },
    })
  }

  return { detectInventoryItem, syncOnCreate, syncOnStatusChange, syncOnDelete }
}
