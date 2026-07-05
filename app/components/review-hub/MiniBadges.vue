<script setup lang="ts">
import type { StayOperationalRecord } from '~/components/review-hub/data/types'
import { badgeLevelColors, getCleaningBadgeLevel, getCommunicationBadgeLevel, getHouseRulesBadgeLevel } from '~/components/review-hub/data/types'

const props = defineProps<{
  sor: StayOperationalRecord | null
}>()

const cleaningLevel = computed(() => props.sor ? getCleaningBadgeLevel(props.sor.cleaning_score) : null)
const houseRulesLevel = computed(() => props.sor ? getHouseRulesBadgeLevel(props.sor.house_rule_flags) : null)
const communicationLevel = computed(() => props.sor ? getCommunicationBadgeLevel(props.sor.communication_score) : null)

function getBadgeClass(level: 'green' | 'amber' | 'red' | null) {
  if (!level) return 'bg-muted text-muted-foreground border-transparent'
  const c = badgeLevelColors[level]
  return `${c.bg} ${c.text} ${c.border}`
}

const houseRuleFlagList = computed(() => {
  if (!props.sor) return []
  return props.sor.house_rule_flags.map(f => f.type.replace(/_/g, ' ')).join(', ')
})

// House Rules derived as a 1-5 score: 5 = no flags, deduct 1 per flag, min 1
const houseRulesScore = computed<number | null>(() => {
  if (!props.sor) return null
  return Math.max(1, 5 - props.sor.house_rule_flags.length)
})

const hasData = computed(() => props.sor !== null)
</script>

<template>
  <div v-if="!hasData" class="text-xs text-muted-foreground">
    -
  </div>
  <div v-else class="flex items-center gap-1.5">
    <!-- Cleaning Score -->
    <span
      v-if="sor!.cleaning_score !== null"
      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
      :class="getBadgeClass(cleaningLevel)"
      :title="`Cleaning: ${sor!.cleaning_score}/5`"
    >
      <Icon name="lucide:spray-can" class="size-3" />
      {{ sor!.cleaning_score }}<span class="opacity-60">/5</span>
    </span>

    <!-- House Rules -->
    <span
      v-if="houseRulesScore !== null"
      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
      :class="getBadgeClass(houseRulesLevel)"
      :title="sor!.house_rule_flags.length === 0 ? 'House rules: 5/5 (no issues)' : `House rules: ${houseRulesScore}/5 — ${houseRuleFlagList}`"
    >
      <Icon name="lucide:shield-alert" class="size-3" />
      {{ houseRulesScore }}<span class="opacity-60">/5</span>
    </span>

    <!-- Communication Score -->
    <span
      v-if="sor!.communication_score !== null"
      class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
      :class="getBadgeClass(communicationLevel)"
      :title="`Communication: ${sor!.communication_score}/5`"
    >
      <Icon name="lucide:message-circle" class="size-3" />
      {{ sor!.communication_score }}<span class="opacity-60">/5</span>
    </span>
  </div>
</template>
