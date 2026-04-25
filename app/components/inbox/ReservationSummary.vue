<script lang="ts" setup>
import type { SmartAction, GuestSentiment } from '~/components/inbox/data/conversations'

interface ReservationSummaryProps {
  sentiment: GuestSentiment
  sentimentNote: string
  smartActions: SmartAction[]
}

const props = defineProps<ReservationSummaryProps>()

function handleResolveAll() {
  props.smartActions.splice(0, props.smartActions.length)
}

<template>
  <div class="space-y-4">
    <InboxGuestSentiment :sentiment="sentiment" :note="sentimentNote" />

    <div v-if="smartActions.length > 0" class="space-y-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm font-medium">
          Action Needed
          <Badge variant="destructive" class="text-[10px]">{{ smartActions.length }}</Badge>
        </div>
        <Button variant="outline" size="sm" @click="handleResolveAll">
          <Icon name="lucide:check" class="size-4 mr-1" />
          Mark as Resolved
        </Button>
      </div>
      <InboxActionCard
        v-for="action of smartActions"
        :key="action.id"
        :action="action"
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