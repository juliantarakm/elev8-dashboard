<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import ShareDialog from './ShareDialog.vue'

const props = defineProps<{
  open: boolean
  guideId: string
}>()

defineEmits<{ 'update:open': [v: boolean] }>()

const { guides } = useGuestGuides()
const { issueLink, findByReservation } = useGuestGuideLinks()
const { conversations } = useInbox()

const selectedReservationId = ref<string>('')
const shareDialogOpen = ref(false)
const issuedUrl = ref('')

const reservationsFromConversations = computed(() => {
  return conversations.value
    .filter(c => c.reservationId)
    .map(c => ({
      id: c.reservationId!,
      label: `${c.guestName} - ${c.listingName} (${c.checkIn} -> ${c.checkOut})`,
    }))
})

const selectedReservation = computed(() => {
  return conversations.value.find(c => c.reservationId === selectedReservationId.value)
})

watch(() => props.open, (open) => {
  if (open) {
    selectedReservationId.value = ''
    shareDialogOpen.value = false
  }
})

async function handleSend() {
  if (!selectedReservation.value) {
    toast.error('Please select a reservation')
    return
  }
  const guide = guides.value.find(g => g.id === props.guideId)
  if (!guide) {
    toast.error('Guide not found')
    return
  }
  if (findByReservation(selectedReservation.value.reservationId!)) {
    toast.error('A guide link already exists for this reservation')
    return
  }
  try {
    const link = issueLink({
      guideId: guide.id,
      reservationId: selectedReservation.value.reservationId!,
      listingId: selectedReservation.value.listingName ?? '',
      guestName: selectedReservation.value.guestName,
      guestEmail: undefined,
      guestPhone: undefined,
      guestLanguage: selectedReservation.value.guestLanguage,
      channel: 'manual',
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    })
    issuedUrl.value = `https://guide.elev8-suite.com/${link.token}`
    shareDialogOpen.value = true
    toast.success(`Guide link generated for ${link.guestName}`)
  } catch (err: any) {
    toast.error(err.message ?? 'Failed to issue link')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Send Guide Link</DialogTitle>
        <DialogDescription>Choose a reservation to generate a tokenized guest guide link for.</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">Reservation</label>
          <Select v-model="selectedReservationId">
            <SelectTrigger>
              <SelectValue placeholder="Select a reservation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="r in reservationsFromConversations" :key="r.id" :value="r.id">
                {{ r.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          Cancel
        </Button>
        <Button :disabled="!selectedReservationId" @click="handleSend">
          Generate link
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ShareDialog
    v-if="issuedUrl"
    v-model:open="shareDialogOpen"
    :url="issuedUrl"
    :guest-name="selectedReservation?.guestName ?? ''"
  />
</template>