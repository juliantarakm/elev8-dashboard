<script lang="ts" setup>
import type { GuestDetails } from '~/components/inbox/data/conversations'

interface ReservationGuestProps {
  guest: GuestDetails
}

const props = defineProps<ReservationGuestProps>()

const initials = computed(() =>
  props.guest.name.split(' ').map(n => n[0]).join(''),
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <Avatar class="size-10">
        <AvatarFallback>{{ initials }}</AvatarFallback>
      </Avatar>
      <div>
        <div class="font-semibold text-sm">{{ guest.name }}</div>
        <div class="text-xs text-muted-foreground">
          {{ guest.previousStays }} previous stay{{ guest.previousStays !== 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex items-center gap-2 text-sm">
        <Icon name="lucide:mail" class="size-4 text-muted-foreground" />
        <span>{{ guest.email }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm">
        <Icon name="lucide:phone" class="size-4 text-muted-foreground" />
        <span>{{ guest.phone }}</span>
      </div>
    </div>

    <div v-if="guest.notes" class="rounded-lg border bg-card p-3">
      <div class="text-xs text-muted-foreground mb-1">Notes</div>
      <div class="text-sm">{{ guest.notes }}</div>
    </div>
  </div>
</template>