import type { Task } from '@/components/tasks/data/schema'
import { ref } from 'vue'

export const selectedTaskRef = ref<Task | null>(null)

export function useTaskDetail() {
  function openTaskDetail(task: Task) {
    selectedTaskRef.value = task
  }

  function closeTaskDetail() {
    selectedTaskRef.value = null
  }

  return {
    selectedTask: selectedTaskRef,
    openTaskDetail,
    closeTaskDetail,
  }
}
