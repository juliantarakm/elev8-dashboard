<script setup lang="ts">
defineProps<{
  data: {
    photoUrl?: string
    title?: string
    subtitle?: string
  }
}>()

const { translate } = useAutoTranslate()
</script>

<template>
  <section class="relative w-full overflow-hidden rounded-xl">
    <div
      v-if="data.photoUrl"
      class="h-64 w-full bg-cover bg-center md:h-80"
      :style="{ backgroundImage: `url(${data.photoUrl})` }"
    >
      <div class="flex h-full w-full flex-col items-start justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
        <h1 class="text-2xl font-bold drop-shadow md:text-4xl">
          {{ translate(data.title ?? 'Welcome') }}
        </h1>
        <p v-if="data.subtitle" class="mt-1 text-sm opacity-90 md:text-base">
          {{ translate(data.subtitle) }}
        </p>
      </div>
    </div>
    <div
      v-else
      class="flex h-48 w-full flex-col items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 text-center"
    >
      <h1 class="text-2xl font-bold md:text-4xl">
        {{ translate(data.title ?? 'Welcome') }}
      </h1>
      <p v-if="data.subtitle" class="mt-2 text-sm text-muted-foreground md:text-base">
        {{ translate(data.subtitle) }}
      </p>
    </div>
  </section>
</template>