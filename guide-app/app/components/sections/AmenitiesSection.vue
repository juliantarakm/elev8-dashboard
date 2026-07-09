<script setup lang="ts">
defineProps<{
  data: {
    items?: string[]
  }
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:star" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('Amenities') }}
      </h2>
    </div>
    <div v-if="data.items && data.items.length" class="flex flex-wrap gap-2">
      <span
        v-for="(item, idx) in data.items"
        :key="idx"
        class="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium md:text-sm"
      >
        {{ translate(item) }}
      </span>
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('No amenities listed.') }}
    </p>
  </section>
</template>