<script setup lang="ts">
import type { PhysicalKey } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { staffMembers } from '~/components/inbox/data/conversations'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName } from './data/keys'

const { open, keyItem } = defineProps<{
  open: boolean
  keyItem: PhysicalKey | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { handoverKey } = useKeyManagement()

const toStaffId = ref('')
const note = ref('')

watch(() => open, (val) => {
  if (val) {
    toStaffId.value = ''
    note.value = ''
  }
})

const canSubmit = computed(() => !!toStaffId.value && toStaffId.value !== keyItem?.holderStaffId)

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')
const currentHolder = computed(() => staffMembers.find(s => s.id === keyItem?.holderStaffId))

function handleSubmit() {
  if (!keyItem || !canSubmit.value)
    return
  const result = handoverKey(keyItem.id, toStaffId.value, note.value.trim() || undefined)
  if (!result.success) {
    toast.error(result.error ?? 'Handover failed.')
    return
  }
  const staffName = staffMembers.find(s => s.id === toStaffId.value)?.name
  toast.success(`${keyName.value} handed over to ${staffName}.`)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Hand over key</DialogTitle>
        <DialogDescription>
          {{ keyName }} — currently held by {{ currentHolder?.name ?? '—' }}.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="handover-staff">Hand over to</Label>
          <Select v-model="toStaffId">
            <SelectTrigger id="handover-staff">
              <SelectValue placeholder="Select staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in staffMembers" :key="s.id" :value="s.id">
                {{ s.name }} · {{ s.role }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="handover-note">Note (optional)</Label>
          <Textarea id="handover-note" v-model="note" placeholder="e.g. Made passed it to Wayan for the next shift" class="min-h-[80px] text-sm" />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          Hand over
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
