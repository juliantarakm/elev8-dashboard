<script lang="ts" setup>
import type { SmartAction } from '~/components/inbox/data/conversations'

interface ReservationSummaryProps {
  smartActions: SmartAction[]
}

const props = defineProps<ReservationSummaryProps>()
</script>

<template>
  <div class="space-y-4">
    <div v-if="smartActions.length > 0" class="space-y-2">
      <div class="flex items-center gap-2 text-sm font-medium">
        Action Needed
        <Badge variant="destructive" class="text-[10px]">{{ smartActions.length }}</Badge>
      </div>
      <InboxActionCard
        v-for="action of smartActions"
        :key="action.id"
        :action="action"
        @dismiss="$props.smartActions.splice($props.smartActions.findIndex(a => a.id === action.id), 1)"
      />
    </div>

    <div class="space-y-2">
      <div class="text-sm font-medium">Quick Actions</div>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <Icon name="lucide:pencil" class="size-4" />
          Edit Reservation
        </Button>
        <Button variant="outline" size="sm">
          <Icon name="lucide:external-link" class="size-4" />
          Detail Reservation
        </Button>
      </div>
    </div>
  </div>
</template>