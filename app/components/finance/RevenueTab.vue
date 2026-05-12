<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { recentReservations } from '@/components/finance/data/revenue'

const df = new DateFormatter('en-GB', { day: 'numeric', month: 'short' })

const BALI_KEYWORDS = ['Tambora', 'Kalmantan', 'Pererenan', 'Sinabung', 'Merapi', 'Sanur', 'Ubud', 'Canggu']

function getTag(listing: string) {
  return BALI_KEYWORDS.some(k => listing.includes(k)) ? 'Bali' : 'Switzerland'
}

const uniqueListings = computed(() =>
  [...new Set(recentReservations.map(r => r.listing))].sort(),
)

const filterListing = ref('all')
const filterTag = ref('all')
const filterChannel = ref('all')
const filterDateFrom = ref('')
const filterDateTo = ref('')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateRange = ref<any>(undefined)

watch(dateRange, (range) => {
  filterDateFrom.value = range?.start ? range.start.toString() : ''
  filterDateTo.value = range?.end ? range.end.toString() : ''
})

const filteredReservations = computed(() => {
  return recentReservations.filter((r) => {
    if (filterListing.value !== 'all' && r.listing !== filterListing.value) return false
    if (filterTag.value !== 'all' && getTag(r.listing) !== filterTag.value) return false
    if (filterChannel.value !== 'all' && r.channel !== filterChannel.value) return false
    if (filterDateFrom.value && r.checkIn < filterDateFrom.value) return false
    if (filterDateTo.value && r.checkIn > filterDateTo.value) return false
    return true
  })
})

function clearFilters() {
  filterListing.value = 'all'
  filterTag.value = 'all'
  filterChannel.value = 'all'
  filterDateFrom.value = ''
  filterDateTo.value = ''
  dateRange.value = undefined
}

function formatCHF(amount: number) {
  return `CHF ${amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const statusClass: Record<string, string> = {
  Confirmed: 'text-green-700 bg-green-50',
  'In Progress': 'text-blue-700 bg-blue-50',
  Pending: 'text-amber-700 bg-amber-50',
}

const channelIcon: Record<string, string> = {
  'Booking.com': 'i-lucide-globe',
  'Airbnb': 'i-lucide-home',
  'Direct': 'i-lucide-link',
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Filters -->
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Listing</label>
        <Select v-model="filterListing">
          <SelectTrigger class="h-8 w-56 text-sm">
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
      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground">Tag</label>
        <Select v-model="filterTag">
          <SelectTrigger class="h-8 w-36 text-sm">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            <SelectItem value="Switzerland">Switzerland</SelectItem>
            <SelectItem value="Bali">Bali</SelectItem>
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
        <label class="text-xs text-muted-foreground">Date range</label>
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
      <Button variant="ghost" size="sm" class="h-8 self-end" @click="clearFilters">
        Clear filters
      </Button>
    </div>

    <!-- Reservations table -->
    <div class="rounded-md border">
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Listing</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead class="text-center">Nights</TableHead>
              <TableHead class="text-center">Guests</TableHead>
              <TableHead class="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="filteredReservations.length === 0">
              <TableCell colspan="9" class="py-12 text-center text-sm text-muted-foreground">
                No reservations match the selected filters.
              </TableCell>
            </TableRow>
            <TableRow v-for="res in filteredReservations" v-else :key="res.id + res.checkIn">
              <TableCell class="font-medium">{{ res.guest }}</TableCell>
              <TableCell class="max-w-48 truncate text-muted-foreground" :title="res.listing">{{ res.listing }}</TableCell>
              <TableCell>
                <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon :name="channelIcon[res.channel] ?? 'i-lucide-link'" class="h-3.5 w-3.5" />
                  {{ res.channel }}
                </span>
              </TableCell>
              <TableCell class="tabular-nums text-muted-foreground">{{ res.checkIn }}</TableCell>
              <TableCell class="tabular-nums text-muted-foreground">{{ res.checkOut }}</TableCell>
              <TableCell class="text-center tabular-nums">{{ res.nights }}</TableCell>
              <TableCell class="text-center tabular-nums">{{ res.guests }}</TableCell>
              <TableCell class="text-right font-semibold tabular-nums">{{ formatCHF(res.amount) }}</TableCell>
              <TableCell>
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass[res.status]">
                  {{ res.status }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
