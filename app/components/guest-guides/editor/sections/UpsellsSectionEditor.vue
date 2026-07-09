<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

// Simplified for MVP: host types comma-separated service IDs from
// useUpsellServices(). Phase 2 will replace with a multi-select picker.

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const serviceIdsText = computed({
  get: () => ((props.modelValue.serviceIds ?? []) as string[]).join(', '),
  set: (v: string) => update({
    serviceIds: v.split(',').map(s => s.trim()).filter(Boolean),
  }),
})
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Heading</Label>
      <Input
        :model-value="modelValue.heading ?? ''"
        placeholder="e.g. Enhance your stay"
        @update:model-value="update({ heading: $event })"
      />
    </div>

    <div>
      <Label>Subheading</Label>
      <Textarea
        :model-value="modelValue.subheading ?? ''"
        rows="2"
        placeholder="e.g. Add these popular services during your visit"
        @update:model-value="update({ subheading: $event })"
      />
    </div>

    <div>
      <Label>Service IDs</Label>
      <Input
        v-model="serviceIdsText"
        placeholder="e.g. svc-chef, svc-spa, svc-airport"
      />
      <p class="mt-1 text-xs text-muted-foreground">
        Comma-separated service IDs from the upsell catalog. (Simplified for MVP.)
      </p>
    </div>
  </div>
</template>
