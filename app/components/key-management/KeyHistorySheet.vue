<script setup lang="ts">
import type { KeyEventAction, PhysicalKey } from './data/keys'
import { formatDistanceToNow } from 'date-fns'
import { computed } from 'vue'
import { staffMembers } from '~/components/inbox/data/conversations'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName, keyEventLabels } from './data/keys'

const { open, keyItem } = defineProps<{
  open: boolean
  keyItem: PhysicalKey | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { getEventsForKey } = useKeyManagement()

const events = computed(() => (keyItem ? getEventsForKey(keyItem.id) : []))

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')

function staffName(id?: string) {
  if (!id)
    return null
  return staffMembers.find(s => s.id === id)?.name ?? id
}

function actionDotClass(action: KeyEventAction) {
  switch (action) {
    case 'register': return 'bg-muted-foreground/50'
    case 'checkout': return 'bg-primary'
    case 'return': return 'bg-muted-foreground/50'
    case 'mark_lost': return 'bg-destructive'
    case 'replace': return 'bg-muted-foreground/50'
    case 'handover': return 'bg-primary'
  }
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

function eventDescription(event: KeyEvent) {
  const actor = staffName(event.actorStaffId)
  const staff = staffName(event.staffId)
  const previous = staffName(event.previousStaffId)
  if (event.action === 'handover' && previous && staff)
    return `${previous} → ${staff} · recorded by ${actor}`
  if (staff)
    return `${staff} · recorded by ${actor}`
  return `Recorded by ${actor}`
}
</script>

<template>
  <Sheet :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <SheetContent side="right" class="w-full sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Key history</SheetTitle>
        <SheetDescription>
          {{ keyName }}
        </SheetDescription>
      </SheetHeader>

      <div class="mt-6 overflow-y-auto px-6 pb-6">
        <div v-for="(event, index) in events" :key="event.id" class="flex gap-4">
          <div class="flex flex-col items-center pt-1">
            <div class="size-2 rounded-full" :class="actionDotClass(event.action)" />
            <div v-if="index < events.length - 1" class="mt-2 w-px flex-1 bg-border" />
          </div>
          <div class="min-w-0 flex-1 pb-6">
            <p class="text-sm font-medium">
              {{ keyEventLabels[event.action] }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ eventDescription(event) }}
            </p>
            <p v-if="event.note" class="mt-1 text-sm text-muted-foreground">
              {{ event.note }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ timeAgo(event.at) }}
            </p>
          </div>
        </div>
        <p v-if="!events.length" class="py-8 text-center text-sm text-muted-foreground">
          No events yet.
        </p>
      </div>
    </SheetContent>
  </Sheet>
</template>
