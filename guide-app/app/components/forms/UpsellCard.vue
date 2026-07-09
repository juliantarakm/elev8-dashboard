<script setup lang="ts">
defineProps<{
  service: {
    id: string
    name: string
    description?: string
    price: number
    currency: string
  }
}>()

const emit = defineEmits<{
  add: [serviceId: string]
}>()

const { translate } = useAutoTranslate()

function handleAdd() {
  emit('add', service.id)
}
</script>

<template>
  <article class="rounded-lg border p-4">
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
      class="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      @click="handleAdd"
    >
      {{ translate('Add to stay') }}
    </button>
  </article>
</template>