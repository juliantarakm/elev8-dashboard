<script lang="ts" setup>
import type { GuestDetails, Reservation, StayStatus } from '~/components/inbox/data/conversations'
import { otaSources } from '~/components/inbox/data/conversations'
import { format } from 'date-fns'
import { cn } from '~/lib/utils'

interface ReservationGuestProps {
  guest: GuestDetails
  reservation: Reservation
  stayStatus: StayStatus
}

const props = defineProps<ReservationGuestProps>()

const initials = computed(() =>
  props.guest.name.split(' ').map(n => n[0]).join(''),
)

const stayStatusConfig: Record<StayStatus, { label: string, class: string }> = {
  inquiry: { label: 'Inquiry', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  current: { label: 'Current', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  future: { label: 'Future', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  past: { label: 'Past', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
}

const stayCfg = computed(() => stayStatusConfig[props.stayStatus])

const otaIconMap: Record<string, string> = Object.fromEntries(otaSources.map(s => [s.name, s.icon]))
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <Avatar class="size-10">
        <AvatarFallback>{{ initials }}</AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm">{{ guest.name }}</div>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{{ guest.previousStays }} previous stay{{ guest.previousStays !== 1 ? 's' : '' }}</span>
          <span :class="cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', stayCfg.class)">
            {{ stayCfg.label }}
          </span>
        </div>
      </div>
      <Icon :name="otaIconMap[reservation.otaSource] ?? 'lucide:globe'" class="size-4 shrink-0" />
    </div>

    <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
      <div class="flex items-center gap-2 text-muted-foreground">
        <Icon name="lucide:home" class="size-3.5" />
        <span class="truncate">{{ reservation.propertyName }}</span>
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <Icon name="lucide:calendar" class="size-3.5" />
        <span>{{ format(new Date(reservation.checkIn), 'MMM d') }} – {{ format(new Date(reservation.checkOut), 'MMM d') }}</span>
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <Icon name="lucide:users" class="size-3.5" />
        <span>{{ reservation.guestCount }} guest{{ reservation.guestCount !== 1 ? 's' : '' }}</span>
      </div>
      <div class="font-semibold">
        {{ reservation.currency }} {{ reservation.totalPrice.toLocaleString() }}
      </div>
    </div>

    <div class="flex flex-col gap-1.5 text-xs text-muted-foreground">
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:mail" class="size-3.5 shrink-0" />
        <span class="truncate">{{ guest.email }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:phone" class="size-3.5 shrink-0" />
        <span>{{ guest.phone }}</span>
      </div>
    </div>

    <div v-if="guest.notes" class="rounded-lg border bg-card p-2.5">
      <div class="text-xs text-muted-foreground mb-0.5">Notes</div>
      <div class="text-sm">{{ guest.notes }}</div>
    </div>
  </div>
</template>