<script setup lang="ts">
defineProps<{
  data: {
    services?: Array<{ id: string; name: string; description?: string; price: number; currency: string }>
    heading?: string
    subheading?: string
  }
  listing?: any
  token?: string
}>()

const emit = defineEmits<{
  add: [serviceId: string]
}>()

const { translate } = useAutoTranslate()

function handleAdd(serviceId: string) {
  emit('add', serviceId)
}
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:shopping-bag" class="size-5" />
      </div>
      <div>
        <h2 class="text-xl font-semibold">
          {{ translate(data.heading ?? 'Enhance your stay') }}
        </h2>
        <p v-if="data.subheading" class="text-sm text-muted-foreground">
          {{ translate(data.subheading) }}
        </p>
      </div>
    </div>

    <div v-if="data.services && data.services.length" class="grid grid-cols-1 gap-3 md:grid-cols-2">
      <article
        v-for="service in data.services"
        :key="service.id"
        class="rounded-md border bg-muted/30 p-4"
      >
        <h4 class="font-medium">
          {{ translate(service.name) }}
        </h4>
        <p v-if="service.description" class="mt-1 text-sm text-muted-foreground">
          {{ translate(service.description) }}
        </p>
        <p class="mt-2 text-lg font-semibold">
          {{ service.currency }} {{ service.price }}
        </p>
        <button
          type="button"
          class="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90"
          @click="handleAdd(service.id)"
        >
          {{ translate('Add to stay') }}
        </button>
      </article>
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('No upsells available.') }}
    </p>
  </section>
</template>