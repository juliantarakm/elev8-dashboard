<script setup lang="ts">
defineProps<{
  data: {
    time?: string
    instructions?: string
  }
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:log-out" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('Check-out') }}
      </h2>
    </div>
    <div class="mb-2 text-2xl font-bold text-primary">
      {{ data.time ?? '11:00' }}
    </div>
    <p v-if="data.instructions" class="text-sm leading-relaxed text-muted-foreground md:text-base">
      {{ translate(data.instructions) }}
    </p>
  </section>
</template>