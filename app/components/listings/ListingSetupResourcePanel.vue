<script setup lang="ts">
import type { Listing, ListingDocument } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()

const fileInputEl = ref<HTMLInputElement | null>(null)
const MAX_DOCS = 20
const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

function uploadDocs(files: FileList | null) {
  if (!files)
    return
  const remaining = MAX_DOCS - props.listing.resources.documents.length
  Array.from(files).slice(0, remaining).forEach((file) => {
    if (!ALLOWED.includes(file.type) || file.size > MAX_SIZE)
      return
    const reader = new FileReader()
    reader.onload = (e) => {
      const doc: ListingDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        url: e.target?.result as string,
        size: file.size,
        uploadedAt: new Date().toISOString().split('T')[0]!,
      }
      emit('update', { ...props.listing, resources: { ...props.listing.resources, documents: [...props.listing.resources.documents, doc] } })
    }
    reader.readAsDataURL(file)
  })
}

function deleteDoc(id: string) {
  emit('update', { ...props.listing, resources: { ...props.listing.resources, documents: props.listing.resources.documents.filter(d => d.id !== id) } })
}

function downloadDoc(doc: ListingDocument) {
  if (!doc.url)
    return
  const a = document.createElement('a')
  a.href = doc.url
  a.download = doc.name
  a.click()
}

function formatSize(bytes: number) {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isAutoFilling = ref(false)

async function autoFill() {
  isAutoFilling.value = true
  await new Promise(r => setTimeout(r, 1500))
  const filled = {
    ...props.listing.resources.basics,
    description: props.listing.resources.basics.description || `${props.listing.name} is a beautiful ${props.listing.room} in ${props.listing.location}, accommodating up to ${props.listing.capacity} guests.`,
    checkInTime: props.listing.resources.basics.checkInTime || '14:00',
    checkOutTime: props.listing.resources.basics.checkOutTime || '11:00',
  }
  emit('update', { ...props.listing, resources: { ...props.listing.resources, basics: filled } })
  isAutoFilling.value = false
  toast.success('Property details auto-filled from resources')
}

const showCopyDialog = ref(false)
const copySearch = ref('')
const otherListings = computed(() => listings.value.filter(l => l.id !== props.listing.id))
const filteredCopyListings = computed(() => {
  if (!copySearch.value)
    return otherListings.value
  return otherListings.value.filter(l => l.name.toLowerCase().includes(copySearch.value.toLowerCase()))
})

function copyFromProperty(sourceId: string) {
  const source = listings.value.find(l => l.id === sourceId)
  if (!source)
    return
  emit('update', { ...props.listing, resources: JSON.parse(JSON.stringify(source.resources)) })
  toast.success('Resources copied from property')
  showCopyDialog.value = false
  copySearch.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-4 border-b flex-shrink-0 flex items-center" style="height: calc(36px + 1.5rem)">
      <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resources</span>
    </div>

    <ScrollArea class="flex-1">
      <div class="flex flex-col gap-4 p-4">
        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">
            Property Documents
          </div>
          <p class="text-xs text-muted-foreground">
            All documents are used automatically by Elev8 AI
          </p>

          <div v-for="doc in listing.resources.documents" :key="doc.id" class="flex items-center gap-2 rounded-lg border p-2.5">
            <Icon name="lucide:file-text" class="size-4 text-amber-500 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium truncate">
                {{ doc.name }}
              </p>
              <p class="text-[10px] text-muted-foreground">
                {{ formatSize(doc.size) }}
              </p>
            </div>
            <Button variant="ghost" size="icon" class="size-7 shrink-0" @click="downloadDoc(doc)">
              <Icon name="lucide:download" class="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" class="size-7 shrink-0 hover:text-destructive" @click="deleteDoc(doc.id)">
              <Icon name="lucide:x" class="size-3.5" />
            </Button>
          </div>

          <Button variant="outline" size="sm" class="w-full gap-1.5 border-dashed" @click="fileInputEl?.click()">
            <Icon name="lucide:plus" class="size-3.5" />
            Upload New Document
          </Button>
          <input
            ref="fileInputEl" type="file" accept=".pdf,.docx,.txt" multiple class="hidden"
            @change="uploadDocs(($event.target as HTMLInputElement).files)"
          >
        </div>

        <Separator />

        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">
            Elev8 AI
          </div>
          <div class="text-xs text-muted-foreground font-medium">
            Property Integration
          </div>
          <div class="flex flex-col gap-1.5">
            <div v-for="item in ['Property details', 'Property availability and pricing', 'Guest and reservation data', 'Past conversations (last 6 months)']" :key="item" class="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon name="lucide:check" class="size-3.5 text-green-500 shrink-0" />
              {{ item }}
            </div>
          </div>
        </div>

        <Separator />

        <div class="flex flex-col gap-2">
          <div class="text-sm font-semibold">
            Property Profile
          </div>
          <Button class="w-full gap-1.5" :disabled="isAutoFilling" @click="autoFill">
            <Icon v-if="isAutoFilling" name="lucide:loader-2" class="size-3.5 animate-spin" />
            <Icon v-else name="lucide:sparkles" class="size-3.5" />
            {{ isAutoFilling ? 'Filling...' : 'Auto-Fill Property Details' }}
          </Button>
          <Button variant="outline" class="w-full gap-1.5" @click="showCopyDialog = true">
            <Icon name="lucide:copy" class="size-3.5" />
            Copy Data From Other Property
          </Button>
        </div>
      </div>
    </ScrollArea>

    <Dialog v-model:open="showCopyDialog">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Copy From Property</DialogTitle>
          <DialogDescription>Copy resources from another listing.</DialogDescription>
        </DialogHeader>
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input v-model="copySearch" placeholder="Search listings..." class="pl-8" />
        </div>
        <ScrollArea class="max-h-60">
          <div class="flex flex-col gap-1">
            <div
              v-for="l in filteredCopyListings" :key="l.id"
              class="flex items-center gap-3 rounded-md px-2 py-2 cursor-pointer hover:bg-accent"
              @click="copyFromProperty(l.id)"
            >
              <div class="size-8 rounded overflow-hidden bg-muted shrink-0">
                <img :src="l.photos[0]" class="size-full object-cover">
              </div>
              <span class="text-sm truncate">{{ l.name }}</span>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  </div>
</template>
