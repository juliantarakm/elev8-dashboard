<script setup lang="ts">
const props = defineProps<{
  data: {
    time?: string
    instructions?: string
    earlyCheckinAvailable?: boolean
  }
  listing?: {
    resources?: {
      basics?: {
        checkInTime?: string
      }
    }
    checkInInstructions?: string
  }
  token?: string
}>()

const time = computed(() => props.data?.time ?? props.listing?.resources?.basics?.checkInTime ?? '14:00')
const instructions = computed(() => props.data?.instructions ?? props.listing?.checkInInstructions ?? null)

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:log-in" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('Check-in') }}
      </h2>
    </div>
    <div class="mb-2 text-2xl font-bold text-primary">
      {{ time }}
    </div>
    <p v-if="instructions" class="text-sm leading-relaxed text-muted-foreground md:text-base">
      {{ translate(instructions) }}
    </p>
    <p v-if="data.earlyCheckinAvailable" class="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
      <Icon name="lucide:check" class="size-3" />
      {{ translate('Early check-in available') }}
    </p>
  </section>
</template>