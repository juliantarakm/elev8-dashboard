<script setup lang="ts">
defineProps<{
  data: {
    heading?: string
    description?: string
  }
  listing?: any
  token?: string
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:clipboard-list" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate(data.heading ?? 'Pre-Arrival Form') }}
      </h2>
    </div>
    <p v-if="data.description" class="mb-4 text-sm text-muted-foreground">
      {{ translate(data.description) }}
    </p>
    <!-- PreArrivalForm rendered by [token].vue when type is pre_arrival -->
    <slot name="form" />
  </section>
</template>