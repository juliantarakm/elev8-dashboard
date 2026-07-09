<script setup lang="ts">
const props = defineProps<{
  page: number
  totalItems: number
  pageSize: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.pageSize)))

const pages = computed(() => {
  const result: (number | 'ellipsis')[] = []
  const t = totalPages.value
  const p = props.page

  if (t <= 7) {
    for (let i = 1; i <= t; i++) result.push(i)
    return result
  }

  result.push(1)
  if (p > 3) result.push('ellipsis')

  for (let i = Math.max(2, p - 1); i <= Math.min(t - 1, p + 1); i++) {
    result.push(i)
  }

  if (p < t - 2) result.push('ellipsis')
  if (t > 1) result.push(t)

  return result
})
</script>

<template>
  <div class="flex items-center justify-between border-t px-4 py-3">
    <p class="text-xs text-muted-foreground">
      {{ totalItems }} reviews
    </p>
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        class="size-8"
        :disabled="page <= 1"
        @click="emit('update:page', page - 1)"
      >
        <Icon name="lucide:chevron-left" class="size-4" />
      </Button>

      <template v-for="(p, i) in pages" :key="i">
        <Button
          v-if="p !== 'ellipsis'"
          variant="ghost"
          class="size-8 p-0 text-xs"
          :class="p === page ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''"
          @click="emit('update:page', p)"
        >
          {{ p }}
        </Button>
        <span v-else class="flex size-8 items-center justify-center text-xs text-muted-foreground">
          ...
        </span>
      </template>

      <Button
        variant="outline"
        size="icon"
        class="size-8"
        :disabled="page >= totalPages"
        @click="emit('update:page', page + 1)"
      >
        <Icon name="lucide:chevron-right" class="size-4" />
      </Button>
    </div>
  </div>
</template>
