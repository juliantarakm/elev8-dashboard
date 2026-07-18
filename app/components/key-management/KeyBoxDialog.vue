<script setup lang="ts">
import type { KeyBox } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'

const { open, keyBox } = defineProps<{
  open: boolean
  keyBox: KeyBox | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { addKeyBox, updateKeyBox } = useKeyManagement()

const listingId = ref('')
const name = ref('')
const location = ref('')
const pin = ref('')
const notes = ref('')

watch(() => open, (val) => {
  if (val) {
    listingId.value = keyBox?.listingId ?? ''
    name.value = keyBox?.name ?? ''
    location.value = keyBox?.location ?? ''
    pin.value = keyBox?.pin ?? ''
    notes.value = keyBox?.notes ?? ''
  }
})

const isEdit = computed(() => keyBox !== null)

const canSubmit = computed(() =>
  !!listingId.value && !!name.value.trim() && !!location.value.trim() && !!pin.value.trim(),
)

function handleSubmit() {
  if (!canSubmit.value)
    return
  if (isEdit.value) {
    const result = updateKeyBox(keyBox!.id, {
      listingId: listingId.value,
      name: name.value.trim(),
      location: location.value.trim(),
      pin: pin.value.trim(),
      notes: notes.value.trim() || undefined,
    })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to update key box.')
      return
    }
    toast.success('Key box updated.')
  }
  else {
    const result = addKeyBox({
      listingId: listingId.value,
      name: name.value,
      location: location.value,
      pin: pin.value,
      notes: notes.value,
    })
    if (!result.success) {
      toast.error(result.error ?? 'Failed to add key box.')
      return
    }
    toast.success('Key box added.')
  }
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? 'Edit key box' : 'Add key box' }}</DialogTitle>
        <DialogDescription>
          A lockbox at the property for self check-in and key storage.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="kb-listing">Listing</Label>
          <Select v-model="listingId">
            <SelectTrigger id="kb-listing">
              <SelectValue placeholder="Select listing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="l in listings" :key="l.id" :value="l.id">
                {{ l.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="kb-name">Name</Label>
          <Input id="kb-name" v-model="name" placeholder="e.g. Front gate lockbox" />
        </div>

        <div class="space-y-2">
          <Label for="kb-location">Location</Label>
          <Input id="kb-location" v-model="location" placeholder="e.g. Mounted on the left gate pillar" />
        </div>

        <div class="space-y-2">
          <Label for="kb-pin">PIN code</Label>
          <Input id="kb-pin" v-model="pin" placeholder="e.g. 4821" />
        </div>

        <div class="space-y-2">
          <Label for="kb-notes">Notes (optional)</Label>
          <Textarea id="kb-notes" v-model="notes" placeholder="e.g. Code changes monthly" class="min-h-[60px] text-sm" />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          {{ isEdit ? 'Save changes' : 'Add key box' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
