<!-- app/components/users/SalaryDisplay.vue -->
<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'

interface Props {
  amount: number
  workingDaysPerMonth: number
  hoursPerDay: number
}

const props = defineProps<Props>()

const formattedAmount = computed(() => {
  const num = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(props.amount)
  return `IDR ${num}`
})

const hasData = computed(() =>
  props.amount > 0 || props.workingDaysPerMonth > 0 || props.hoursPerDay > 0,
)
</script>

<template>
  <Card class="bg-muted/50 border-dashed">
    <CardContent class="p-4 space-y-2">
      <div class="flex items-baseline gap-2 flex-wrap">
        <span class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Monthly
        </span>
        <span v-if="hasData" class="text-base font-semibold font-mono">
          {{ formattedAmount }}
        </span>
        <span v-else class="text-sm text-muted-foreground italic">
          IDR 0 / 0 working days — 0 hours/day
        </span>
      </div>
      <div v-if="hasData" class="text-xs text-muted-foreground">
        {{ workingDaysPerMonth }} working days · {{ hoursPerDay }} hours/day
      </div>
      <p class="text-xs text-muted-foreground italic pt-1 border-t border-border/50 mt-2">
        Salary is managed in the HR module (coming soon). This is a display-only summary.
      </p>
    </CardContent>
  </Card>
</template>