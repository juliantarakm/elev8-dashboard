<script setup lang="ts">
import type { ReviewSource } from '~/components/review-hub/data/types'
import { channelIcons, channelLabels } from '~/components/review-hub/data/types'

const props = defineProps<{
  source: ReviewSource
}>()

const icon = computed(() => channelIcons[props.source])
const label = computed(() => channelLabels[props.source])
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-xs">
    <Icon :name="icon" class="size-3.5" />
    <span>{{ label }}</span>
  </span>
</template>
