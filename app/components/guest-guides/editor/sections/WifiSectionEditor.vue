<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { Icon } from '#components'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const showPassword = ref(false)
</script>

<template>
  <div class="space-y-3">
    <div>
      <Label>Network name (SSID)</Label>
      <Input
        :model-value="modelValue.ssid ?? ''"
        placeholder="e.g. VillaWiFi-Guest"
        @update:model-value="update({ ssid: $event })"
      />
    </div>

    <div>
      <Label>Password</Label>
      <div class="flex gap-2">
        <Input
          :type="showPassword ? 'text' : 'password'"
          :model-value="modelValue.password ?? ''"
          @update:model-value="update({ password: $event })"
        />
        <Button
          variant="outline"
          size="icon"
          type="button"
          aria-label="Toggle password visibility"
          @click="showPassword = !showPassword"
        >
          <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
        </Button>
      </div>
    </div>

    <div class="flex items-center justify-between rounded-md border p-3">
      <div>
        <Label>Show password by default</Label>
        <p class="mt-1 text-xs text-muted-foreground">Reveal the password to guests without toggling.</p>
      </div>
      <Switch
        :model-value="!!modelValue.showPasswordByDefault"
        @update:model-value="update({ showPasswordByDefault: $event })"
      />
    </div>

    <div>
      <Label>Network notes</Label>
      <Textarea
        :model-value="modelValue.networkNotes ?? ''"
        rows="3"
        placeholder="e.g. 5GHz available, signal strongest near living room"
        @update:model-value="update({ networkNotes: $event })"
      />
    </div>
  </div>
</template>
