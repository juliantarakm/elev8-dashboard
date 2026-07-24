<script setup lang="ts">
// My Stays page — owner-portal entry point for owner reservations and
// personal-use blocks. Renders the PortalReservationCalendar under a page
// layout that surfaces the "new owner reservation" create flow.

import { ref } from 'vue'
import type { OwnerReservation } from '~/components/owners/data/owner-reservations'
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import { mockOwnerReservations } from '~/components/owners/data/owner-reservations-seed'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { toast } from 'vue-sonner'
import PortalReservationCalendar from '~/components/owner-portal/PortalReservationCalendar.vue'
import PortalOwnerReservationPopover from '~/components/owner-portal/PortalOwnerReservationPopover.vue'

definePageMeta({
  layout: 'owner-portal',
})

const { currentOwner, myOwnerIds, listings } = useOwnerPortal()
void currentOwner
void myOwnerIds
void listings

// Local state for the create dialog — the calendar emits the intent
// (date range + listing); the parent captures the optional note and
// emits a synthetic owner_block reservation back into the seed array
// so the calendar re-renders with the new bar.
const calendarAnchor = ref<Date>(new Date())
const createOpen = ref(false)
const createListingId = ref<string | null>(null)
const createCheckIn = ref('')
const createCheckOut = ref('')
const createNote = ref('')
const localReservations = ref<OwnerReservation[]>([])

const reservations = computed<OwnerReservation[]>(() => {
  const base = mockOwnerReservations
  return [...base, ...localReservations.value]
})

function startCreate(payload: { checkIn: string, checkOut: string, listingId?: string }) {
  if (!payload.listingId) {
    toast.error('No listing available for this owner.')
    return
  }
  createListingId.value = payload.listingId
  createCheckIn.value = payload.checkIn ?? todayISO()
  createCheckOut.value = payload.checkOut ?? addDaysISO(createCheckIn.value, 2)
  createNote.value = ''
  createOpen.value = true
}

function confirmCreate() {
  if (!createCheckIn.value || !createCheckOut.value || !createListingId.value) {
    toast.error('Pick a check-in and check-out date.')
    return
  }
  if (createCheckOut.value <= createCheckIn.value) {
    toast.error('Check-out must be after check-in.')
    return
  }
  const id = `or-local-${Date.now().toString(36)}`
  localReservations.value = [
    ...localReservations.value,
    {
      id,
      type: 'owner_block',
      listingId: createListingId.value,
      note: createNote.value.trim() || 'Owner block',
      checkIn: createCheckIn.value,
      checkOut: createCheckOut.value,
      status: 'confirmed',
    },
  ]
  toast.success('Owner block created.')
  createOpen.value = false
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(iso: string, days: number) {
  const next = new Date(`${iso}T00:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

const popoverOpen = ref(false)
const selectedReservation = ref<OwnerReservation | null>(null)

function openReservation(reservation: OwnerReservation) {
  selectedReservation.value = reservation
  popoverOpen.value = true
}
</script>

<template>
  <div class="flex min-h-0 flex-col gap-6 p-4 sm:p-6 lg:p-8">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          My Stays
        </h1>
        <p class="text-sm text-muted-foreground">
          See upcoming guest reservations and block out dates for your own personal stays.
        </p>
      </div>
      <Button
        class="self-start rounded-full bg-emerald-100 px-4 text-emerald-900 hover:bg-emerald-200 sm:self-auto"
        @click="startCreate({ checkIn: todayISO(), checkOut: addDaysISO(todayISO(), 2) })"
      >
        <Icon name="lucide:plus" class="mr-1.5 size-4" />
        New owner reservation
      </Button>
    </header>

    <Card v-if="!reservations.length">
      <CardContent class="flex flex-col items-center gap-2 p-12 text-center text-sm text-muted-foreground">
        <Icon name="lucide:calendar-off" class="size-8 opacity-50" />
        <p>No reservations on your properties yet.</p>
        <Button size="sm" @click="startCreate({ checkIn: todayISO(), checkOut: addDaysISO(todayISO(), 2) })">
          Block your first dates
        </Button>
      </CardContent>
    </Card>

    <PortalReservationCalendar
      v-else
      v-model:anchor="calendarAnchor"
      :reservations="reservations"
      @create-owner-reservation="startCreate"
      @edit-owner-reservation="openReservation"
      @remove-owner-reservation="(res) => { localReservations = localReservations.filter(r => r.id !== res.id); toast.info('Owner block removed.') }"
    />

    <Dialog v-model:open="createOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            New owner reservation
          </DialogTitle>
          <DialogDescription>
            Block out dates for your own personal stay. These nights will be removed from guest availability.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="owner-stay-checkin">Check-in</Label>
              <Input
                id="owner-stay-checkin"
                v-model="createCheckIn"
                type="date"
              />
            </div>
            <div class="space-y-1.5">
              <Label for="owner-stay-checkout">Check-out</Label>
              <Input
                id="owner-stay-checkout"
                v-model="createCheckOut"
                type="date"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <Label for="owner-stay-note">Note (optional)</Label>
            <Input
              id="owner-stay-note"
              v-model="createNote"
              placeholder="e.g. Family visit"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="createOpen = false">
            Cancel
          </Button>
          <Button @click="confirmCreate">
            Create block
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <PortalOwnerReservationPopover
      v-model:open="popoverOpen"
      :reservation="selectedReservation"
      @edit="(res) => { selectedReservation = res; popoverOpen = false; toast.info('Editing owner block: ' + (res.note ?? res.id)) }"
      @remove="(res) => { localReservations = localReservations.filter(r => r.id !== res.id); popoverOpen = false; toast.info('Owner block removed.') }"
    />
  </div>
</template>
