<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  open: boolean
  viewName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  rename: [name: string]
}>()

const newName = ref('')

watch(() => props.open, (open) => {
  if (open) {
    newName.value = props.viewName
  }
})

function handleRename() {
  const trimmed = newName.value.trim()
  if (trimmed.length === 0 || trimmed.length > 50) return

  emit('rename', trimmed)
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
        <DialogTitle>Rename view</DialogTitle>
        <DialogDescription>
          Change the name of "{{ viewName }}".
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <Input
          v-model="newName"
          placeholder="e.g., Seminyak Villas"
          maxlength="50"
          @keydown.enter="handleRename"
        />
        <p class="text-xs text-muted-foreground mt-2">
          {{ newName.length }}/50 characters
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Cancel
        </Button>
        <Button
          type="submit"
          :disabled="newName.trim().length === 0"
          @click="handleRename"
        >
          Rename
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>