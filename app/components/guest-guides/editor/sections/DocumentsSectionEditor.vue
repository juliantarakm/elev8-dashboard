<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

// Simplified for MVP: host types comma-separated document IDs from
// listing.resources.documents. Phase 2 will replace with a popover picker
// that reads from useListings() and shows previews.

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const fileIdsText = computed({
  get: () => ((props.modelValue.fileIds ?? []) as string[]).join(', '),
  set: (v: string) => update({
    fileIds: v.split(',').map(s => s.trim()).filter(Boolean),
  }),
})
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Document file IDs</Label>
      <Input
        v-model="fileIdsText"
        placeholder="e.g. doc-1, doc-2, doc-3"
      />
      <p class="mt-1 text-xs text-muted-foreground">
        Comma-separated document IDs from this listing's resources. (Simplified for MVP.)
      </p>
    </div>

    <div>
      <Label>Heading (optional)</Label>
      <Input
        :model-value="modelValue.heading ?? ''"
        placeholder="e.g. Property documents"
        @update:model-value="update({ heading: $event })"
      />
    </div>

    <div>
      <Label>Description (optional)</Label>
      <Textarea
        :model-value="modelValue.description ?? ''"
        rows="3"
        placeholder="Anything guests should know about these docs"
        @update:model-value="update({ description: $event })"
      />
    </div>
  </div>
</template>
