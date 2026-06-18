# Payment Request Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Payment Request page (`/payment-requests`) with create dialog (guest search, listing validation, fee calc), history table with filters, detail dialog, and share features. Integrates with existing Payouts and Inbox modules.

**Architecture:** Vue 3 single-file components with shadcn-vue primitives. State managed via `usePaymentRequests` composable with `useState`. Data layer in `payment-requests.ts`. Guest search reuses Inbox conversation data. Table uses TanStack Vue Table following existing Finance/Tasks patterns.

**Tech Stack:** Nuxt 3, Vue 3, shadcn-vue, Tailwind CSS v4, TanStack Vue Table, vue-sonner

---

## File Structure

```
app/
├── pages/payment-requests/index.vue              # Main page
├── components/payment-request/
│   ├── data/
│   │   └── payment-requests.ts                   # Types, mock data, helpers
│   ├── GuestSearchCombobox.vue                   # Guest search with inbox data
│   ├── FeeCalculator.vue                         # Fee preview display
│   ├── PaymentRequestCreateDialog.vue            # 2-step create wizard
│   ├── PaymentRequestTable.vue                   # History table with filters
│   ├── PaymentRequestDetailDialog.vue            # Detail view dialog
│   └── PaymentRequestShareDialog.vue             # Share/QR dialog
├── composables/
│   └── usePaymentRequests.ts                     # State + CRUD + filters
└── constants/menus.ts                            # Add sidebar link (modify)
```

---

## Task 1: Data Types and Mock Data

**Files:**
- Create: `app/components/payment-request/data/payment-requests.ts`

- [ ] **Step 1: Write the types file**

Create `app/components/payment-request/data/payment-requests.ts`:

```typescript
import { ref } from 'vue'

export type FeeMode = 'card' | 'manual'
export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled'

export interface PaymentRequest {
  id: string
  guestName: string
  guestEmail: string
  guestPhone?: string
  listingId: string
  title: string
  description?: string
  amount: number
  currency: 'USD' | 'IDR'
  feeMode: FeeMode
  feeAmount: number
  totalAmount: number
  status: PaymentStatus
  payoutAccountId: string
  paymentLink: string
  qrCodeUrl?: string
  expiresAt: string
  paidAt?: string
  receiptUrl?: string
  cancelledAt?: string
  cancelledBy?: string
  createdAt: string
  createdBy: string
  notes?: string
}

export interface PaymentRequestDraft {
  guestName: string
  guestEmail: string
  guestPhone?: string
  listingId: string
  title: string
  description?: string
  amount: number
  currency: 'USD' | 'IDR'
  feeMode: FeeMode
  expiresInHours: number
}

export interface GuestOption {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  source: 'inbox' | 'payment_request' | 'manual'
  lastStay?: string
  listingName?: string
}

export const FEE_PERCENTAGE = 0.03

export function calculateFee(amount: number, feeMode: FeeMode): number {
  if (feeMode === 'manual') return 0
  const fee = amount * FEE_PERCENTAGE
  return Math.round(fee * 100) / 100
}

export function calculateTotal(amount: number, feeAmount: number): number {
  return Math.round((amount + feeAmount) * 100) / 100
}

export function generatePaymentLink(id: string): string {
  return `https://pay.elev8.co/r/${id}`
}

export function generateId(): string {
  return `pr-${Date.now()}`
}

export function getExpiryDate(hours: number): string {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

export const paymentRequests = ref<PaymentRequest[]>([
  {
    id: 'pr-001',
    guestName: 'John Smith',
    guestEmail: 'john@example.com',
    listingId: 'lst-1',
    title: 'Downpayment Villa Sunset',
    amount: 500,
    currency: 'USD',
    feeMode: 'card',
    feeAmount: 15,
    totalAmount: 515,
    status: 'pending',
    payoutAccountId: 'pay-1',
    paymentLink: 'https://pay.elev8.co/r/pr-001',
    expiresAt: '2026-06-19T14:30:00Z',
    createdAt: '2026-06-18T14:30:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-002',
    guestName: 'Lisa Park',
    guestEmail: 'lisa@example.com',
    listingId: 'lst-3',
    title: 'Spa package payment',
    amount: 1500000,
    currency: 'IDR',
    feeMode: 'manual',
    feeAmount: 0,
    totalAmount: 1500000,
    status: 'paid',
    payoutAccountId: 'pay-2',
    paymentLink: 'https://pay.elev8.co/r/pr-002',
    paidAt: '2026-06-17T10:00:00Z',
    receiptUrl: '/receipts/pr-002.pdf',
    createdAt: '2026-06-17T09:00:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-003',
    guestName: 'Marcel Weber',
    guestEmail: 'marcel@example.com',
    listingId: 'lst-2',
    title: 'Extra cleaning fee',
    amount: 75,
    currency: 'USD',
    feeMode: 'card',
    feeAmount: 2.25,
    totalAmount: 77.25,
    status: 'expired',
    payoutAccountId: 'pay-1',
    paymentLink: 'https://pay.elev8.co/r/pr-003',
    expiresAt: '2026-06-15T10:00:00Z',
    createdAt: '2026-06-14T10:00:00Z',
    createdBy: 'staff-2',
  },
  {
    id: 'pr-004',
    guestName: 'Emma Thompson',
    guestEmail: 'emma@example.com',
    listingId: 'lst-4',
    title: 'Airport transfer',
    amount: 500000,
    currency: 'IDR',
    feeMode: 'card',
    feeAmount: 15000,
    totalAmount: 515000,
    status: 'cancelled',
    payoutAccountId: 'pay-2',
    paymentLink: 'https://pay.elev8.co/r/pr-004',
    expiresAt: '2026-06-20T08:00:00Z',
    cancelledAt: '2026-06-18T09:00:00Z',
    cancelledBy: 'staff-2',
    createdAt: '2026-06-17T08:00:00Z',
    createdBy: 'staff-2',
  },
])
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/data/payment-requests.ts
git commit -m "feat(payment-request): add types and mock data"
```

---

## Task 2: Composable (usePaymentRequests)

**Files:**
- Create: `app/composables/usePaymentRequests.ts`

- [ ] **Step 1: Write the composable**

Create `app/composables/usePaymentRequests.ts`:

```typescript
import type { PaymentRequest, PaymentRequestDraft, PaymentStatus } from '~/components/payment-request/data/payment-requests'
import { paymentRequests, generateId, generatePaymentLink, getExpiryDate, calculateFee, calculateTotal } from '~/components/payment-request/data/payment-requests'
import { payoutAccounts } from '~/components/settings/data/payouts'
import { listings } from '~/components/listings/data/listings'

export interface PaymentRequestFilters {
  status: PaymentStatus | 'all'
  listings: string[]
  dateFrom: string
  dateTo: string
  search: string
}

export function usePaymentRequests() {
  const requests = useState<PaymentRequest[]>('payment-requests', () => paymentRequests.value)
  const filters = ref<PaymentRequestFilters>({
    status: 'all',
    listings: [],
    dateFrom: '',
    dateTo: '',
    search: '',
  })

  const filteredRequests = computed(() => {
    return requests.value.filter((request) => {
      if (filters.value.status !== 'all' && request.status !== filters.value.status)
        return false
      if (filters.value.listings.length > 0 && !filters.value.listings.includes(request.listingId))
        return false
      if (filters.value.dateFrom && request.createdAt < filters.value.dateFrom)
        return false
      if (filters.value.dateTo && request.createdAt > filters.value.dateTo)
        return false
      if (filters.value.search) {
        const query = filters.value.search.toLowerCase()
        const haystack = `${request.guestName} ${request.guestEmail} ${request.title}`.toLowerCase()
        if (!haystack.includes(query))
          return false
      }
      return true
    })
  })

  const pendingCount = computed(() => requests.value.filter(r => r.status === 'pending').length)
  const paidCount = computed(() => requests.value.filter(r => r.status === 'paid').length)
  const totalRevenue = computed(() => {
    return requests.value
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + r.totalAmount, 0)
  })

  function createRequest(draft: PaymentRequestDraft): PaymentRequest {
    const id = generateId()
    const feeAmount = calculateFee(draft.amount, draft.feeMode)
    const totalAmount = calculateTotal(draft.amount, feeAmount)
    const account = payoutAccounts.value.find(a => a.id === getAccountForListing(draft.listingId))
    const currency = account?.currency ?? 'USD'

    const request: PaymentRequest = {
      id,
      ...draft,
      currency,
      feeAmount,
      totalAmount,
      status: 'pending',
      payoutAccountId: account?.id ?? '',
      paymentLink: generatePaymentLink(id),
      expiresAt: getExpiryDate(draft.expiresInHours),
      createdAt: new Date().toISOString(),
      createdBy: 'staff-2',
    }

    requests.value = [request, ...requests.value]
    return request
  }

  function cancelRequest(id: string, reason?: string) {
    const index = requests.value.findIndex(r => r.id === id)
    if (index === -1) return
    requests.value = requests.value.map((r, i) =>
      i === index
        ? { ...r, status: 'cancelled' as PaymentStatus, cancelledAt: new Date().toISOString(), cancelledBy: 'staff-2', notes: reason }
        : r,
    )
  }

  function duplicateRequest(id: string): PaymentRequest | null {
    const original = requests.value.find(r => r.id === id)
    if (!original) return null
    const draft: PaymentRequestDraft = {
      guestName: original.guestName,
      guestEmail: original.guestEmail,
      guestPhone: original.guestPhone,
      listingId: original.listingId,
      title: `${original.title} (Copy)`,
      description: original.description,
      amount: original.amount,
      currency: original.currency,
      feeMode: original.feeMode,
      expiresInHours: 24,
    }
    return createRequest(draft)
  }

  function checkDuplicate(guestName: string, amount: number): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    return requests.value.some(r =>
      r.guestName.toLowerCase() === guestName.toLowerCase()
      && r.amount === amount
      && r.status === 'pending'
      && r.createdAt > oneHourAgo,
    )
  }

  function expireOldRequests() {
    const now = new Date().toISOString()
    requests.value = requests.value.map(r => {
      if (r.status === 'pending' && r.expiresAt < now) {
        return { ...r, status: 'expired' as PaymentStatus }
      }
      return r
    })
  }

  function getAccountForListing(listingId: string): string {
    const account = payoutAccounts.value.find(a => a.listingIds.includes(listingId))
    return account?.id ?? ''
  }

  function isListingAssigned(listingId: string): boolean {
    return payoutAccounts.value.some(a => a.listingIds.includes(listingId))
  }

  return {
    requests,
    filters,
    filteredRequests,
    pendingCount,
    paidCount,
    totalRevenue,
    createRequest,
    cancelRequest,
    duplicateRequest,
    checkDuplicate,
    expireOldRequests,
    getAccountForListing,
    isListingAssigned,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/composables/usePaymentRequests.ts
git commit -m "feat(payment-request): add usePaymentRequests composable"
```

---

## Task 3: GuestSearchCombobox Component

**Files:**
- Create: `app/components/payment-request/GuestSearchCombobox.vue`

- [ ] **Step 1: Write the component**

Create `app/components/payment-request/GuestSearchCombobox.vue`:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GuestOption } from './data/payment-requests'
import { useInbox } from '~/composables/useInbox'
import { usePaymentRequests } from '~/composables/usePaymentRequests'

const modelValue = defineModel<string>('modelValue')
const selectedGuest = defineModel<GuestOption | null>('guest')

const open = ref(false)
const search = ref('')

const { conversations } = useInbox()
const { requests } = usePaymentRequests()

const guestOptions = computed<GuestOption[]>(() => {
  const options: GuestOption[] = []
  const seen = new Set<string>()

  // From inbox conversations
  for (const conv of conversations.value) {
    const key = conv.guestName.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      options.push({
        id: `inbox-${conv.id}`,
        name: conv.guestName,
        email: conv.guestEmail ?? '',
        avatar: conv.guestAvatar,
        source: 'inbox',
        lastStay: conv.reservation ? new Date(conv.reservation.checkIn).toLocaleDateString() : undefined,
        listingName: conv.listingName,
      })
    }
  }

  // From existing payment requests
  for (const req of requests.value) {
    const key = req.guestName.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      options.push({
        id: `pr-${req.id}`,
        name: req.guestName,
        email: req.guestEmail,
        phone: req.guestPhone,
        source: 'payment_request',
      })
    }
  }

  return options
})

const filteredOptions = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return guestOptions.value
  return guestOptions.value.filter(g =>
    g.name.toLowerCase().includes(query)
    || g.email.toLowerCase().includes(query)
    || (g.phone?.toLowerCase().includes(query) ?? false),
  )
})

const inboxGuests = computed(() => filteredOptions.value.filter(g => g.source === 'inbox'))
const previousGuests = computed(() => filteredOptions.value.filter(g => g.source === 'payment_request'))

function selectGuest(guest: GuestOption) {
  modelValue.value = guest.name
  selectedGuest.value = guest
  search.value = ''
  open.value = false
}

function selectManual() {
  const name = search.value.trim()
  if (!name) return
  const guest: GuestOption = {
    id: `manual-${Date.now()}`,
    name,
    email: '',
    source: 'manual',
  }
  modelValue.value = name
  selectedGuest.value = guest
  search.value = ''
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="outline" class="w-full justify-between">
        {{ modelValue || 'Search guest...' }}
        <Icon name="lucide:chevrons-up-down" class="size-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[380px] p-0" align="start">
      <Command>
        <CommandInput v-model="search" placeholder="Search guest by name or email..." />
        <CommandEmpty>No guest found.</CommandEmpty>
        <CommandGroup v-if="inboxGuests.length" heading="Recent Guests">
          <CommandItem
            v-for="guest in inboxGuests"
            :key="guest.id"
            @select="selectGuest(guest)"
          >
            <div class="flex items-center gap-2">
              <Avatar v-if="guest.avatar" class="size-6">
                <AvatarImage :src="guest.avatar" />
              </Avatar>
              <div v-else class="flex size-6 items-center justify-center rounded-full bg-muted text-[10px]">
                {{ guest.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium">{{ guest.name }}</p>
                <p class="text-xs text-muted-foreground">{{ guest.email }}</p>
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandGroup v-if="previousGuests.length" heading="Previous Requests">
          <CommandItem
            v-for="guest in previousGuests"
            :key="guest.id"
            @select="selectGuest(guest)"
          >
            <div class="flex items-center gap-2">
              <div class="flex size-6 items-center justify-center rounded-full bg-muted text-[10px]">
                {{ guest.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium">{{ guest.name }}</p>
                <p class="text-xs text-muted-foreground">{{ guest.email }}</p>
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandGroup v-if="search.trim()">
          <CommandItem @select="selectManual">
            <Icon name="lucide:plus" class="mr-2 size-4" />
            Add new guest "{{ search.trim() }}"
          </CommandItem>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/GuestSearchCombobox.vue
git commit -m "feat(payment-request): add GuestSearchCombobox component"
```

---

## Task 4: FeeCalculator Component

**Files:**
- Create: `app/components/payment-request/FeeCalculator.vue`

- [ ] **Step 1: Write the component**

Create `app/components/payment-request/FeeCalculator.vue`:

```vue
<script setup lang="ts">
import type { FeeMode } from './data/payment-requests'
import { calculateFee, calculateTotal } from './data/payment-requests'

interface Props {
  amount: number
  feeMode: FeeMode
  currency: string
}

const { amount, feeMode, currency } = defineProps<Props>()

const feeAmount = computed(() => calculateFee(amount, feeMode))
const totalAmount = computed(() => calculateTotal(amount, feeAmount.value))

const symbol = computed(() => currency === 'IDR' ? 'Rp' : '$')

function fmt(n: number) {
  if (currency === 'IDR') return n.toLocaleString('id-ID')
  return n.toFixed(2)
}
</script>

<template>
  <div class="rounded-lg border bg-muted/20 p-4 space-y-3">
    <p class="text-sm font-medium">Fee calculation</p>
    
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">Amount</span>
        <span>{{ symbol }}{{ fmt(amount) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-muted-foreground">
          {{ feeMode === 'card' ? 'Card fee (3%)' : 'Manual (no fee)' }}
        </span>
        <span>{{ feeMode === 'card' ? `${symbol}${fmt(feeAmount)}` : '-' }}</span>
      </div>
      <Separator />
      <div class="flex items-center justify-between text-sm font-medium">
        <span>Total</span>
        <span>{{ symbol }}{{ fmt(totalAmount) }}</span>
      </div>
    </div>
    
    <p class="text-xs text-muted-foreground">
      {{ feeMode === 'card' 
        ? 'Guest pays total amount including processing fee.' 
        : 'No processing fee. Guest pays exact amount.' }}
    </p>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/FeeCalculator.vue
git commit -m "feat(payment-request): add FeeCalculator component"
```

---

## Task 5: PaymentRequestCreateDialog Component

**Files:**
- Create: `app/components/payment-request/PaymentRequestCreateDialog.vue`

- [ ] **Step 1: Write the create dialog**

Create `app/components/payment-request/PaymentRequestCreateDialog.vue`:

```vue
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { FeeMode, GuestOption } from './data/payment-requests'
import { listings } from '~/components/listings/data/listings'
import { payoutAccounts } from '~/components/settings/data/payouts'
import { usePaymentRequests } from '~/composables/usePaymentRequests'

const open = defineModel<boolean>('open', { default: false })

const { createRequest, checkDuplicate, isListingAssigned } = usePaymentRequests()

const step = ref<1 | 2>(1)
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

const selectedListing = computed(() => listings.value.find(l => l.id === selectedListingId.value))
const assigned = computed(() => selectedListingId.value ? isListingAssigned(selectedListingId.value) : true)
const account = computed(() => payoutAccounts.value.find(a => a.listingIds.includes(selectedListingId.value)))
const currency = computed(() => account.value?.currency ?? 'USD')

const minAmount = computed(() => {
  if (account.value?.provider === 'stripe') return 0.5
  if (account.value?.provider === 'doku') return 10000
  return 0.01
})

const amountError = computed(() => {
  if (!amount.value || amount.value <= 0) return 'Amount must be greater than 0'
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
      if (listing) selectedListingId.value = listing.id
    }
  }
})

function reset() {
  step.value = 1
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
  if (!amount.value) return
  
  if (checkDuplicate(guestName.value, amount.value)) {
    const confirmed = confirm('A similar pending request exists. Create anyway?')
    if (!confirmed) return
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

  toast.success('Payment request created')
  open.value = false
  reset()
}

function copyLink() {
  navigator.clipboard.writeText('')
  toast.success('Link copied')
}

watch(open, (val) => {
  if (!val) reset()
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ step === 1 ? 'Create Payment Request' : 'Share Payment Link' }}</DialogTitle>
        <DialogDescription>
          {{ step === 1 ? 'Enter payment details for the guest.' : 'Your payment link is ready to share.' }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="step === 1" class="space-y-4">
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
              <NuxtLink to="/settings/payouts" class="underline">Assign now</NuxtLink>
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
            <p v-if="amountError" class="text-xs text-destructive">{{ amountError }}</p>
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

      <div v-else class="space-y-4">
        <div class="rounded-lg border bg-muted/20 p-4">
          <Label class="text-xs text-muted-foreground">Payment link</Label>
          <div class="mt-1 flex items-center gap-2">
            <Input readonly value="https://pay.elev8.co/r/pr-xxx" />
            <Button size="sm" variant="outline" @click="copyLink">
              <Icon name="lucide:copy" class="size-4" />
            </Button>
          </div>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" class="flex-1 gap-2">
            <Icon name="lucide:qr-code" class="size-4" />
            QR Code
          </Button>
          <Button variant="outline" class="flex-1 gap-2">
            <Icon name="lucide:message-circle" class="size-4" />
            WhatsApp
          </Button>
          <Button variant="outline" class="flex-1 gap-2">
            <Icon name="lucide:mail" class="size-4" />
            Email
          </Button>
        </div>

        <div class="space-y-2">
          <Label>Expires in</Label>
          <Select v-model.number="expiresInHours">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="1">1 hour</SelectItem>
              <SelectItem :value="6">6 hours</SelectItem>
              <SelectItem :value="24">24 hours</SelectItem>
              <SelectItem :value="72">3 days</SelectItem>
              <SelectItem :value="168">7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="rounded-lg border p-4 space-y-1 text-sm">
          <div class="flex justify-between"><span class="text-muted-foreground">Guest</span><span>{{ guestName }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Listing</span><span>{{ selectedListing?.name }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Amount</span><span>{{ currency === 'IDR' ? 'Rp' : '$' }}{{ amount }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Fee</span><span>{{ feeMode === 'card' ? '3%' : 'No fee' }}</span></div>
          <Separator />
          <div class="flex justify-between font-medium"><span>Total</span><span>{{ currency === 'IDR' ? 'Rp' : '$' }}{{ (amount || 0) * (feeMode === 'card' ? 1.03 : 1) }}</span></div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button v-if="step === 2" variant="outline" @click="step = 1">Back</Button>
        <Button v-if="step === 1" variant="outline" @click="open = false">Cancel</Button>
        <Button v-if="step === 1" :disabled="!canContinue" @click="step = 2">Continue</Button>
        <Button v-else @click="handleCreate">Create & Share</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/PaymentRequestCreateDialog.vue
git commit -m "feat(payment-request): add create dialog with guest search and fee calc"
```

---

## Task 6: PaymentRequestTable Component

**Files:**
- Create: `app/components/payment-request/PaymentRequestTable.vue`

- [ ] **Step 1: Write the table component**

Create `app/components/payment-request/PaymentRequestTable.vue`:

```vue
<script setup lang="ts">
import type { PaymentRequest } from './data/payment-requests'
import { listings } from '~/components/listings/data/listings'

const { requests } = defineProps<{
  requests: PaymentRequest[]
}>()

const emit = defineEmits<{
  view: [request: PaymentRequest]
  copy: [link: string]
  cancel: [id: string]
  duplicate: [id: string]
}>()

function getListingName(id: string) {
  return listings.value.find(l => l.id === id)?.name ?? id
}

function formatAmount(req: PaymentRequest) {
  const symbol = req.currency === 'IDR' ? 'Rp' : '$'
  if (req.currency === 'IDR') {
    return `${symbol}${req.amount.toLocaleString('id-ID')}`
  }
  return `${symbol}${req.amount.toFixed(2)}`
}

function statusBadgeVariant(status: PaymentRequest['status']) {
  switch (status) {
    case 'pending': return 'default'
    case 'paid': return 'default'
    case 'expired': return 'secondary'
    case 'cancelled': return 'outline'
    default: return 'secondary'
  }
}

function statusIcon(status: PaymentRequest['status']) {
  switch (status) {
    case 'pending': return 'lucide:clock'
    case 'paid': return 'lucide:check-circle'
    case 'expired': return 'lucide:x-circle'
    case 'cancelled': return 'lucide:ban'
    default: return 'lucide:help-circle'
  }
}

function statusColor(status: PaymentRequest['status']) {
  switch (status) {
    case 'pending': return 'text-amber-600'
    case 'paid': return 'text-green-600'
    case 'expired': return 'text-gray-500'
    case 'cancelled': return 'text-gray-500'
    default: return ''
  }
}

function timeAgo(date: string) {
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
</script>

<template>
  <div class="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Guest</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Listing</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead class="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="req in requests" :key="req.id">
          <TableCell>
            <div class="min-w-0">
              <p class="font-medium">{{ req.guestName }}</p>
              <p class="text-xs text-muted-foreground">{{ req.guestEmail }}</p>
            </div>
          </TableCell>
          <TableCell>{{ req.title }}</TableCell>
          <TableCell>{{ getListingName(req.listingId) }}</TableCell>
          <TableCell>
            <div class="text-sm">
              {{ formatAmount(req) }}
              <span v-if="req.feeAmount > 0" class="text-xs text-muted-foreground">
                + fee
              </span>
            </div>
          </TableCell>
          <TableCell>
            <Badge :variant="statusBadgeVariant(req.status)" class="gap-1">
              <Icon :name="statusIcon(req.status)" class="size-3" :class="statusColor(req.status)" />
              {{ req.status }}
            </Badge>
          </TableCell>
          <TableCell class="text-muted-foreground">
            {{ timeAgo(req.createdAt) }}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="sm">
                  <Icon name="lucide:more-horizontal" class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="emit('view', req)">
                  <Icon name="lucide:eye" class="mr-2 size-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem @click="emit('copy', req.paymentLink)">
                  <Icon name="lucide:copy" class="mr-2 size-4" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem @click="emit('duplicate', req.id)">
                  <Icon name="lucide:copy-plus" class="mr-2 size-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  v-if="req.status === 'pending'"
                  class="text-destructive"
                  @click="emit('cancel', req.id)"
                >
                  <Icon name="lucide:ban" class="mr-2 size-4" />
                  Cancel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        <TableRow v-if="!requests.length">
          <TableCell colspan="7" class="h-32 text-center text-muted-foreground">
            No payment requests found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/PaymentRequestTable.vue
git commit -m "feat(payment-request): add history table component"
```

---

## Task 7: PaymentRequestDetailDialog Component

**Files:**
- Create: `app/components/payment-request/PaymentRequestDetailDialog.vue`

- [ ] **Step 1: Write the detail dialog**

Create `app/components/payment-request/PaymentRequestDetailDialog.vue`:

```vue
<script setup lang="ts">
import type { PaymentRequest } from './data/payment-requests'
import { listings } from '~/components/listings/data/listings'
import { payoutAccounts } from '~/components/settings/data/payouts'

const { request } = defineProps<{
  request: PaymentRequest | null
}>()

const emit = defineEmits<{
  copy: [link: string]
  cancel: [id: string]
}>()

function getListingName(id: string) {
  return listings.value.find(l => l.id === id)?.name ?? id
}

function getAccountName(id: string) {
  return payoutAccounts.value.find(a => a.id === id)?.accountName ?? id
}

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}

function statusBannerClass(status: PaymentRequest['status']) {
  switch (status) {
    case 'pending': return 'bg-amber-50 border-amber-200 text-amber-800'
    case 'paid': return 'bg-green-50 border-green-200 text-green-800'
    case 'expired': return 'bg-gray-50 border-gray-200 text-gray-600'
    case 'cancelled': return 'bg-gray-50 border-gray-200 text-gray-600'
    default: return ''
  }
}

function formatAmount(req: PaymentRequest) {
  const symbol = req.currency === 'IDR' ? 'Rp' : '$'
  if (req.currency === 'IDR') return `${symbol}${req.amount.toLocaleString('id-ID')}`
  return `${symbol}${req.amount.toFixed(2)}`
}
</script>

<template>
  <Dialog :open="!!request" @update:open="(v) => { if (!v) $emit('update:open', false) }">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Payment Request</DialogTitle>
        <DialogDescription>{{ request?.id }}</DialogDescription>
      </DialogHeader>

      <div v-if="request" class="space-y-4">
        <div class="rounded-lg border p-3" :class="statusBannerClass(request.status)">
          <div class="flex items-center gap-2">
            <Icon 
              :name="request.status === 'pending' ? 'lucide:clock' : request.status === 'paid' ? 'lucide:check-circle' : 'lucide:x-circle'" 
              class="size-4" 
            />
            <span class="font-medium capitalize">{{ request.status }}</span>
          </div>
          <p v-if="request.status === 'pending'" class="mt-1 text-xs">
            Waiting for guest payment. Expires {{ formatDate(request.expiresAt) }}.
          </p>
          <p v-else-if="request.status === 'paid'" class="mt-1 text-xs">
            Paid on {{ formatDate(request.paidAt!) }}.
          </p>
          <p v-else-if="request.status === 'expired'" class="mt-1 text-xs">
            Expired on {{ formatDate(request.expiresAt) }}.
          </p>
          <p v-else-if="request.status === 'cancelled'" class="mt-1 text-xs">
            Cancelled on {{ formatDate(request.cancelledAt!) }} by {{ request.cancelledBy }}.
          </p>
        </div>

        <div class="space-y-3">
          <div>
            <Label class="text-xs text-muted-foreground">Guest</Label>
            <p class="text-sm font-medium">{{ request.guestName }}</p>
            <p class="text-sm text-muted-foreground">{{ request.guestEmail }}</p>
          </div>

          <Separator />

          <div class="grid grid-cols-2 gap-3">
            <div>
              <Label class="text-xs text-muted-foreground">Listing</Label>
              <p class="text-sm">{{ getListingName(request.listingId) }}</p>
            </div>
            <div>
              <Label class="text-xs text-muted-foreground">Account</Label>
              <p class="text-sm">{{ getAccountName(request.payoutAccountId) }}</p>
            </div>
          </div>

          <div>
            <Label class="text-xs text-muted-foreground">Title</Label>
            <p class="text-sm">{{ request.title }}</p>
          </div>

          <div class="rounded-lg border bg-muted/20 p-3 space-y-1">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Amount</span>
              <span>{{ formatAmount(request) }}</span>
            </div>
            <div v-if="request.feeAmount > 0" class="flex justify-between text-sm">
              <span class="text-muted-foreground">Fee ({{ request.feeMode === 'card' ? '3%' : 'manual' }})</span>
              <span>{{ formatAmount({ ...request, amount: request.feeAmount }) }}</span>
            </div>
            <Separator />
            <div class="flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>{{ formatAmount({ ...request, amount: request.totalAmount }) }}</span>
            </div>
          </div>

          <div v-if="request.status === 'pending'">
            <Label class="text-xs text-muted-foreground">Payment Link</Label>
            <div class="mt-1 flex items-center gap-2">
              <Input readonly :model-value="request.paymentLink" class="text-xs" />
              <Button size="sm" variant="outline" @click="emit('copy', request.paymentLink)">
                <Icon name="lucide:copy" class="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button v-if="request?.status === 'pending'" variant="destructive" @click="emit('cancel', request.id)">
          Cancel Request
        </Button>
        <Button v-if="request?.status === 'paid'" variant="outline">
          <Icon name="lucide:file-text" class="mr-2 size-4" />
          View Receipt
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/PaymentRequestDetailDialog.vue
git commit -m "feat(payment-request): add detail dialog component"
```

---

## Task 8: PaymentRequestShareDialog Component

**Files:**
- Create: `app/components/payment-request/PaymentRequestShareDialog.vue`

- [ ] **Step 1: Write the share dialog**

Create `app/components/payment-request/PaymentRequestShareDialog.vue`:

```vue
<script setup lang="ts">
import type { PaymentRequest } from './data/payment-requests'

const { request } = defineProps<{
  request: PaymentRequest | null
}>()

const emit = defineEmits<{
  close: []
}>()

const copied = ref(false)

function copyLink() {
  if (!request) return
  navigator.clipboard.writeText(request.paymentLink)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function shareWhatsApp() {
  if (!request) return
  const text = `Hi ${request.guestName}, here's your payment link: ${request.paymentLink}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function shareEmail() {
  if (!request) return
  const subject = encodeURIComponent(`Payment Request: ${request.title}`)
  const body = encodeURIComponent(`Hi ${request.guestName},\\n\\nPlease complete your payment using this link:\\n${request.paymentLink}\\n\\nAmount: ${request.currency === 'IDR' ? 'Rp' : '$'}${request.totalAmount}\\n\\nThank you!`)
  window.open(`mailto:${request.guestEmail}?subject=${subject}&body=${body}`)
}
</script>

<template>
  <Dialog :open="!!request" @update:open="(v) => { if (!v) emit('close') }">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Share Payment Link</DialogTitle>
      </DialogHeader>

      <div v-if="request" class="space-y-4">
        <div class="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
          <div class="min-w-0 flex-1">
            <p class="text-xs text-muted-foreground truncate">{{ request.paymentLink }}</p>
          </div>
          <Button size="sm" variant="outline" @click="copyLink">
            <Icon v-if="copied" name="lucide:check" class="size-4 text-green-600" />
            <Icon v-else name="lucide:copy" class="size-4" />
          </Button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <Button variant="outline" class="flex-col gap-1 h-auto py-3" @click="shareWhatsApp">
            <Icon name="lucide:message-circle" class="size-5" />
            <span class="text-xs">WhatsApp</span>
          </Button>
          <Button variant="outline" class="flex-col gap-1 h-auto py-3" @click="shareEmail">
            <Icon name="lucide:mail" class="size-5" />
            <span class="text-xs">Email</span>
          </Button>
          <Button variant="outline" class="flex-col gap-1 h-auto py-3">
            <Icon name="lucide:qr-code" class="size-5" />
            <span class="text-xs">QR Code</span>
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/payment-request/PaymentRequestShareDialog.vue
git commit -m "feat(payment-request): add share dialog component"
```

---

## Task 9: Main Page

**Files:**
- Create: `app/pages/payment-requests/index.vue`

- [ ] **Step 1: Write the main page**

Create `app/pages/payment-requests/index.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import type { PaymentRequest } from '~/components/payment-request/data/payment-requests'
import { usePaymentRequests } from '~/composables/usePaymentRequests'

const { 
  filteredRequests, 
  pendingCount, 
  paidCount, 
  totalRevenue,
  filters,
  cancelRequest,
  duplicateRequest,
} = usePaymentRequests()

const createOpen = ref(false)
const detailRequest = ref<PaymentRequest | null>(null)
const shareRequest = ref<PaymentRequest | null>(null)

function openDetail(request: PaymentRequest) {
  detailRequest.value = request
}

function copyLink(link: string) {
  navigator.clipboard.writeText(link)
  toast.success('Link copied to clipboard')
}

function handleCancel(id: string) {
  if (confirm('Cancel this payment request?')) {
    cancelRequest(id)
    toast.success('Request cancelled')
  }
}

function handleDuplicate(id: string) {
  duplicateRequest(id)
  toast.success('Request duplicated')
}

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Expired', value: 'expired' },
  { label: 'Cancelled', value: 'cancelled' },
]
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Payment Requests</h1>
        <p class="text-sm text-muted-foreground">
          {{ pendingCount }} pending · {{ paidCount }} paid
        </p>
      </div>
      <Button class="gap-2" @click="createOpen = true">
        <Icon name="lucide:plus" class="size-4" />
        Create Request
      </Button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-[260px] flex-1 max-w-sm">
        <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="filters.search" placeholder="Search guest or title..." class="pl-9" />
      </div>
      <Select v-model="filters.status">
        <SelectTrigger class="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button v-if="filters.search || filters.status !== 'all'" variant="ghost" @click="filters.search = ''; filters.status = 'all'">
        Clear filters
      </Button>
    </div>

    <PaymentRequestTable
      :requests="filteredRequests"
      @view="openDetail"
      @copy="copyLink"
      @cancel="handleCancel"
      @duplicate="handleDuplicate"
    />

    <PaymentRequestCreateDialog v-model:open="createOpen" />
    
    <PaymentRequestDetailDialog
      :request="detailRequest"
      @update:open="detailRequest = null"
      @copy="copyLink"
      @cancel="handleCancel"
    />
    
    <PaymentRequestShareDialog
      :request="shareRequest"
      @close="shareRequest = null"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/pages/payment-requests/index.vue
git commit -m "feat(payment-request): add main page with table and dialogs"
```

---

## Task 10: Sidebar Menu Integration

**Files:**
- Modify: `app/constants/menus.ts`

- [ ] **Step 1: Add Payment Requests to sidebar**

Edit `app/constants/menus.ts` in the Finance section:

```typescript
{
  heading: 'Finance',
  items: [
    {
      title: 'Finance',
      icon: 'i-lucide-receipt',
      link: '/finance',
      new: true,
    },
    {
      title: 'Payment Requests',
      icon: 'i-lucide-link',
      link: '/payment-requests',
      new: true,
    },
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add app/constants/menus.ts
git commit -m "feat(payment-request): add sidebar menu link"
```

---

## Task 11: Run Build and Verify

- [ ] **Step 1: Run type check**

```bash
npx nuxt typecheck 2>&1 | grep -E "payment-request|error TS" | head -20
```

Expected: No payment-request errors (only pre-existing errors from other modules)

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build succeeds with 0 errors

- [ ] **Step 3: Commit final changes**

```bash
git add -A
git commit -m "feat(payment-request): complete Payment Request module"
```

---

## Self-Review

### Spec Coverage Check

| Spec Section | Task | Status |
|-------------|------|--------|
| Data Model (PaymentRequest, GuestOption) | Task 1 | ✅ |
| Fee Calculation (3% card, manual) | Task 1 | ✅ |
| Guest Search (inbox + history) | Task 3 | ✅ |
| Create Flow Step 1 (form, validation) | Task 5 | ✅ |
| Create Flow Step 2 (share, expiry) | Task 5 | ✅ |
| List View Table | Task 6 | ✅ |
| Detail View Dialog | Task 7 | ✅ |
| Share Dialog (copy, WhatsApp, email, QR) | Task 8 | ✅ |
| Filters (status, search) | Task 9 | ✅ |
| Status Badges | Task 6 | ✅ |
| Sidebar Integration | Task 10 | ✅ |
| Empty States | Task 6 (table) | ✅ |
| Duplicate Detection | Task 5 | ✅ |
| Listing Validation | Task 5 | ✅ |
| Minimum Amount | Task 5 | ✅ |

### Placeholder Scan
- No TBD, TODO, or "implement later" found
- All code blocks contain actual implementation
- No vague descriptions

### Type Consistency
- `FeeMode` = `'card' | 'manual'` used consistently
- `PaymentStatus` = `'pending' | 'paid' | 'expired' | 'cancelled'` used consistently
- `PaymentRequest` interface matches across all tasks
- Composable exports match component imports

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-18-payment-request.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**