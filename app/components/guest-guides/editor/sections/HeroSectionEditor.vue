<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Photo URL</Label>
      <Input
        :model-value="modelValue.photoUrl ?? ''"
        placeholder="https://..."
        @update:model-value="update({ photoUrl: $event })"
      />
    </div>
    <div>
      <Label>Title</Label>
      <Input
        :model-value="modelValue.title ?? ''"
        @update:model-value="update({ title: $event })"
      />
    </div>
    <div>
      <Label>Subtitle</Label>
      <Input
        :model-value="modelValue.subtitle ?? ''"
        @update:model-value="update({ subtitle: $event })"
      />
    </div>
  </div>
</template>
