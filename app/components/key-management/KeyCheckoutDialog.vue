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

const { checkoutKey, checkOverdueKeys } = useKeyManagement()

const staffId = ref('')
const expectedReturn = ref('')
const note = ref('')

watch(() => open, (val) => {
  if (val) {
    staffId.value = ''
    expectedReturn.value = ''
    note.value = ''
  }
})

const canSubmit = computed(() => !!staffId.value)

const keyName = computed(() => keyItem ? getKeyDisplayName(keyItem) : '')

function handleSubmit() {
  if (!keyItem || !canSubmit.value)
    return
  const iso = expectedReturn.value ? new Date(expectedReturn.value).toISOString() : undefined
  const result = checkoutKey(keyItem.id, staffId.value, iso, note.value.trim() || undefined)
  if (!result.success) {
    toast.error(result.error ?? 'Checkout failed.')
    return
  }
  checkOverdueKeys()
  const staffName = staffMembers.find(s => s.id === staffId.value)?.name
  toast.success(`${keyName.value} checked out to ${staffName}.`)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Check out key</DialogTitle>
        <DialogDescription>
          {{ keyName }} — assign it to a staff member.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="checkout-staff">Staff member</Label>
          <Select v-model="staffId">
            <SelectTrigger id="checkout-staff">
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
          <Label for="checkout-expected">Expected return (optional)</Label>
          <Input id="checkout-expected" v-model="expectedReturn" type="datetime-local" />
          <p class="text-xs text-muted-foreground">
            Leave empty for 24 hours from now. Overdue keys trigger an alert.
          </p>
        </div>

        <div class="space-y-2">
          <Label for="checkout-note">Note (optional)</Label>
          <Textarea id="checkout-note" v-model="note" placeholder="e.g. Guest lockout assistance" class="min-h-[80px] text-sm" />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          Check out
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
