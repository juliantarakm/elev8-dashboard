<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Check-in time</Label>
      <Input
        type="time"
        :model-value="modelValue.time ?? '14:00'"
        @update:model-value="update({ time: $event })"
      />
    </div>
    <div>
      <Label>Instructions</Label>
      <Textarea
        :model-value="modelValue.instructions ?? ''"
        rows="4"
        placeholder="e.g. Our staff will meet you at the gate..."
        @update:model-value="update({ instructions: $event })"
      />
    </div>
    <div class="flex items-center justify-between rounded-md border p-3">
      <div>
        <Label>Early check-in available</Label>
        <p class="mt-1 text-xs text-muted-foreground">Show option to request early arrival.</p>
      </div>
      <Switch
        :model-value="!!modelValue.earlyCheckinAvailable"
        @update:model-value="update({ earlyCheckinAvailable: $event })"
      />
    </div>
  </div>
</template>
