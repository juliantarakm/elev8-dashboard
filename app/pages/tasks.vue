<script setup lang="ts">
import { toast } from 'vue-sonner'
import { columns } from '@/components/tasks/components/columns'
import DataTable from '@/components/tasks/components/DataTable.vue'
import { useTaskStore } from '@/composables/useTaskStore'
import { useHostBuddyInventorySync } from '@/composables/useHostBuddyInventorySync'
import { BALI_LISTINGS } from '@/components/upsells/data/upsell-services'
import { labels, priorities } from '@/components/tasks/data/data'
import CleaningCalendarBoard from '~/components/cleaning/CleaningCalendarBoard.vue'
import CleaningFilters from '~/components/cleaning/CleaningFilters.vue'
import CleaningJobForm from '~/components/cleaning/CleaningJobForm.vue'
import { useCleaningJobs } from '~/composables/useCleaningJobs'
import type { CleaningJobPriority, CleaningJobStatus } from '~/components/cleaning/data/cleaning-jobs'

const { tasks, addTask } = useTaskStore()
const { detectInventoryItem } = useHostBuddyInventorySync()
const { jobs, jobsForFilters, createJob, updateJob, resolveCleanerName, resolveListingName } = useCleaningJobs()

const view = ref<'tasks' | 'week' | 'agenda'>('week')
const newTaskOpen = ref(false)
const newTitle = ref('')
const newListing = ref('')
const newPriority = ref('medium')
const newLabel = ref('maintenance')
const newDescription = ref('')
const isDetecting = ref(false)
const cleaningCreateOpen = ref(false)
const cleaningEditOpen = ref(false)
const editingCleaningId = ref<string | null>(null)
const weekAnchor = ref(new Date())
const selectedListingIds = ref<string[]>([])
const selectedCleanerIds = ref<string[]>([])
const selectedStatuses = ref<CleaningJobStatus[]>([])
const selectedPriorities = ref<CleaningJobPriority[]>([])

const detected = computed(() => {
  if (!newTitle.value.trim() || !newListing.value) return null
  return detectInventoryItem(newTitle.value, newListing.value)
})

const filteredCleaningJobs = computed(() => jobsForFilters({
  listingIds: selectedListingIds.value,
  cleanerIds: selectedCleanerIds.value,
  statuses: selectedStatuses.value,
  priorities: selectedPriorities.value,
}))

const editingCleaningJob = computed(() => jobs.value.find(job => job.id === editingCleaningId.value) ?? null)

watch([() => newTitle.value, () => newListing.value], () => {
  isDetecting.value = true
  setTimeout(() => { isDetecting.value = false }, 400)
})

function resetForm() {
  newTitle.value = ''
  newListing.value = ''
  newPriority.value = 'medium'
  newLabel.value = 'maintenance'
  newDescription.value = ''
}

function handleCreateTask() {
  if (!newTitle.value.trim()) return
  const detection = detected.value
  addTask({
    title: newTitle.value.trim(),
    status: 'todo',
    label: newLabel.value,
    priority: newPriority.value,
    listing: newListing.value || undefined,
    description: newDescription.value.trim() || undefined,
    linkedInventoryItemId: detection?.itemId,
    linkedInventoryItemName: detection?.itemName,
    linkedInventoryEntryId: detection?.entryId,
    conditionBefore: detection ? 'good' : undefined,
    detectedByHostBuddy: detection ? true : undefined,
  })
  toast.success(detection ? `Task created — HostBuddy linked ${detection.itemName}` : 'Task created')
  newTaskOpen.value = false
  resetForm()
}

function handleCreateCleaning(input: Parameters<typeof createJob>[0]) {
  createJob({
    ...input,
    cleanerName: input.cleanerId ? resolveCleanerName(input.cleanerId) : null,
    listingName: input.listingId ? resolveListingName(input.listingId) : input.listingName,
  })
  cleaningCreateOpen.value = false
  toast.success('Cleaning job created')
}

function handleUpdateCleaning(input: Parameters<typeof createJob>[0]) {
  if (!editingCleaningJob.value) return
  updateJob(editingCleaningJob.value.id, {
    ...input,
    cleanerName: input.cleanerId ? resolveCleanerName(input.cleanerId) : null,
    listingName: input.listingId ? resolveListingName(input.listingId) : input.listingName,
  })
  cleaningEditOpen.value = false
  editingCleaningId.value = null
  toast.success('Cleaning job updated')
}

function openCleaningEdit(id: string) {
  editingCleaningId.value = id
  cleaningEditOpen.value = true
}

function handleMoveCleaning(payload: { id: string, listingId: string, scheduledAt: string }) {
  const job = jobs.value.find(item => item.id === payload.id)
  if (!job) return
  updateJob(job.id, {
    listingId: payload.listingId,
    listingName: resolveListingName(payload.listingId),
    scheduledAt: payload.scheduledAt,
  })
  toast.success('Cleaning job moved')
}

function clearCleaningFilters() {
  selectedListingIds.value = []
  selectedCleanerIds.value = []
  selectedStatuses.value = []
  selectedPriorities.value = []
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Tasks & Cleaning</h2>
        <p class="text-muted-foreground">Operational tasks plus a multi-listing cleaning scheduler.</p>
      </div>
      <div class="flex items-center gap-2">
        <Tabs v-model="view">
          <TabsList>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" @click="view === 'tasks' ? newTaskOpen = true : cleaningCreateOpen = true">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          {{ view === 'tasks' ? 'New Task' : 'New Cleaning' }}
        </Button>
      </div>
    </div>

    <div v-if="view === 'tasks'" class="grid gap-4">
      <DataTable :data="tasks" :columns="columns" />
    </div>

    <div v-else class="grid gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div>
          <h3 class="text-sm font-semibold">Cleaning Calendar</h3>
          <p class="text-xs text-muted-foreground">Guesty-style multi-listing scheduler with drag and drop.</p>
        </div>
        <CleaningFilters
          :listing-ids="selectedListingIds"
          :cleaner-ids="selectedCleanerIds"
          :statuses="selectedStatuses"
          :priorities="selectedPriorities"
          @update:listing-ids="selectedListingIds = $event"
          @update:cleaner-ids="selectedCleanerIds = $event"
          @update:statuses="selectedStatuses = $event"
          @update:priorities="selectedPriorities = $event"
          @clear="clearCleaningFilters"
        />
      </div>

      <CleaningCalendarBoard
        :jobs="filteredCleaningJobs"
        :week-anchor="weekAnchor"
        :mode="view === 'agenda' ? 'agenda' : 'week'"
        @edit="openCleaningEdit"
        @create="cleaningCreateOpen = true"
        @move="handleMoveCleaning"
      />
    </div>

    <Dialog v-model:open="newTaskOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>HostBuddy will automatically detect and link inventory items from your description.</DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>Title <span class="text-destructive">*</span></Label>
            <Input v-model="newTitle" placeholder="e.g. AC Split tidak dingin di Villa Merapi" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Listing</Label>
            <Select v-model="newListing">
              <SelectTrigger><SelectValue placeholder="Select a listing" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="listing in BALI_LISTINGS" :key="listing" :value="listing">{{ listing }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="newTitle.trim() && newListing" class="rounded-md border px-3 py-2.5 flex items-start gap-2.5" :class="detected ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : 'border-border bg-muted/40'">
            <Icon :name="isDetecting ? 'lucide:loader-circle' : detected ? 'lucide:sparkles' : 'lucide:search'" class="h-4 w-4 mt-0.5 shrink-0" :class="[isDetecting ? 'animate-spin text-muted-foreground' : '', detected && !isDetecting ? 'text-[#C8A84B]' : '', !detected && !isDetecting ? 'text-muted-foreground' : '']" />
            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold" :class="detected ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'">HostBuddy AI</p>
              <p class="text-xs" :class="detected ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'">
                <template v-if="isDetecting">Scanning for inventory items…</template>
                <template v-else-if="detected">Detected: <strong>{{ detected.itemName }}</strong> — condition will update to <strong>Damaged</strong></template>
                <template v-else>No matching inventory item found for this listing.</template>
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>Label</Label>
              <Select v-model="newLabel">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="l in labels" :key="l.value" :value="l.value">{{ l.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select v-model="newPriority">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="p in priorities" :key="p.value" :value="p.value">{{ p.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea v-model="newDescription" placeholder="Additional details…" rows="3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="newTaskOpen = false; resetForm()">Cancel</Button>
          <Button :disabled="!newTitle.trim()" @click="handleCreateTask">Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="cleaningCreateOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Cleaning Job</DialogTitle>
          <DialogDescription>Create a manual cleaning job.</DialogDescription>
        </DialogHeader>
        <CleaningJobForm @cancel="cleaningCreateOpen = false" @save="handleCreateCleaning" />
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="cleaningEditOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Cleaning Job</DialogTitle>
          <DialogDescription>Update schedule, assignment, and priority.</DialogDescription>
        </DialogHeader>
        <CleaningJobForm v-if="editingCleaningJob" :model-value="editingCleaningJob" @cancel="cleaningEditOpen = false; editingCleaningId = null" @save="handleUpdateCleaning" />
      </DialogContent>
    </Dialog>
  </div>
</template>
