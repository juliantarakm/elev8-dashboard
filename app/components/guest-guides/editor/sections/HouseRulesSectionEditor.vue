<script setup lang="ts">
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Icon } from '#components'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const rules = computed({
  get: () => (props.modelValue.rules ?? []) as string[],
  set: (v: string[]) => update({ rules: v }),
})

function add() {
  rules.value = [...rules.value, '']
}

function remove(idx: number) {
  rules.value = rules.value.filter((_, i) => i !== idx)
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="(_rule, idx) in rules" :key="idx" class="flex gap-2">
      <Input v-model="rules[idx]" placeholder="e.g. No smoking indoors" />
      <Button variant="ghost" size="sm" @click="remove(idx)">
        <Icon name="lucide:trash-2" class="size-4" />
      </Button>
    </div>
    <Button variant="outline" size="sm" @click="add">
      + Add rule
    </Button>
  </div>
</template>
