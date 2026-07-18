<script setup lang="ts">
import type { PhysicalKey } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName } from './data/keys'

const { open, keyItem } = defineProps<{
  open: boolean
  keyItem: PhysicalKey | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { markKeyLost, replaceKey } = useKeyManagement()

const note = ref('')
const replaceNow = ref(true)

watch(() => open, (val) => {
  if (val) {
    note.value = ''
    replaceNow.value = true
  }
})

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')

function handleSubmit() {
  if (!keyItem)
    return
  const lostResult = markKeyLost(keyItem.id, note.value.trim() || undefined)
  if (!lostResult.success) {
    toast.error(lostResult.error ?? 'Failed to mark key as lost.')
    return
  }
  if (replaceNow.value) {
    const replaceResult = replaceKey(keyItem.id)
    if (replaceResult.success)
      toast.success(`${keyName.value} marked lost — replacement registered.`)
    else
      toast.error(replaceResult.error ?? 'Key marked lost, but replacement failed.')
  }
  else {
    toast.success(`${keyName.value} marked as lost.`)
  }
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Mark key as lost</DialogTitle>
        <DialogDescription>
          {{ keyName }} — this ends its custody. You can register a replacement right away.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="lost-note">Note (optional)</Label>
          <Textarea id="lost-note" v-model="note" placeholder="e.g. Lost during cleaning round" class="min-h-[80px] text-sm" />
        </div>

        <label class="flex cursor-pointer items-center gap-2">
          <Checkbox v-model="replaceNow" />
          <span class="text-sm">Register a replacement copy now</span>
        </label>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button variant="destructive" @click="handleSubmit">
          Mark lost
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
