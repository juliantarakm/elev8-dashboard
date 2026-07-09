<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Check-out time</Label>
      <Input
        type="time"
        :model-value="modelValue.time ?? '11:00'"
        @update:model-value="update({ time: $event })"
      />
    </div>
    <div>
      <Label>Instructions</Label>
      <Textarea
        :model-value="modelValue.instructions ?? ''"
        rows="4"
        placeholder="e.g. Leave keys on the kitchen counter..."
        @update:model-value="update({ instructions: $event })"
      />
    </div>
  </div>
</template>
