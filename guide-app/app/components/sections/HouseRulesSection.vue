<script setup lang="ts">
defineProps<{
  data: {
    rules?: string[]
  }
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:scroll" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('House Rules') }}
      </h2>
    </div>
    <ul v-if="data.rules && data.rules.length" class="space-y-2">
      <li
        v-for="(rule, idx) in data.rules"
        :key="idx"
        class="flex items-start gap-2 text-sm md:text-base"
      >
        <Icon name="lucide:check" class="mt-0.5 size-4 flex-shrink-0 text-emerald-600" />
        <span>{{ translate(rule) }}</span>
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('No specific house rules.') }}
    </p>
  </section>
</template>