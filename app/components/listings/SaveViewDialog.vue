<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [name: string]
}>()

const viewName = ref('')

watch(() => props.open, (open) => {
  if (open) {
    viewName.value = ''
  }
})

function handleSave() {
  const trimmed = viewName.value.trim()
  if (trimmed.length === 0 || trimmed.length > 50)
    return

  emit('save', trimmed)
  emit('update:open', false)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Save current view</DialogTitle>
        <DialogDescription>
          Give your view a name to save your current filters and settings.
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <Input
          v-model="viewName"
          placeholder="e.g., Seminyak Villas"
          maxlength="50"
          @keydown.enter="handleSave"
        />
        <p class="text-xs text-muted-foreground mt-2">
          {{ viewName.length }}/50 characters
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="viewName.trim().length === 0"
          @click="handleSave"
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
