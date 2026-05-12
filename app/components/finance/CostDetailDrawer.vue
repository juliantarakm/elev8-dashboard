<script setup lang="ts">
import type { CostEntry } from '@/components/finance/data/costs'

const props = defineProps<{
  cost: CostEntry | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

function onOpenChange(val: boolean) {
  emit('update:open', val)
}

function formatIDR(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatSyncedAt(isoString: string) {
  return new Date(isoString).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const typeBadgeClass = (type: string) => ({
  'text-slate-700 bg-slate-100 border-slate-200': type === 'Manual',
  'text-teal-700 bg-teal-50 border-teal-200': type === 'Cleaning',
  'text-purple-700 bg-purple-50 border-purple-200': type === 'Activity',
})
</script>

<template>
  <Sheet :open="props.open" @update:open="onOpenChange">
    <SheetContent class="flex w-full flex-col gap-0 p-0 sm:max-w-lg" side="right">
      <SheetHeader class="border-b px-6 py-4">
        <SheetTitle>Cost Detail</SheetTitle>
        <SheetDescription>
          View the details for this cost entry.
        </SheetDescription>
      </SheetHeader>

      <ScrollArea class="flex-1">
        <div v-if="props.cost" class="flex flex-col gap-6 p-6">
          <!-- Staff + listing -->
          <div class="flex items-start gap-3">
            <Avatar class="h-10 w-10 shrink-0">
              <AvatarFallback class="text-sm">
                {{ props.cost.staff.split(' ').map(n => n[0]).join('').slice(0, 2) }}
              </AvatarFallback>
            </Avatar>
            <div>
              <p class="font-medium leading-tight">
                {{ props.cost.staff }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ props.cost.listing }}
              </p>
            </div>
            <div class="ml-auto">
              <span
                class="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                :class="typeBadgeClass(props.cost.type)"
              >
                {{ props.cost.type }}
              </span>
            </div>
          </div>

          <Separator />

          <!-- Details -->
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt class="text-muted-foreground">
                Date
              </dt>
              <dd class="font-medium">
                {{ props.cost.date }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                Amount
              </dt>
              <dd class="font-medium">
                {{ formatIDR(props.cost.amount) }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">
                Category
              </dt>
              <dd class="font-medium">
                {{ props.cost.category }}
              </dd>
            </div>
            <div v-if="props.cost.duration">
              <dt class="text-muted-foreground">
                Duration
              </dt>
              <dd class="font-medium">
                {{ formatDuration(props.cost.duration) }}
              </dd>
            </div>
            <div v-if="props.cost.linkedCleaningId">
              <dt class="text-muted-foreground">
                Cleaning ID
              </dt>
              <dd class="font-mono text-xs font-medium">
                {{ props.cost.linkedCleaningId }}
              </dd>
            </div>
            <div v-if="props.cost.linkedActivityId">
              <dt class="text-muted-foreground">
                Activity ID
              </dt>
              <dd class="font-mono text-xs font-medium">
                {{ props.cost.linkedActivityId }}
              </dd>
            </div>
          </dl>

          <!-- Sync status -->
          <div
            class="flex items-center gap-3 rounded-md border px-3 py-2.5"
            :class="props.cost.synced ? 'border-green-200 bg-green-50' : 'border-muted bg-muted/40'"
          >
            <Icon
              :name="props.cost.synced ? 'i-lucide-cloud-check' : 'i-lucide-cloud-off'"
              class="h-4 w-4 shrink-0"
              :class="props.cost.synced ? 'text-green-600' : 'text-muted-foreground'"
            />
            <div>
              <p class="text-sm font-medium" :class="props.cost.synced ? 'text-green-700' : 'text-muted-foreground'">
                {{ props.cost.synced ? 'Synced to accounting' : 'Not yet synced' }}
              </p>
              <p v-if="props.cost.syncedAt" class="text-xs text-green-600">
                {{ formatSyncedAt(props.cost.syncedAt) }}
              </p>
            </div>
          </div>

          <!-- Note -->
          <div v-if="props.cost.note">
            <p class="mb-1 text-xs text-muted-foreground">
              Note
            </p>
            <p class="rounded-md bg-muted px-3 py-2 text-sm">
              {{ props.cost.note }}
            </p>
          </div>

          <!-- Invoice -->
          <div>
            <p class="mb-2 text-xs text-muted-foreground">
              Invoice
            </p>
            <div v-if="props.cost.invoice" class="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2.5">
              <Icon name="i-lucide-file-text" class="h-4 w-4 text-muted-foreground" />
              <span class="flex-1 truncate text-sm">{{ props.cost.invoice }}</span>
              <Button variant="ghost" size="sm" class="h-7 px-2 text-xs">
                <Icon name="i-lucide-download" class="mr-1 h-3 w-3" />
                Download
              </Button>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              No invoice attached.
            </p>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t px-6 py-4">
        <Button variant="outline" class="w-full" @click="onOpenChange(false)">
          Close
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
