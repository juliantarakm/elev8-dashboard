<script setup lang="ts">
import type { Task } from '@/components/tasks/data/schema'
import { toast } from 'vue-sonner'
import { useTaskStore } from '@/composables/useTaskStore'
import { assigneeOptions, statuses, priorities } from '@/components/tasks/data/data'

const props = defineProps<{
  task: Task | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addStatusUpdate, addImage } = useTaskStore()

const progressValue = ref(0)
const progressNote = ref('')
const isUpdatingProgress = ref(false)
const imagePreviewIndex = ref<number | null>(null)
const previewImageUrl = ref<string | null>(null)
const imageInputRef = ref<HTMLInputElement | null>(null)
const newImages = ref<string[]>([])
const previewOpen = computed({
  get: () => imagePreviewIndex.value !== null || previewImageUrl.value !== null,
  set: (val) => {
    if (!val) {
      imagePreviewIndex.value = null
      previewImageUrl.value = null
    }
  },
})

watch(() => props.task, (task) => {
  if (task) {
    progressValue.value = task.progress ?? 0
    progressNote.value = ''
  }
})

function onOpenChange(val: boolean) {
  if (!val) {
    imagePreviewIndex.value = null
    previewImageUrl.value = null
    progressNote.value = ''
  }
  emit('update:open', val)
}

function handleProgressUpdate() {
  if (!props.task)
    return
  const now = new Date().toISOString()
  const notes: string[] = []
  if (progressNote.value.trim())
    notes.push(progressNote.value.trim())

  // Save uploaded images and add timeline entry
  const savedImages: string[] = []
  if (newImages.value.length > 0) {
    newImages.value.forEach((img) => {
      addImage(props.task!.id, img)
      savedImages.push(img)
    })
    notes.push(`Uploaded ${newImages.value.length} image${newImages.value.length > 1 ? 's' : ''}`)
    newImages.value = []
  }

  addStatusUpdate(props.task.id, {
    date: now,
    note: notes.join(' — ') || undefined,
    progress: progressValue.value,
    images: savedImages.length > 0 ? savedImages : undefined,
  })

  progressNote.value = ''
  isUpdatingProgress.value = false
  toast.success(`Progress updated to ${progressValue.value}%`)
}

function handleProgressImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files)
    return
  Array.from(files).forEach((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      newImages.value = [...newImages.value, dataUrl]
    }
    reader.readAsDataURL(file)
  })
  input.value = ''
}

function removeNewImage(index: number) {
  newImages.value = newImages.value.filter((_, i) => i !== index)
}

function getAssigneeLabel(value: string | undefined): string {
  if (!value)
    return 'Unassigned'
  const opt = assigneeOptions.find(a => a.value === value)
  return opt?.label ?? value
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)
    return 'just now'
  if (mins < 60)
    return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24)
    return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30)
    return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <Sheet :open="open" @update:open="onOpenChange">
    <SheetContent class="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl" side="right">
      <template v-if="task">
        <!-- Header -->
        <SheetHeader class="shrink-0 border-b px-6 py-5">
          <SheetTitle class="text-lg leading-tight">
            {{ task.title }}
          </SheetTitle>
        </SheetHeader>

        <!-- Scrollable body -->
        <ScrollArea class="min-h-0 flex-1 overflow-y-auto">
          <div class="flex flex-col gap-6 px-6 py-5">
            <!-- Info grid -->
            <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <p class="text-xs text-muted-foreground">Listing</p>
                <p class="font-medium">{{ task.listing || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Due Date</p>
                <p class="font-medium" :class="task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== 'done' && task.status !== 'canceled' ? 'text-destructive' : ''">
                  {{ task.dueDate ? formatDate(task.dueDate) : '—' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Status</p>
                <p class="font-medium">{{ statuses.find(s => s.value === task.status)?.label || task.status }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Priority</p>
                <p class="font-medium">{{ priorities.find(p => p.value === task.priority)?.label || task.priority }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Assignee</p>
                <p class="font-medium">{{ getAssigneeLabel(task.assignee) }}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Created</p>
                <p class="font-medium">{{ task.createdAt ? formatDate(task.createdAt) : '—' }}</p>
              </div>
            </div>

            <!-- HostBuddy link -->
            <div v-if="task.linkedInventoryItemName" class="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
              <Icon name="lucide:sparkles" class="h-4 w-4 shrink-0 text-[#C8A84B]" />
              <span>Linked to <strong>{{ task.linkedInventoryItemName }}</strong></span>
            </div>

            <!-- Description -->
            <div v-if="task.description">
              <h4 class="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h4>
              <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ task.description }}</p>
            </div>

            <!-- Progress -->
            <div>
              <h4 class="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress</h4>
              <div class="flex items-center gap-3">
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-primary/20">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="progressValue >= 100 ? 'bg-green-500' : progressValue >= 50 ? 'bg-amber-500' : 'bg-primary'"
                    :style="{ width: `${progressValue}%` }"
                  />
                </div>
                <span class="text-sm font-semibold tabular-nums w-10 text-right">{{ progressValue }}%</span>
              </div>
              <div v-if="!isUpdatingProgress" class="mt-2">
                <Button variant="outline" size="sm" class="text-xs" @click="isUpdatingProgress = true">
                  <Icon name="lucide:refresh-cw" class="mr-1.5 h-3 w-3" />
                  Update Progress
                </Button>
              </div>
              <div v-else class="mt-3 space-y-3 rounded-lg border bg-card p-3">
                <div class="flex items-center gap-3">
                  <Slider
                    :model-value="[progressValue]"
                    :min="0"
                    :max="100"
                    :step="5"
                    class="flex-1"
                    @update:model-value="progressValue = $event[0]"
                  />
                  <span class="text-sm font-semibold tabular-nums w-10 text-right">{{ progressValue }}%</span>
                </div>
                <Input v-model="progressNote" placeholder="Add a note (optional)..." class="h-8 text-sm" />
                <div>
                  <div class="flex flex-wrap gap-2">
                    <div v-for="(img, idx) in newImages" :key="idx" class="relative group">
                      <img :src="img" alt="" class="h-12 w-12 rounded-md border object-cover">
                      <button
                        class="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                        @click="removeNewImage(idx)"
                      >
                        <Icon name="lucide:x" class="h-2.5 w-2.5" />
                      </button>
                    </div>
                    <button
                      class="flex h-12 w-12 items-center justify-center rounded-md border border-dashed text-muted-foreground hover:bg-muted/50 transition-colors"
                      @click="imageInputRef?.click()"
                    >
                      <Icon name="lucide:camera" class="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    ref="imageInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    @change="handleProgressImageUpload"
                  >
                </div>
                <div class="flex gap-2">
                  <Button size="sm" @click="handleProgressUpdate">
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" @click="isUpdatingProgress = false; newImages = []">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>

            <!-- Images -->
            <div v-if="task.images && task.images.length">
              <h4 class="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Images</h4>
              <div class="grid grid-cols-3 gap-2">
                <div v-for="(img, idx) in task.images" :key="idx" class="relative group">
                  <img
                    :src="img"
                    alt=""
                    class="h-24 w-full cursor-pointer rounded-lg border object-cover"
                    @click="imagePreviewIndex = idx"
                  >
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div v-if="task.statusUpdates && task.statusUpdates.length">
              <h4 class="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</h4>
              <ol class="relative pl-6 space-y-5">
                <li v-for="(entry, idx) in [...(task.statusUpdates || [])].reverse()" :key="idx" class="relative">
                  <span
                    class="absolute -left-6 top-1 h-3 w-3 rounded-full ring-4 ring-background"
                    :class="entry.progress !== undefined && entry.progress >= 100 ? 'bg-green-500' : 'bg-primary'"
                  />
                  <div v-if="idx !== [...(task.statusUpdates || [])].reverse().length - 1" class="absolute -left-[19px] top-4 h-[calc(100%+1.25rem)] w-0.5 bg-muted-foreground/20" />
                  <p class="text-xs text-muted-foreground">{{ timeAgo(entry.date) }}</p>
                  <p v-if="entry.note" class="mt-0.5 text-sm">{{ entry.note }}</p>
                  <p v-if="entry.progress !== undefined" class="mt-0.5 text-xs text-muted-foreground">
                    Progress: {{ entry.progress }}%
                  </p>
                  <div v-if="entry.images && entry.images.length" class="mt-1.5 flex flex-wrap gap-1.5">
                    <img
                      v-for="(img, imgIdx) in entry.images"
                      :key="imgIdx"
                      :src="img"
                      alt=""
                      class="h-16 w-16 cursor-pointer rounded-md border object-cover hover:opacity-80 transition-opacity"
                      @click="previewImageUrl = img"
                    >
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </ScrollArea>
      </template>

      <div v-else class="flex flex-1 items-center justify-center">
        <p class="text-sm text-muted-foreground">Select a task to view details.</p>
      </div>
    </SheetContent>

    <!-- Image preview dialog -->
    <Dialog v-model:open="previewOpen">
      <DialogContent class="sm:max-w-2xl">
        <img
          v-if="previewImageUrl"
          :src="previewImageUrl"
          alt="Task image"
          class="w-full rounded-lg"
        >
        <img
          v-else-if="imagePreviewIndex !== null && task?.images?.[imagePreviewIndex]"
          :src="task.images[imagePreviewIndex]"
          alt="Task image"
          class="w-full rounded-lg"
        >
        <div v-if="!previewImageUrl && task?.images && task.images.length > 1" class="flex items-center justify-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="imagePreviewIndex === 0"
            @click="imagePreviewIndex = (imagePreviewIndex ?? 0) - 1"
          >
            Previous
          </Button>
          <span class="text-xs text-muted-foreground">
            {{ (imagePreviewIndex ?? 0) + 1 }} / {{ task.images.length }}
          </span>
          <Button
            variant="outline"
            size="sm"
            :disabled="imagePreviewIndex === null || imagePreviewIndex >= (task?.images?.length ?? 1) - 1"
            @click="imagePreviewIndex = (imagePreviewIndex ?? 0) + 1"
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>

  </Sheet>
</template>
