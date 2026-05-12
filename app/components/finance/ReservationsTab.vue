<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { useReservations } from '@/composables/useReservations'
import { useJurnal } from '@/composables/useJurnal'

const {
  reservations,
  unsyncedCount,
  isPushingReservations,
  lastReservationSync,
  pushReservations,
} = useReservations()

const {
  isConnected: jurnalConnected,
  formatDate,
} = useJurnal()

// ── Filters ────────────────────────────────────────────────────────────────
const df = new DateFormatter('en-GB', { day: 'numeric', month: 'short' })
const BALI_KEYWORDS = ['Tambora', 'Kalmantan', 'Pererenan', 'Sinabung', 'Merapi', 'Sanur', 'Ubud', 'Canggu']

function getTag(listing: string) {
  return BALI_KEYWORDS.some(k => listing.includes(k)) ? 'Bali' : 'Switzerland'
}

const filterListing = ref('all')
const filterChannel = ref('all')
const filterSynced = ref('all')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateRange = ref<any>(undefined)
const filterDateFrom = ref('')
const filterDateTo = ref('')

watch(dateRange, (range) => {
  filterDateFrom.value = range?.start ? range.start.toString() : ''
  filterDateTo.value = range?.end ? range.end.toString() : ''
})

const uniqueListings = computed(() =>
  [...new Set(reservations.value.map(r => r.listing))].sort(),
)

const filteredReservations = computed(() => {
  return reservations.value.filter((r) => {
    if (filterListing.value !== 'all' && r.listing !== filterListing.value) return false
    if (filterChannel.value !== 'all' && r.channel !== filterChannel.value) return false
    if (filterSynced.value === 'synced' && !r.synced) return false
    if (filterSynced.value === 'unsynced' && r.synced) return false
    if (filterDateFrom.value && r.checkIn < filterDateFrom.value) return false
    if (filterDateTo.value && r.checkIn > filterDateTo.value) return false
    return true
  })
})

function clearFilters() {
  filterListing.value = 'all'
  filterChannel.value = 'all'
  filterSynced.value = 'all'
  dateRange.value = undefined
  filterDateFrom.value = ''
  filterDateTo.value = ''
}

// ── Row selection ──────────────────────────────────────────────────────────
function rowKey(id: string, checkIn: string) {
  return `${id}:${checkIn}`
}

const selected = ref<Set<string>>(new Set())

const allFilteredKeys = computed(() =>
  filteredReservations.value.map(r => rowKey(r.id, r.checkIn)),
)

const allSelected = computed(
  () => allFilteredKeys.value.length > 0
    && allFilteredKeys.value.every(k => selected.value.has(k)),
)

const someSelected = computed(
  () => !allSelected.value && allFilteredKeys.value.some(k => selected.value.has(k)),
)

function toggleAll() {
  if (allSelected.value) {
    const next = new Set(selected.value)
    allFilteredKeys.value.forEach(k => next.delete(k))
    selected.value = next
  }
  else {
    const next = new Set(selected.value)
    allFilteredKeys.value.forEach(k => next.add(k))
    selected.value = next
  }
}

function toggleRow(id: string, checkIn: string) {
  const key = rowKey(id, checkIn)
  const next = new Set(selected.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  selected.value = next
}

const selectedWithInvoice = computed(() =>
  filteredReservations.value.filter(
    r => selected.value.has(rowKey(r.id, r.checkIn)) && r.invoice,
  ),
)

const selectedCount = computed(() =>
  allFilteredKeys.value.filter(k => selected.value.has(k)).length,
)

// ── Actions ────────────────────────────────────────────────────────────────
async function handlePushNow() {
  await pushReservations()
  toast.success('All reservations pushed to Jurnal.')
}

function downloadSingleInvoice(invoice: string, guest: string) {
  const content = `Invoice: ${invoice}\nGuest: ${guest}\nGenerated: ${new Date().toLocaleString()}`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = invoice
  a.click()
  URL.revokeObjectURL(url)
}

function downloadBulkInvoices() {
  const invoices = selectedWithInvoice.value
  if (invoices.length === 0) {
    toast.info('No invoices available in selection.')
    return
  }
  invoices.forEach(r => downloadSingleInvoice(r.invoice!, r.guest))
  toast.success(`${invoices.length} invoice${invoices.length > 1 ? 's' : ''} downloaded.`)
}

function exportCSV() {
  const headers = ['ID', 'Guest', 'Listing', 'Channel', 'Check-in', 'Check-out', 'Nights', 'Guests', 'Amount (CHF)', 'Status', 'Invoice', 'Synced']
  const rows = filteredReservations.value.map(r => [
    r.id, r.guest, r.listing, r.channel,
    r.checkIn, r.checkOut, r.nights, r.guests,
    r.amount, r.status, r.invoice ?? '', r.synced ? 'Yes' : 'No',
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reservations-export.csv'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported.')
}

// ── Display helpers ────────────────────────────────────────────────────────
function formatCHF(amount: number) {
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const channelIcon: Record<string, string> = {
  'Booking.com': 'i-lucide-globe',
  'Airbnb': 'i-lucide-home',
  'Direct': 'i-lucide-link',
}

const statusClass: Record<string, string> = {
  'Confirmed': 'text-green-700 bg-green-50',
  'In Progress': 'text-blue-700 bg-blue-50',
  'Pending': 'text-amber-700 bg-amber-50',
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Sync banner -->
    <div
      v-if="!jurnalConnected"
      class="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-off" class="h-4 w-4 shrink-0 text-amber-600" />
      <p class="flex-1 text-sm text-amber-800">
        No accounting integration connected. Reservations won't be synced until you connect Jurnal.
      </p>
      <NuxtLink to="/finance?tab=integrations">
        <Button variant="outline" size="sm" class="h-7 border-amber-300 bg-white text-amber-800 hover:bg-amber-100">
          Connect
        </Button>
      </NuxtLink>
    </div>

    <div
      v-else-if="unsyncedCount > 0"
      class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-upload" class="h-4 w-4 shrink-0 text-blue-600" />
      <p class="flex-1 text-sm text-blue-800">
        <span class="font-medium">{{ unsyncedCount }} {{ unsyncedCount === 1 ? 'reservation' : 'reservations' }}</span>
        not yet synced to Jurnal.
        <span v-if="lastReservationSync" class="text-blue-600"> Last sync: {{ formatDate(lastReservationSync) }}.</span>
      </p>
      <Button
        size="sm"
        class="h-7 bg-blue-600 text-white hover:bg-blue-700"
        :disabled="isPushingReservations"
        @click="handlePushNow"
      >
        <Icon
          v-if="isPushingReservations"
          name="i-lucide-loader-2"
          class="mr-1.5 h-3.5 w-3.5 animate-spin"
        />
        <Icon v-else name="i-lucide-upload" class="mr-1.5 h-3.5 w-3.5" />
        {{ isPushingReservations ? 'Pushing…' : 'Push now' }}
      </Button>
    </div>

    <div
      v-else
      class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-check" class="h-4 w-4 shrink-0 text-green-600" />
      <p class="flex-1 text-sm text-green-800">
        All reservations synced to Jurnal.
        <span v-if="lastReservationSync" class="text-green-600"> Last sync: {{ formatDate(lastReservationSync) }}.</span>
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3">
      <!-- Listing -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Listing</label>
        <Select v-model="filterListing">
          <SelectTrigger class="h-8 w-52 text-sm">
            <SelectValue placeholder="All listings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All listings</SelectItem>
            <SelectItem v-for="l in uniqueListings" :key="l" :value="l">
              {{ l }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Channel -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Channel</label>
        <Select v-model="filterChannel">
          <SelectTrigger class="h-8 w-36 text-sm">
            <SelectValue placeholder="All channels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="Booking.com">Booking.com</SelectItem>
            <SelectItem value="Airbnb">Airbnb</SelectItem>
            <SelectItem value="Direct">Direct</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Sync status -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Sync</label>
        <Select v-model="filterSynced">
          <SelectTrigger class="h-8 w-36 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="synced">Synced</SelectItem>
            <SelectItem value="unsynced">Not synced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Date range -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Check-in range</label>
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              class="h-8 w-48 justify-start text-left text-sm font-normal"
              :class="!dateRange?.start && 'text-muted-foreground'"
            >
              <Icon name="i-lucide-calendar" class="mr-2 h-3.5 w-3.5 shrink-0" />
              <span class="truncate">
                <template v-if="dateRange?.start && dateRange?.end">
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }} – {{ df.format(dateRange.end.toDate(getLocalTimeZone())) }}
                </template>
                <template v-else-if="dateRange?.start">
                  {{ df.format(dateRange.start.toDate(getLocalTimeZone())) }}
                </template>
                <template v-else>Pick a date range</template>
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <RangeCalendar
              v-model="dateRange"
              weekday-format="short"
              :number-of-months="2"
              initial-focus
            />
          </PopoverContent>
        </Popover>
      </div>

      <!-- Clear -->
      <Button variant="ghost" size="sm" class="h-8 self-end" @click="clearFilters">
        Clear filters
      </Button>

      <!-- Bulk + Export (right-aligned) -->
      <div class="ml-auto flex items-end gap-2">
        <Button
          v-if="selectedWithInvoice.length > 0"
          variant="outline"
          size="sm"
          class="h-8"
          @click="downloadBulkInvoices"
        >
          <Icon name="i-lucide-archive-restore" class="mr-2 h-4 w-4" />
          Download {{ selectedWithInvoice.length }} invoice{{ selectedWithInvoice.length > 1 ? 's' : '' }}
        </Button>
        <Button variant="outline" size="sm" class="h-8" @click="exportCSV">
          <Icon name="i-lucide-download" class="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </div>

    <!-- Selection info bar -->
    <div v-if="selectedCount > 0" class="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
      <Icon name="i-lucide-check-square" class="h-4 w-4" />
      <span>{{ selectedCount }} row{{ selectedCount > 1 ? 's' : '' }} selected</span>
      <span v-if="selectedWithInvoice.length > 0" class="text-foreground">
        — {{ selectedWithInvoice.length }} with invoice{{ selectedWithInvoice.length > 1 ? 's' : '' }}
      </span>
      <button class="ml-2 text-xs underline hover:text-foreground" @click="selected = new Set()">
        Clear selection
      </button>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-10 px-3">
                <Checkbox
                  :checked="allSelected ? true : someSelected ? 'indeterminate' : false"
                  aria-label="Select all"
                  @update:checked="toggleAll"
                />
              </TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead class="w-16 text-center">Nights</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead class="w-20 text-center">Invoice</TableHead>
              <TableHead class="w-20 text-center">Synced</TableHead>
              <TableHead class="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="filteredReservations.length === 0">
              <TableCell colspan="11" class="py-12 text-center text-sm text-muted-foreground">
                No reservations match the selected filters.
              </TableCell>
            </TableRow>
            <TableRow
              v-for="res in filteredReservations"
              v-else
              :key="rowKey(res.id, res.checkIn)"
              class="cursor-pointer hover:bg-muted/50"
              :class="selected.has(rowKey(res.id, res.checkIn)) && 'bg-muted/40'"
              @click="toggleRow(res.id, res.checkIn)"
            >
              <TableCell class="px-3" @click.stop>
                <Checkbox
                  :checked="selected.has(rowKey(res.id, res.checkIn))"
                  aria-label="Select row"
                  @update:checked="toggleRow(res.id, res.checkIn)"
                />
              </TableCell>
              <TableCell class="font-medium">{{ res.guest }}</TableCell>
              <TableCell class="max-w-44 truncate text-muted-foreground" :title="res.listing">
                {{ res.listing }}
              </TableCell>
              <TableCell>
                <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon :name="channelIcon[res.channel] ?? 'i-lucide-link'" class="h-3.5 w-3.5" />
                  {{ res.channel }}
                </span>
              </TableCell>
              <TableCell class="tabular-nums text-muted-foreground">{{ res.checkIn }}</TableCell>
              <TableCell class="text-center tabular-nums">{{ res.nights }}</TableCell>
              <TableCell class="text-right font-semibold tabular-nums">{{ formatCHF(res.amount) }}</TableCell>
              <TableCell>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass[res.status]">
                  {{ res.status }}
                </span>
              </TableCell>
              <TableCell class="text-center">
                <Icon
                  v-if="res.invoice"
                  name="i-lucide-paperclip"
                  class="mx-auto h-4 w-4 text-muted-foreground"
                  :title="res.invoice"
                />
                <span v-else class="text-xs text-muted-foreground">—</span>
              </TableCell>
              <TableCell class="text-center">
                <Icon
                  v-if="res.synced"
                  name="i-lucide-cloud-check"
                  class="mx-auto h-4 w-4 text-green-500"
                  title="Synced"
                />
                <Icon
                  v-else
                  name="i-lucide-cloud-off"
                  class="mx-auto h-4 w-4 text-muted-foreground"
                  title="Not synced"
                />
              </TableCell>
              <TableCell @click.stop>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Row actions">
                      <Icon name="i-lucide-ellipsis" class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      v-if="res.invoice"
                      @click="downloadSingleInvoice(res.invoice!, res.guest)"
                    >
                      <Icon name="i-lucide-download" class="mr-2 h-4 w-4" />
                      Download invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Icon name="i-lucide-eye" class="mr-2 h-4 w-4" />
                      View detail
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
