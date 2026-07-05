<script setup lang="ts">
import type { StayOperationalRecord } from '~/components/review-hub/data/types'
import { badgeLevelColors, getCleaningBadgeLevel, getCommunicationBadgeLevel, getHouseRulesBadgeLevel } from '~/components/review-hub/data/types'

const props = defineProps<{
  sor: StayOperationalRecord | null
}>()

const isExpanded = ref(false)

const cleaningLevel = computed(() => props.sor ? getCleaningBadgeLevel(props.sor.cleaning_score) : null)
const houseRulesLevel = computed(() => props.sor ? getHouseRulesBadgeLevel(props.sor.house_rule_flags) : null)
const communicationLevel = computed(() => props.sor ? getCommunicationBadgeLevel(props.sor.communication_score) : null)

function getBadgeClass(level: 'green' | 'amber' | 'red' | null) {
  if (!level) return 'bg-muted text-muted-foreground'
  return `${badgeLevelColors[level].bg} ${badgeLevelColors[level].text}`
}

const overallRating = computed(() => {
  if (!props.sor) return null
  const scores: number[] = []
  if (props.sor.cleaning_score !== null) scores.push(props.sor.cleaning_score)
  if (props.sor.communication_score !== null) scores.push(props.sor.communication_score)
  const houseRulesScore = props.sor.house_rule_flags.length === 0 ? 5 : Math.max(1, 5 - props.sor.house_rule_flags.length)
  scores.push(houseRulesScore)
  if (scores.length === 0) return null
  return +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <Icon name="lucide:clipboard-check" class="size-4 text-muted-foreground" />
      <span class="text-sm font-medium">Stay Report</span>
    </div>

    <template v-if="sor">
      <!-- Overall Rating (Accordion Trigger) -->
      <button
        v-if="overallRating !== null"
        type="button"
        class="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
        @click="isExpanded = !isExpanded"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl font-bold">{{ overallRating }}<span class="text-base font-normal text-muted-foreground">/5</span></span>
          <p class="text-xs text-muted-foreground">Overall Stay Report</p>
        </div>
        <Icon
          name="lucide:chevron-down"
          class="size-4 text-muted-foreground transition-transform"
          :class="isExpanded && 'rotate-180'"
        />
      </button>

      <!-- Expanded Details -->
      <div v-if="isExpanded" class="space-y-4">
        <!-- Badge Summary -->
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-lg border p-3 text-center" :class="getBadgeClass(cleaningLevel)">
            <p class="text-[10px] font-medium opacity-70">
              Cleaning
            </p>
            <p class="mt-1 text-sm font-medium">
              {{ sor.cleaning_score ?? '-' }}<span class="text-xs opacity-70">/5</span>
            </p>
          </div>
          <div class="rounded-lg border p-3 text-center" :class="getBadgeClass(houseRulesLevel)">
            <p class="text-[10px] font-medium opacity-70">
              House Rules
            </p>
            <p class="mt-1 text-sm font-medium">
              {{ sor.house_rule_flags.length === 0 ? 5 : Math.max(1, 5 - sor.house_rule_flags.length) }}<span class="text-xs opacity-70">/5</span>
            </p>
          </div>
          <div class="rounded-lg border p-3 text-center" :class="getBadgeClass(communicationLevel)">
            <p class="text-[10px] font-medium opacity-70">
              Communication
            </p>
            <p class="mt-1 text-sm font-medium">
              {{ sor.communication_score ?? '-' }}<span class="text-xs opacity-70">/5</span>
            </p>
          </div>
        </div>

        <!-- Cleaning Notes -->
        <div v-if="sor.cleaning_notes" class="space-y-1">
          <div class="flex items-center gap-2">
            <Icon name="lucide:spray-can" class="size-3.5 text-muted-foreground" />
            <span class="text-xs font-medium text-muted-foreground">Cleaning Notes</span>
          </div>
          <p class="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
            {{ sor.cleaning_notes }}
          </p>
          <p v-if="sor.cleaning_duration_delta !== null" class="text-xs text-muted-foreground">
            Turnover {{ sor.cleaning_duration_delta > 0 ? '+' : '' }}{{ sor.cleaning_duration_delta }} min vs. estimated
          </p>
        </div>

        <!-- Communication Summary -->
        <div v-if="sor.communication_summary" class="space-y-1">
          <div class="flex items-center gap-2">
            <Icon name="lucide:message-circle" class="size-3.5 text-muted-foreground" />
            <span class="text-xs font-medium text-muted-foreground">Communication Summary</span>
          </div>
          <p class="rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
            {{ sor.communication_summary }}
          </p>
        </div>
      </div>
    </template>

    <div v-else class="rounded-lg border border-dashed p-6 text-center">
      <Icon name="lucide:clipboard-x" class="mx-auto size-6 text-muted-foreground" />
      <p class="mt-2 text-sm text-muted-foreground">
        No operational data available for this stay.
      </p>
    </div>
  </div>
</template>
