<script setup lang="ts">
import type { KeyEventAction } from './data/keys'
import { formatDistanceToNow } from 'date-fns'
import { staffMembers } from '~/components/inbox/data/conversations'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName, keyEventLabels } from './data/keys'

const { sortedEvents, getKeyById } = useKeyManagement()

function staffName(id?: string) {
  if (!id)
    return null
  return staffMembers.find(s => s.id === id)?.name ?? id
}

function keyName(keyId: string) {
  const key = getKeyById(keyId)
  return key ? getKeyDisplayName(key) : keyId
}

function listingName(keyId: string) {
  const key = getKeyById(keyId)
  if (!key)
    return ''
  return listings.value.find(l => l.id === key.listingId)?.name ?? key.listingId
}

function actionBadgeVariant(action: KeyEventAction) {
  switch (action) {
    case 'register': return 'secondary'
    case 'checkout': return 'default'
    case 'return': return 'outline'
    case 'mark_lost': return 'destructive'
    case 'replace': return 'secondary'
    case 'handover': return 'default'
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
  <div class="space-y-4">
    <div v-for="event in sortedEvents" :key="event.id" class="flex gap-3 rounded-lg border p-3">
      <div class="mt-0.5">
        <Badge :variant="actionBadgeVariant(event.action)">
          {{ keyEventLabels[event.action] }}
        </Badge>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium">
          {{ keyName(event.keyId) }}
          <span class="font-normal text-muted-foreground">· {{ listingName(event.keyId) }}</span>
        </p>
        <p class="text-sm text-muted-foreground">
          {{ eventDescription(event) }}
        </p>
        <p v-if="event.note" class="mt-0.5 text-sm">
          {{ event.note }}
        </p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          {{ timeAgo(event.at) }}
        </p>
      </div>
    </div>
    <p v-if="!sortedEvents.length" class="py-8 text-center text-sm text-muted-foreground">
      No activity yet.
    </p>
  </div>
</template>
