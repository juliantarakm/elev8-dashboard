<script setup lang="ts">
import type { ReplyStatus } from '~/components/review-hub/data/types'
import { replyStatusColors, replyStatusIcons, replyStatusLabels } from '~/components/review-hub/data/types'

const props = defineProps<{
  status: ReplyStatus
}>()

const colors = computed(() => replyStatusColors[props.status])
const icon = computed(() => replyStatusIcons[props.status])
const label = computed(() => replyStatusLabels[props.status])
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
    :class="[colors.bg, colors.text]"
  >
    <Icon :name="icon" class="size-3" />
    {{ label }}
  </span>
</template>
