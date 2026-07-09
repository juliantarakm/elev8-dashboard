<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Icon } from '#components'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const items = computed({
  get: () => (props.modelValue.items ?? []) as string[],
  set: (v: string[]) => update({ items: v }),
})

const newItem = ref('')

function add() {
  const trimmed = newItem.value.trim()
  if (!trimmed) return
  items.value = [...items.value, trimmed]
  newItem.value = ''
}

function remove(idx: number) {
  items.value = items.value.filter((_, i) => i !== idx)
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex gap-2">
      <Input
        v-model="newItem"
        placeholder="e.g. Pool, WiFi, Air conditioning"
        @keyup.enter="add"
      />
      <Button variant="outline" size="sm" @click="add">
        Add
      </Button>
    </div>

    <div v-if="items.length > 0" class="flex flex-wrap gap-2">
      <div
        v-for="(item, idx) in items"
        :key="idx"
        class="inline-flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-sm"
      >
        <span>{{ item }}</span>
        <button
          type="button"
          class="text-muted-foreground hover:text-destructive"
          @click="remove(idx)"
        >
          <Icon name="lucide:x" class="size-3" />
        </button>
      </div>
    </div>
    <p v-else class="text-xs text-muted-foreground">
      No amenities yet. Add the first one above.
    </p>
  </div>
</template>
