<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

const props = defineProps<{
  open: boolean
  targetViewName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleCancel">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Unsaved changes</DialogTitle>
        <DialogDescription>
          You have unsaved changes to your current view. Switching to "{{ targetViewName }}" will discard these changes.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          Stay here
        </Button>
        <Button
          @click="handleConfirm"
        >
          Switch anyway
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>