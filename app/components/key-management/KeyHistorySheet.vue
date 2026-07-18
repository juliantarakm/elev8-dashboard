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

function actionBadgeVariant(action: KeyEventAction) {
  switch (action) {
    case 'register': return 'secondary'
    case 'checkout': return 'default'
    case 'return': return 'outline'
    case 'mark_lost': return 'destructive'
    case 'replace': return 'secondary'
  }
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
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

      <div class="mt-6 space-y-4 overflow-y-auto">
        <div v-for="event in events" :key="event.id" class="flex gap-3">
          <div class="mt-0.5">
            <Badge :variant="actionBadgeVariant(event.action)">
              {{ keyEventLabels[event.action] }}
            </Badge>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm">
              <template v-if="staffName(event.staffId)">
                {{ staffName(event.staffId) }}
                <span class="text-muted-foreground">· recorded by {{ staffName(event.actorStaffId) }}</span>
              </template>
              <template v-else>
                Recorded by {{ staffName(event.actorStaffId) }}
              </template>
            </p>
            <p v-if="event.note" class="mt-0.5 text-sm text-muted-foreground">
              {{ event.note }}
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ timeAgo(event.at) }}
            </p>
          </div>
        </div>
        <p v-if="!events.length" class="text-sm text-muted-foreground">
          No events yet.
        </p>
      </div>
    </SheetContent>
  </Sheet>
</template>
