<script setup lang="ts">
import type { KeyType } from './data/keys'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { keyTypeLabels } from './data/keys'

const { open } = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { registerKey, keyBoxes } = useKeyManagement()

const listingId = ref('')
const type = ref<KeyType | ''>('')
const label = ref('')
const copies = ref(1)
const location = ref<'office' | 'key_box'>('office')
const keyBoxId = ref('')

watch(() => open, (val) => {
  if (val) {
    listingId.value = ''
    type.value = ''
    label.value = ''
    copies.value = 1
    location.value = 'office'
    keyBoxId.value = ''
  }
})

const typeOptions = computed(() =>
  Object.entries(keyTypeLabels).map(([value, label]) => ({ value, label })),
)

const boxesForListing = computed(() =>
  keyBoxes.value.filter(b => b.listingId === listingId.value),
)

const canSubmit = computed(() => {
  if (!listingId.value || !type.value || copies.value < 1)
    return false
  if (location.value === 'key_box' && !keyBoxId.value)
    return false
  return true
})

function handleSubmit() {
  if (!canSubmit.value)
    return
  const result = registerKey({
    listingId: listingId.value,
    type: type.value as KeyType,
    label: label.value.trim() || undefined,
    copies: copies.value,
    location: location.value,
    keyBoxId: location.value === 'key_box' ? keyBoxId.value : undefined,
  })
  if (!result.success) {
    toast.error(result.error ?? 'Failed to register key.')
    return
  }
  const count = result.keys!.length
  toast.success(`${count} key ${count > 1 ? 'copies' : 'copy'} registered.`)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Register keys</DialogTitle>
        <DialogDescription>
          Add physical key copies for a listing.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label for="reg-listing">Listing</Label>
          <Select v-model="listingId">
            <SelectTrigger id="reg-listing">
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
          <Label for="reg-type">Key type</Label>
          <Select v-model="type">
            <SelectTrigger id="reg-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="reg-label">Label (optional)</Label>
          <Input id="reg-label" v-model="label" placeholder="e.g. Kitchen door" />
        </div>

        <div class="space-y-2">
          <Label for="reg-copies">Copies</Label>
          <Input id="reg-copies" v-model.number="copies" type="number" min="1" max="20" />
        </div>

        <div class="space-y-2">
          <Label>Storage location</Label>
          <RadioGroup v-model="location" class="space-y-2">
            <div class="flex items-center gap-2">
              <RadioGroupItem id="loc-office" value="office" />
              <Label for="loc-office" class="cursor-pointer text-sm font-normal">Office / storage</Label>
            </div>
            <div class="flex items-center gap-2">
              <RadioGroupItem id="loc-keybox" value="key_box" />
              <Label for="loc-keybox" class="cursor-pointer text-sm font-normal">Key box at the property</Label>
            </div>
          </RadioGroup>
        </div>

        <div v-if="location === 'key_box'" class="space-y-2">
          <Label for="reg-keybox">Key box</Label>
          <Select v-if="boxesForListing.length" v-model="keyBoxId">
            <SelectTrigger id="reg-keybox">
              <SelectValue placeholder="Select key box" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="box in boxesForListing" :key="box.id" :value="box.id">
                {{ box.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-else class="text-sm text-muted-foreground">
            No key boxes for this listing yet — add one in the Key Boxes tab.
          </p>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!canSubmit" @click="handleSubmit">
          Register
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
