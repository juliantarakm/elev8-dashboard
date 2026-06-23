<script setup lang="ts">
import type { CleaningJobInput } from '~/components/cleaning/data/cleaning-jobs'
import { toast } from 'vue-sonner'
import { useTaskStore } from '@/composables/useTaskStore'
import { useCleaningJobs } from '~/composables/useCleaningJobs'

const props = defineProps<{
  open: boolean
  listingId?: string
  dayKey?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addTask } = useTaskStore()
const { createJob, resolveCleanerName, resolveListingName } = useCleaningJobs()

const activeTab = ref<'cleaning' | 'task'>('cleaning')

const taskTitle = ref('')
const taskLabel = ref('maintenance')
const taskPriority = ref('medium')
const taskDescription = ref('')
const taskDueDate = ref(props.dayKey)

watch(() => props.dayKey, (key) => {
  taskDueDate.value = key
})

const labels = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'replacement', label: 'Replacement' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'cleaning', label: 'Cleaning' },
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

function resetTaskForm() {
  taskTitle.value = ''
  taskLabel.value = 'maintenance'
  taskPriority.value = 'medium'
  taskDescription.value = ''
  taskDueDate.value = props.dayKey
}

function close() {
  emit('update:open', false)
  resetTaskForm()
}

function toBaliDateTime(localValue: string) {
  if (localValue.includes('+') || localValue.endsWith('Z'))
    return localValue
  if (localValue.length === 16)
    return `${localValue}:00+08:00`
  if (localValue.length === 19)
    return `${localValue}+08:00`
  return localValue
}

function handleCleaningSave(input: CleaningJobInput) {
  createJob({
    ...input,
    scheduledAt: toBaliDateTime(input.scheduledAt),
    cleanerName: input.cleanerId ? resolveCleanerName(input.cleanerId) : null,
    listingName: input.listingId ? resolveListingName(input.listingId) : input.listingName,
  })
  toast.success('Cleaning job created')
  close()
}

function handleCreateTask() {
  if (!taskTitle.value.trim())
    return
  addTask({
    title: taskTitle.value.trim(),
    status: 'todo',
    label: taskLabel.value,
    priority: taskPriority.value,
    listing: props.listingId ? resolveListingName(props.listingId) : undefined,
    description: taskDescription.value.trim() || undefined,
    dueDate: taskDueDate.value,
  })
  toast.success('Task created')
  close()
}
</script>

<template>
  <Dialog :open="open" @update:open="$event ? emit('update:open', true) : close()">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Create operation</DialogTitle>
        <DialogDescription>
          Add a new cleaning job or task for {{ listingId ? resolveListingName(listingId) : 'selected listing' }} on {{ dayKey }}.
        </DialogDescription>
      </DialogHeader>

      <Tabs v-model="activeTab" class="mt-2">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="cleaning">
            Cleaning
          </TabsTrigger>
          <TabsTrigger value="task">
            Task
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cleaning" class="mt-4">
          <CleaningJobForm
            mode="create"
            :default-listing-id="listingId"
            :default-scheduled-at="dayKey ? `${dayKey}T11:00` : undefined"
            @cancel="close"
            @save="handleCleaningSave"
          />
        </TabsContent>

        <TabsContent value="task" class="mt-4">
          <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <Label>Title <span class="text-destructive">*</span></Label>
              <Input v-model="taskTitle" placeholder="e.g. Check AC filter" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="flex flex-col gap-1.5">
                <Label>Due date</Label>
                <Input v-model="taskDueDate" type="date" />
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>Label</Label>
                <Select v-model="taskLabel">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="l in labels" :key="l.value" :value="l.value">
                      {{ l.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <Select v-model="taskPriority">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="p in priorities" :key="p.value" :value="p.value">
                      {{ p.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Textarea v-model="taskDescription" placeholder="Additional details…" rows="3" />
            </div>
            <DialogFooter>
              <Button variant="outline" @click="close">
                Cancel
              </Button>
              <Button :disabled="!taskTitle.trim()" @click="handleCreateTask">
                Create Task
              </Button>
            </DialogFooter>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
