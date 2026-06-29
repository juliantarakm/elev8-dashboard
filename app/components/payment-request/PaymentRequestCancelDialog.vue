<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { open, requestId } = defineProps<{
  open: boolean
  requestId: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [payload: { id: string, reason: string }]
}>()

const reasons = [
  'Guest already paid via another method',
  'Wrong amount/currency',
  'Wrong guest/listing',
  'Duplicate link',
  'Booking canceled/changed',
] as const

const selectedReason = ref<string>('')
const otherNote = ref('')

watch(() => open, (val) => {
  if (val) {
    selectedReason.value = ''
    otherNote.value = ''
  }
})

const isOther = computed(() => selectedReason.value === 'Other')

const canConfirm = computed(() => {
  if (!selectedReason.value)
    return false
  if (isOther.value && !otherNote.value.trim())
    return false
  return true
})

function handleConfirm() {
  if (!requestId || !canConfirm.value)
    return
  const reason = isOther.value ? otherNote.value.trim() : selectedReason.value
  emit('confirm', { id: requestId, reason })
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Delete payment link</DialogTitle>
        <DialogDescription>
          This will invalidate the link. It won't issue a refund or change the reservation status.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-3">
        <Label class="text-sm font-medium">Reason for Deletion</Label>
        <RadioGroup v-model="selectedReason" class="space-y-2">
          <div v-for="reason in reasons" :key="reason" class="flex items-center gap-2">
            <RadioGroupItem :id="reason" :value="reason" />
            <Label :for="reason" class="font-normal cursor-pointer text-sm">{{ reason }}</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem id="other" value="Other" />
            <Label for="other" class="font-normal cursor-pointer text-sm">Other (requires note)</Label>
          </div>
        </RadioGroup>

        <div v-if="isOther" class="pl-6">
          <Textarea
            v-model="otherNote"
            placeholder="Enter reason..."
            class="min-h-[80px] text-sm"
          />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button variant="destructive" :disabled="!canConfirm" @click="handleConfirm">
          Delete Link
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
