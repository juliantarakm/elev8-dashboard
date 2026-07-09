<script setup lang="ts">
defineProps<{
  data: {
    tips?: Array<{ title: string; body: string; icon?: string }>
  }
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:map-pin" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('Local Tips') }}
      </h2>
    </div>

    <div v-if="data.tips && data.tips.length" class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <article
        v-for="(tip, idx) in data.tips"
        :key="idx"
        class="rounded-md border bg-muted/30 p-3"
      >
        <div class="mb-1 flex items-center gap-2">
          <Icon v-if="tip.icon" :name="`lucide:${tip.icon}`" class="size-4 text-primary" />
          <h3 class="font-medium">
            {{ translate(tip.title) }}
          </h3>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ translate(tip.body) }}
        </p>
      </article>
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('No local tips yet.') }}
    </p>
  </section>
</template>