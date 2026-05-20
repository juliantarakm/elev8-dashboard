<script setup lang="ts">
import type { Journey } from './data/journeys'
import { generatedJourneyExample } from './data/journeys'

const props = defineProps<{
  prompt: string
}>()

const emit = defineEmits<{
  done: [journey: Journey]
}>()

const generatingSteps = [
  'Analysing goal',
  'Identifying triggers',
  'Generating message directives',
  'Adding context checks',
  'Finalising',
]

const completedCount = ref(0)
const activeIndex = ref(0)
const dotCount = ref(1)

const progress = computed(() => Math.round((completedCount.value / generatingSteps.length) * 100))

let dotInterval: ReturnType<typeof setInterval>

async function runGeneration() {
  dotInterval = setInterval(() => {
    dotCount.value = (dotCount.value % 3) + 1
  }, 400)

  for (let i = 0; i < generatingSteps.length; i++) {
    activeIndex.value = i
    await new Promise(r => setTimeout(r, 600))
    completedCount.value = i + 1
  }

  clearInterval(dotInterval)
  await new Promise(r => setTimeout(r, 400))
  emit('done', generatedJourneyExample as Journey)
}

onMounted(() => {
  runGeneration()
})

onUnmounted(() => {
  clearInterval(dotInterval)
})
</script>

<template>
  <div class="flex flex-col h-full items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <h2 class="text-xl font-semibold">
          Generating your Journey{{ '.'.repeat(dotCount) }}
        </h2>
        <div class="mt-3 rounded-lg border bg-muted/40 px-4 py-3">
          <p class="text-sm italic text-muted-foreground">{{ prompt }}</p>
        </div>
      </div>

      <div class="mb-6 flex flex-col gap-3">
        <div
          v-for="(step, index) in generatingSteps"
          :key="step"
          class="flex items-center gap-3"
        >
          <div class="flex h-5 w-5 shrink-0 items-center justify-center">
            <Icon
              v-if="completedCount > index"
              name="i-lucide-check-circle-2"
              class="h-5 w-5 text-green-500"
            />
            <Icon
              v-else-if="activeIndex === index && completedCount <= index"
              name="i-lucide-loader-2"
              class="h-5 w-5 animate-spin"
              :style="{ color: '#C8A84B' }"
            />
            <div
              v-else
              class="h-2.5 w-2.5 rounded-full bg-muted-foreground/30"
            />
          </div>
          <span
            :class="[
              'text-sm transition-colors',
              completedCount > index
                ? 'text-foreground'
                : activeIndex === index && completedCount <= index
                  ? 'font-medium'
                  : 'text-muted-foreground',
            ]"
            :style="activeIndex === index && completedCount <= index ? { color: '#C8A84B' } : {}"
          >
            {{ step }}
          </span>
        </div>
      </div>

      <Progress :model-value="progress" class="h-1.5" />
      <p class="mt-2 text-center text-xs text-muted-foreground">{{ progress }}%</p>
    </div>
  </div>
</template>
