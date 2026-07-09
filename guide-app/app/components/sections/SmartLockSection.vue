<script setup lang="ts">
defineProps<{
  data: {
    heading?: string
    codeWindowHours?: number
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
        <Icon name="lucide:lock" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate(data.heading ?? 'Door Code') }}
      </h2>
    </div>
    <p v-if="token" class="text-sm text-muted-foreground">
      {{ translate('Your code will be revealed here 24 hours before check-in.') }}
    </p>
    <!-- SmartLockPanel is rendered by [token].vue via token prop on this section -->
    <slot name="lock-panel" />
  </section>
</template>