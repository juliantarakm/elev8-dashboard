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
  }
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
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
          <template v-if="staffName(event.staffId)">
            {{ staffName(event.staffId) }} · recorded by {{ staffName(event.actorStaffId) }}
          </template>
          <template v-else>
            Recorded by {{ staffName(event.actorStaffId) }}
          </template>
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
