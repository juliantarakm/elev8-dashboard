<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useUpsells } from '@/composables/useUpsells'
import { useJurnal } from '@/composables/useJurnal'
import type { UpsellType, UpsellStatus } from '@/components/finance/data/upsells'

const {
  upsells,
  unsyncedCount,
  isPushingUpsells,
  lastUpsellSync,
  pushUpsells,
} = useUpsells()

const { isConnected: jurnalConnected, formatDate } = useJurnal()

// ── Filters ────────────────────────────────────────────────────────────────
const filterType = ref<'all' | UpsellType>('all')
const filterStatus = ref<'all' | UpsellStatus>('all')
const filterChannel = ref('all')
const filterSynced = ref('all')

const filteredUpsells = computed(() => {
  return upsells.value.filter((u) => {
    if (filterType.value !== 'all' && u.type !== filterType.value) return false
    if (filterStatus.value !== 'all' && u.status !== filterStatus.value) return false
    if (filterChannel.value !== 'all' && u.channel !== filterChannel.value) return false
    if (filterSynced.value === 'synced' && !u.synced) return false
    if (filterSynced.value === 'unsynced' && u.synced) return false
    return true
  })
})

function clearFilters() {
  filterType.value = 'all'
  filterStatus.value = 'all'
  filterChannel.value = 'all'
  filterSynced.value = 'all'
}

// ── Selection ──────────────────────────────────────────────────────────────
const selected = ref<string[]>([])

const allSelected = computed(() =>
  filteredUpsells.value.length > 0
  && filteredUpsells.value.every(u => selected.value.includes(u.id)),
)
const someSelected = computed(() =>
  !allSelected.value && filteredUpsells.value.some(u => selected.value.includes(u.id)),
)

function toggleAll() {
  if (allSelected.value) {
    selected.value = selected.value.filter(k => !filteredUpsells.value.some(u => u.id === k))
  }
  else {
    const toAdd = filteredUpsells.value.map(u => u.id).filter(k => !selected.value.includes(k))
    selected.value = [...selected.value, ...toAdd]
  }
}

function toggleRow(id: string) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter(k => k !== id)
  }
  else {
    selected.value = [...selected.value, id]
  }
}

const selectedWithInvoice = computed(() =>
  filteredUpsells.value.filter(u => selected.value.includes(u.id) && u.invoice),
)

const selectedCount = computed(() =>
  filteredUpsells.value.filter(u => selected.value.includes(u.id)).length,
)

// ── Actions ────────────────────────────────────────────────────────────────
async function handlePushNow() {
  await pushUpsells()
  toast.success('All paid upsells pushed to Jurnal.')
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
  invoices.forEach(u => downloadSingleInvoice(u.invoice!, u.guest))
  toast.success(`${invoices.length} invoice${invoices.length > 1 ? 's' : ''} downloaded.`)
}

function exportCSV() {
  const headers = ['ID', 'Date', 'Reservation', 'Guest', 'Listing', 'Channel', 'Type', 'Amount (CHF)', 'Status', 'Invoice', 'Synced']
  const rows = filteredUpsells.value.map(u => [
    u.id, u.date, u.reservationId, u.guest, u.listing, u.channel,
    u.type, u.amount, u.status, u.invoice ?? '', u.synced ? 'Yes' : 'No',
  ])
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'upsells-export.csv'
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported.')
}

// ── Display helpers ────────────────────────────────────────────────────────
function formatCHF(amount: number) {
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const typeClass: Record<string, string> = {
  'Early Check-in': 'text-sky-700 bg-sky-50',
  'Late Check-out': 'text-indigo-700 bg-indigo-50',
  'Airport Transfer': 'text-violet-700 bg-violet-50',
  'Breakfast Package': 'text-amber-700 bg-amber-50',
  'Welcome Package': 'text-pink-700 bg-pink-50',
  'Extra Cleaning': 'text-teal-700 bg-teal-50',
  'BBQ Setup': 'text-orange-700 bg-orange-50',
}

const statusClass: Record<string, string> = {
  'Paid': 'text-green-700 bg-green-50',
  'Pending': 'text-amber-700 bg-amber-50',
  'Cancelled': 'text-red-700 bg-red-50',
}

const channelIcon: Record<string, string> = {
  'Booking.com': 'i-lucide-globe',
  'Airbnb': 'i-lucide-home',
  'Direct': 'i-lucide-link',
}

const upsellTypes: UpsellType[] = [
  'Early Check-in', 'Late Check-out', 'Airport Transfer',
  'Breakfast Package', 'Welcome Package', 'Extra Cleaning', 'BBQ Setup',
]
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
        No accounting integration connected. Upsells won't be synced until you connect Jurnal.
      </p>
    </div>

    <div
      v-else-if="unsyncedCount > 0"
      class="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-upload" class="h-4 w-4 shrink-0 text-blue-600" />
      <p class="flex-1 text-sm text-blue-800">
        <span class="font-medium">{{ unsyncedCount }} paid upsell{{ unsyncedCount !== 1 ? 's' : '' }}</span>
        not yet synced to Jurnal.
        <span v-if="lastUpsellSync" class="text-blue-600"> Last sync: {{ formatDate(lastUpsellSync) }}.</span>
      </p>
      <Button
        size="sm"
        class="h-7 bg-blue-600 text-white hover:bg-blue-700"
        :disabled="isPushingUpsells"
        @click="handlePushNow"
      >
        <Icon
          v-if="isPushingUpsells"
          name="i-lucide-loader-2"
          class="mr-1.5 h-3.5 w-3.5 animate-spin"
        />
        <Icon v-else name="i-lucide-upload" class="mr-1.5 h-3.5 w-3.5" />
        {{ isPushingUpsells ? 'Pushing…' : 'Push now' }}
      </Button>
    </div>

    <div
      v-else
      class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
    >
      <Icon name="i-lucide-cloud-check" class="h-4 w-4 shrink-0 text-green-600" />
      <p class="flex-1 text-sm text-green-800">
        All upsells synced to Jurnal.
        <span v-if="lastUpsellSync" class="text-green-600"> Last sync: {{ formatDate(lastUpsellSync) }}.</span>
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Type</label>
        <Select v-model="filterType">
          <SelectTrigger class="h-8 w-44 text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem v-for="t in upsellTypes" :key="t" :value="t">
              {{ t }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Status</label>
        <Select v-model="filterStatus">
          <SelectTrigger class="h-8 w-32 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      <Button variant="ghost" size="sm" class="h-8 self-end" @click="clearFilters">
        Clear filters
      </Button>

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
      <button class="ml-2 text-xs underline hover:text-foreground" @click="selected = []">
        Clear selection
      </button>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-10 px-3">
              <Checkbox
                :checked="allSelected ? true : someSelected ? 'indeterminate' : false"
                aria-label="Select all"
                @click.stop="toggleAll"
              />
            </TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead class="w-28">Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead class="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="w-20 text-center">Invoice</TableHead>
            <TableHead class="w-20 text-center">Synced</TableHead>
            <TableHead class="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="filteredUpsells.length === 0">
            <TableCell colspan="11" class="py-12 text-center text-sm text-muted-foreground">
              No upsell entries match the selected filters.
            </TableCell>
          </TableRow>
          <TableRow
            v-for="u in filteredUpsells"
            v-else
            :key="u.id"
            class="hover:bg-muted/50"
            :class="selected.includes(u.id) && 'bg-muted/40'"
          >
            <TableCell class="px-3">
              <Checkbox
                :checked="selected.includes(u.id)"
                aria-label="Select row"
                @click.stop="toggleRow(u.id)"
              />
            </TableCell>
            <TableCell class="font-medium">{{ u.guest }}</TableCell>
            <TableCell class="max-w-44 truncate text-muted-foreground" :title="u.listing">
              {{ u.listing }}
            </TableCell>
            <TableCell>
              <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon :name="channelIcon[u.channel] ?? 'i-lucide-link'" class="h-3.5 w-3.5" />
                {{ u.channel }}
              </span>
            </TableCell>
            <TableCell class="tabular-nums text-sm text-muted-foreground">{{ u.date }}</TableCell>
            <TableCell>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="typeClass[u.type]">
                {{ u.type }}
              </span>
            </TableCell>
            <TableCell class="text-right font-semibold tabular-nums">{{ formatCHF(u.amount) }}</TableCell>
            <TableCell>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass[u.status]">
                {{ u.status }}
              </span>
            </TableCell>
            <TableCell class="text-center">
              <Icon
                v-if="u.invoice"
                name="i-lucide-paperclip"
                class="mx-auto h-4 w-4 text-muted-foreground"
                :title="u.invoice"
              />
              <span v-else class="text-xs text-muted-foreground">—</span>
            </TableCell>
            <TableCell class="text-center">
              <Icon
                v-if="u.synced"
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
                    v-if="u.invoice"
                    @click="downloadSingleInvoice(u.invoice!, u.guest)"
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
</template>
