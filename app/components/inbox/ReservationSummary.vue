<script lang="ts" setup>
import type { Reservation, SmartAction, GuestSentiment } from '~/components/inbox/data/conversations'
import { otaSources } from '~/components/inbox/data/conversations'
import { format } from 'date-fns'

interface ReservationSummaryProps {
  reservation: Reservation
  sentiment: GuestSentiment
  sentimentNote: string
  smartActions: SmartAction[]
}

const props = defineProps<ReservationSummaryProps>()

const otaColorMap = Object.fromEntries(otaSources.map(s => [s.name, s.color]))

const otaColor = computed(() => otaColorMap[props.reservation.otaSource] ?? '#888')

function handleAct(action: SmartAction) {
  const idx = props.smartActions.indexOf(action)
  if (idx > -1) props.smartActions.splice(idx, 1)
}

function handleDismiss(action: SmartAction) {
  const idx = props.smartActions.indexOf(action)
  if (idx > -1) props.smartActions.splice(idx, 1)
}
</script>

<template>
  <div class="space-y-4">
    <InboxGuestSentiment :sentiment="sentiment" :note="sentimentNote" />

    <div v-if="smartActions.length > 0" class="space-y-2">
      <div class="text-sm font-medium">Action Needed</div>
      <InboxActionCard
        v-for="action of smartActions"
        :key="action.id"
        :action="action"
        @act="handleAct"
        @dismiss="handleDismiss"
      />
    </div>

    <div class="space-y-2">
      <div class="text-sm font-medium">Reservation Details</div>
      <div class="rounded-lg border bg-card p-3 space-y-2">
        <div class="flex items-center gap-2">
          <Icon name="lucide:home" class="size-4 text-muted-foreground" />
          <span class="text-sm">{{ reservation.propertyName }}</span>
          <span class="text-sm text-muted-foreground">{{ reservation.roomName }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
            :style="{ backgroundColor: `${otaColor}20`, color: otaColor }"
          >
            {{ reservation.otaSource }}
          </span>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="lucide:calendar" class="size-4" />
          <span>{{ format(new Date(reservation.checkIn), 'MMM d') }} &ndash; {{ format(new Date(reservation.checkOut), 'MMM d') }}</span>
          <span class="text-xs">({{ reservation.nights }} night{{ reservation.nights !== 1 ? 's' : '' }})</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="lucide:users" class="size-4" />
          <span>{{ reservation.guestCount }} guest{{ reservation.guestCount !== 1 ? 's' : '' }}</span>
        </div>
        <div class="text-sm font-bold">
          {{ reservation.currency }} {{ reservation.totalPrice.toLocaleString() }}
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <div class="text-sm font-medium">Quick Actions</div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <Icon name="lucide:layout-dashboard" class="size-4" />
          View in Cockpit
        </Button>
        <Button variant="outline" size="sm">
          <Icon name="lucide:sparkles" class="size-4" />
          Create Cleaning Task
        </Button>
        <Button variant="outline" size="sm">
          <Icon name="lucide:list" class="size-4" />
          View Activity Log
        </Button>
      </div>
    </div>
  </div>
</template>