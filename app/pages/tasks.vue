<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { columns } from '@/components/tasks/components/columns'
import DataTable from '@/components/tasks/components/DataTable.vue'
import { useTaskStore } from '@/composables/useTaskStore'
import { useHostBuddyInventorySync } from '@/composables/useHostBuddyInventorySync'
import { BALI_LISTINGS } from '@/components/upsells/data/upsell-services'
import { labels, priorities } from '@/components/tasks/data/data'

const { tasks, addTask } = useTaskStore()
const { detectInventoryItem } = useHostBuddyInventorySync()

const newTaskOpen = ref(false)
const newTitle = ref('')
const newListing = ref('')
const newPriority = ref('medium')
const newLabel = ref('maintenance')
const newDescription = ref('')
const isDetecting = ref(false)

const detected = computed(() => {
  if (!newTitle.value.trim() || !newListing.value) return null
  return detectInventoryItem(newTitle.value, newListing.value)
})

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

  const msg = detection
    ? `Task created — HostBuddy linked ${detection.itemName} and updated condition to Damaged`
    : 'Task created'
  toast.success(msg)

  newTaskOpen.value = false
  resetForm()
}
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Tasks
        </h2>
        <p class="text-muted-foreground">
          Maintenance, replacements, and inspections across your listings.
        </p>
      </div>
      <Button @click="newTaskOpen = true">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        New Task
      </Button>
    </div>

    <DataTable :data="tasks" :columns="columns" />

    <!-- New Task Dialog -->
    <Dialog v-model:open="newTaskOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            HostBuddy will automatically detect and link inventory items from your description.
          </DialogDescription>
        </DialogHeader>

        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>Title <span class="text-destructive">*</span></Label>
            <Input v-model="newTitle" placeholder="e.g. AC Split tidak dingin di Villa Merapi" />
          </div>

          <div class="flex flex-col gap-1.5">
            <Label>Listing</Label>
            <Select v-model="newListing">
              <SelectTrigger>
                <SelectValue placeholder="Select a listing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="listing in BALI_LISTINGS" :key="listing" :value="listing">
                  {{ listing }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- HostBuddy detection banner -->
          <div
            v-if="newTitle.trim() && newListing"
            class="rounded-md border px-3 py-2.5 flex items-start gap-2.5"
            :class="detected ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/20' : 'border-border bg-muted/40'"
          >
            <Icon
              :name="isDetecting ? 'lucide:loader-circle' : detected ? 'lucide:sparkles' : 'lucide:search'"
              class="h-4 w-4 mt-0.5 shrink-0"
              :class="[
                isDetecting ? 'animate-spin text-muted-foreground' : '',
                detected && !isDetecting ? 'text-[#C8A84B]' : '',
                !detected && !isDetecting ? 'text-muted-foreground' : '',
              ]"
            />
            <div class="flex flex-col gap-0.5">
              <p class="text-xs font-semibold" :class="detected ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'">
                HostBuddy AI
              </p>
              <p class="text-xs" :class="detected ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'">
                <template v-if="isDetecting">
                  Scanning for inventory items…
                </template>
                <template v-else-if="detected">
                  Detected: <strong>{{ detected.itemName }}</strong> — condition will update to <strong>Damaged</strong>
                </template>
                <template v-else>
                  No matching inventory item found for this listing.
                </template>
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <Label>Label</Label>
              <Select v-model="newLabel">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="l in labels" :key="l.value" :value="l.value">
                    {{ l.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>Priority</Label>
              <Select v-model="newPriority">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
            <Textarea v-model="newDescription" placeholder="Additional details…" rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="newTaskOpen = false; resetForm()">
            Cancel
          </Button>
          <Button :disabled="!newTitle.trim()" @click="handleCreateTask">
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
