import type { Task } from '@/components/tasks/data/schema'
import { mockTasks } from '@/components/tasks/data/tasks-mock'
import { useHostBuddyInventorySync } from './useHostBuddyInventorySync'

export function useTaskStore() {
  const tasks = useState<Task[]>('tasks', () => mockTasks.map(t => ({ ...t })))
  const { syncOnCreate, syncOnStatusChange, syncOnDelete } = useHostBuddyInventorySync()

  function addTask(data: Omit<Task, 'id'>): Task {
    const id = `TASK-${Math.floor(1000 + Math.random() * 9000)}`
    const task: Task = { ...data, id }
    tasks.value = [...tasks.value, task]
    syncOnCreate(task)
    return task
  }

  function updateStatus(id: string, status: string) {
    const task = tasks.value.find(t => t.id === id)
    if (!task)
      return
    tasks.value = tasks.value.map(t => t.id === id ? { ...t, status } : t)
    syncOnStatusChange(task, status)
  }

  function deleteTask(id: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task)
      syncOnDelete(task)
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  return { tasks, addTask, updateStatus, deleteTask }
}
