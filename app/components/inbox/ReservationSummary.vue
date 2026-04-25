<script lang="ts" setup>
import type { SmartAction, GuestSentiment } from '~/components/inbox/data/conversations'

interface ReservationSummaryProps {
  sentiment: GuestSentiment
  sentimentNote: string
  smartActions: SmartAction[]
}

const props = defineProps<ReservationSummaryProps>()

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