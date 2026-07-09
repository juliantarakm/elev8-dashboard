<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { Input } from '~/components/ui/input'

defineProps<{ modelValue: Record<string, any> }>()
defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

const { getTemplates } = useGuestGuides()
const templates = getTemplates()
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Guide to send</Label>
      <Select
        :model-value="modelValue.guideId ?? ''"
        @update:model-value="$emit('update:modelValue', { ...modelValue, guideId: $event })"
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a guide" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="t in templates" :key="t.id" :value="t.id">
            {{ t.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Channel</Label>
      <Select
        :model-value="modelValue.channel ?? 'whatsapp'"
        @update:model-value="$emit('update:modelValue', { ...modelValue, channel: $event })"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="whatsapp">
            WhatsApp
          </SelectItem>
          <SelectItem value="email">
            Email
          </SelectItem>
          <SelectItem value="manual">
            Manual only
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div>
      <Label>Expiry (hours from issue)</Label>
      <Input
        type="number"
        :model-value="modelValue.expiryHours ?? 168"
        @update:model-value="$emit('update:modelValue', { ...modelValue, expiryHours: Number($event) })"
      />
    </div>
  </div>
</template>