<script setup lang="ts">
import type { FeeMode, GuestOption } from './data/payment-requests'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import { payoutAccounts } from '~/components/settings/data/payouts'
import { usePaymentRequests } from '~/composables/usePaymentRequests'
import FeeCalculator from './FeeCalculator.vue'
import GuestSearchCombobox from './GuestSearchCombobox.vue'

const emit = defineEmits<{
  created: [request: PaymentRequest]
}>()

const open = defineModel<boolean>('open', { default: false })

const { createRequest, checkDuplicate, isListingAssigned } = usePaymentRequests()

const guestName = ref('')
const guestEmail = ref('')
const guestPhone = ref('')
const selectedGuest = ref<GuestOption | null>(null)
const selectedListingId = ref('')
const title = ref('')
const description = ref('')
const amount = ref<number | null>(null)
const feeMode = ref<FeeMode>('card')
const expiresInHours = ref(24)

const assigned = computed(() => selectedListingId.value ? isListingAssigned(selectedListingId.value) : true)
const account = computed(() => payoutAccounts.value.find(a => a.listingIds.includes(selectedListingId.value)))
const currency = computed(() => account.value?.currency ?? 'USD')

const minAmount = computed(() => {
  if (account.value?.provider === 'stripe')
    return 0.5
  if (account.value?.provider === 'doku')
    return 10000
  return 0.01
})

const amountError = computed(() => {
  if (!amount.value || amount.value <= 0)
    return 'Amount must be greater than 0'
  if (amount.value < minAmount.value) {
    const symbol = currency.value === 'IDR' ? 'Rp' : '$'
    return `Minimum amount is ${symbol}${minAmount.value}`
  }
  return ''
})

const canContinue = computed(() => {
  return guestName.value.trim().length >= 2
    && guestEmail.value.includes('@')
    && selectedListingId.value
    && title.value.trim().length >= 3
    && amount.value && amount.value > 0
    && amount.value >= minAmount.value
    && assigned.value
})

watch(selectedGuest, (guest) => {
  if (guest) {
    guestName.value = guest.name
    guestEmail.value = guest.email
    guestPhone.value = guest.phone ?? ''
    if (guest.listingName) {
      const listing = listings.value.find(l => l.name === guest.listingName)
      if (listing)
        selectedListingId.value = listing.id
    }
  }
})

function reset() {
  guestName.value = ''
  guestEmail.value = ''
  guestPhone.value = ''
  selectedGuest.value = null
  selectedListingId.value = ''
  title.value = ''
  description.value = ''
  amount.value = null
  feeMode.value = 'card'
  expiresInHours.value = 24
}

function handleCreate() {
  if (!amount.value)
    return

  if (checkDuplicate(guestName.value, amount.value)) {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('A similar pending request exists. Create anyway?')
    if (!confirmed)
      return
  }

  const request = createRequest({
    guestName: guestName.value,
    guestEmail: guestEmail.value,
    guestPhone: guestPhone.value || undefined,
    listingId: selectedListingId.value,
    title: title.value,
    description: description.value || undefined,
    amount: amount.value,
    currency: currency.value,
    feeMode: feeMode.value,
    expiresInHours: expiresInHours.value,
  })

  emit('created', request)
  toast.success('Payment request created')
  open.value = false
  reset()
}

watch(open, (val) => {
  if (!val)
    reset()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>Create Payment Request</DialogTitle>
        <DialogDescription>
          Enter payment details for the guest.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="space-y-2">
          <Label>Guest name *</Label>
          <GuestSearchCombobox
            v-model="guestName"
            v-model:guest="selectedGuest"
          />
        </div>

        <div class="space-y-2">
          <Label>Select Listing *</Label>
          <Select v-model="selectedListingId">
            <SelectTrigger>
              <SelectValue placeholder="Choose a property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="listing in listings" :key="listing.id" :value="listing.id">
                {{ listing.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Alert v-if="selectedListingId && !assigned" variant="destructive" class="text-xs">
            <Icon name="lucide:alert-circle" class="size-4" />
            <AlertTitle>Not assigned</AlertTitle>
            <AlertDescription>
              This listing has no payout account.
              <NuxtLink to="/settings/payouts" class="underline">
                Assign now
              </NuxtLink>
            </AlertDescription>
          </Alert>
          <p v-else-if="account" class="text-xs text-muted-foreground">
            Connected to: {{ account.accountName }} ({{ currency }})
          </p>
        </div>

        <div class="space-y-2">
          <Label>Payment title *</Label>
          <Input v-model="title" placeholder="e.g. Downpayment Villa Sunset" />
        </div>

        <div class="space-y-2">
          <Label>Description</Label>
          <Textarea v-model="description" placeholder="Internal notes..." />
        </div>

        <div class="space-y-2">
          <Label>Email for invoice *</Label>
          <Input v-model="guestEmail" type="email" placeholder="guest@example.com" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label>Amount *</Label>
            <Input v-model.number="amount" type="number" :min="minAmount" step="0.01" />
            <p v-if="amountError" class="text-xs text-destructive">
              {{ amountError }}
            </p>
          </div>
          <div class="space-y-2">
            <Label>Currency</Label>
            <Input :model-value="currency" disabled />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Fee mode</Label>
          <RadioGroup v-model="feeMode" class="flex gap-4">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="card" value="card" />
              <Label for="card" class="text-sm font-normal">Card (+3%)</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="manual" value="manual" />
              <Label for="manual" class="text-sm font-normal">Manual (no fee)</Label>
            </div>
          </RadioGroup>
        </div>

        <FeeCalculator
          :amount="amount || 0"
          :fee-mode="feeMode"
          :currency="currency"
        />
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button :disabled="!canContinue" @click="handleCreate">
          Create & Share
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
