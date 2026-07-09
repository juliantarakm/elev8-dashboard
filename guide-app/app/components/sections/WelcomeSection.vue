<script setup lang="ts">
defineProps<{
  data: {
    message?: string
  }
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <h2 class="mb-2 text-xl font-semibold">
      {{ translate('Welcome') }}
    </h2>
    <p class="text-sm leading-relaxed text-foreground/90 md:text-base">
      {{ translate(data.message ?? '') }}
    </p>
  </section>
</template>