<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

// Simplified for MVP: lockIds is a comma-separated list of lock IDs from
// useSmartLock().locks. Phase 2 will replace with a multi-select picker
// scoped to the assigned listing.

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const lockIdsText = computed({
  get: () => ((props.modelValue.lockIds ?? []) as string[]).join(', '),
  set: (v: string) => update({
    lockIds: v.split(',').map(s => s.trim()).filter(Boolean),
  }),
})

const codeWindowHours = computed({
  get: () => Number(props.modelValue.codeWindowHours ?? 24),
  set: (v: number) => update({ codeWindowHours: Number.isFinite(v) ? v : 24 }),
})
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Heading</Label>
      <Input
        :model-value="modelValue.heading ?? ''"
        placeholder="e.g. Your door code"
        @update:model-value="update({ heading: $event })"
      />
    </div>

    <div>
      <Label>Lock IDs</Label>
      <Input
        v-model="lockIdsText"
        placeholder="e.g. lock-1, lock-2"
      />
      <p class="mt-1 text-xs text-muted-foreground">
        Comma-separated lock IDs from this listing's smart locks. (Simplified for MVP.)
      </p>
    </div>

    <div>
      <Label>Code window (hours before check-in)</Label>
      <Input
        type="number"
        :model-value="codeWindowHours"
        min="0"
        max="168"
        @update:model-value="codeWindowHours = Number($event)"
      />
      <p class="mt-1 text-xs text-muted-foreground">
        Door code becomes visible this many hours before check-in. Default: 24.
      </p>
    </div>
  </div>
</template>
