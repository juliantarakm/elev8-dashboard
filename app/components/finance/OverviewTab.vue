<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useCosts } from '@/composables/useCosts'
import { useReservations } from '@/composables/useReservations'
import { useUpsells } from '@/composables/useUpsells'
import { useJurnal } from '@/composables/useJurnal'

const { costs } = useCosts()
const { reservations } = useReservations()
const { upsells, isPushingUpsells, pushUpsells } = useUpsells()
const { isConnected, pushCosts, pushRevenue, isPushingCosts, isPushingRevenue } = useJurnal()

// ── Pending rows ───────────────────────────────────────────────────────────
interface PendingRow {
  _type: 'reservation' | 'upsell' | 'cost'
  id: string
  date: string
  description: string
  listing: string
  detail: string
  amount: string
  badge: string
  badgeClass: string
}

const costTypeBadge: Record<string, string> = {
  Manual: 'text-slate-700 bg-slate-100',
  Cleaning: 'text-teal-700 bg-teal-50',
  Activity: 'text-purple-700 bg-purple-50',
  Task: 'text-orange-700 bg-orange-50',
}

const upsellTypeBadge: Record<string, string> = {
  'Early Check-in': 'text-sky-700 bg-sky-50',
  'Late Check-out': 'text-indigo-700 bg-indigo-50',
  'Airport Transfer': 'text-violet-700 bg-violet-50',
  'Breakfast Package': 'text-amber-700 bg-amber-50',
  'Welcome Package': 'text-pink-700 bg-pink-50',
  'Extra Cleaning': 'text-teal-700 bg-teal-50',
  'BBQ Setup': 'text-orange-700 bg-orange-50',
}

function formatCHF(n: number) {
  return `CHF ${n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatIDR(n: number) {
  return `IDR ${n.toLocaleString('id-ID')}`
}

const allPending = computed<PendingRow[]>(() => {
  const rows: PendingRow[] = []

  reservations.value
    .filter(r => !r.synced)
    .forEach(r => rows.push({
      _type: 'reservation',
      id: r.id,
      date: r.checkIn,
      description: r.guest,
      listing: r.listing,
      detail: r.channel,
      amount: formatCHF(r.amount),
      badge: r.status,
      badgeClass: r.status === 'Confirmed'
        ? 'text-green-700 bg-green-50'
        : r.status === 'In Progress'
          ? 'text-blue-700 bg-blue-50'
          : 'text-amber-700 bg-amber-50',
    }))

  upsells.value
    .filter(u => !u.synced && u.status === 'Paid')
    .forEach(u => rows.push({
      _type: 'upsell',
      id: u.id,
      date: u.date,
      description: u.guest,
      listing: u.listing,
      detail: u.channel,
      amount: formatCHF(u.amount),
      badge: u.type,
      badgeClass: upsellTypeBadge[u.type] ?? 'text-slate-700 bg-slate-100',
    }))

  costs.value
    .filter(c => !c.synced)
    .forEach(c => rows.push({
      _type: 'cost',
      id: c.id,
      date: c.date,
      description: c.staff,
      listing: c.listing,
      detail: c.category,
      amount: formatIDR(c.amount),
      badge: c.type,
      badgeClass: costTypeBadge[c.type] ?? 'text-slate-700 bg-slate-100',
    }))

  return rows.sort((a, b) => a.date.localeCompare(b.date))
})

const sourceLabel: Record<string, string> = {
  reservation: 'Revenue',
  upsell: 'Upsell',
  cost: 'Cost',
}

const sourceClass: Record<string, string> = {
  reservation: 'text-blue-700 bg-blue-50',
  upsell: 'text-violet-700 bg-violet-50',
  cost: 'text-slate-700 bg-slate-100',
}

const costTypeDotClass: Record<string, string> = {
  Manual: 'bg-slate-500',
  Cleaning: 'bg-teal-500',
  Activity: 'bg-purple-500',
  Task: 'bg-orange-500',
}

// ── Push all ───────────────────────────────────────────────────────────────
const isPushingAll = ref(false)

async function pushAll() {
  if (isPushingAll.value || !isConnected.value) return
  isPushingAll.value = true
  await Promise.all([
    costs.value.some(c => !c.synced) ? pushCosts() : Promise.resolve(),
    reservations.value.some(r => !r.synced) ? pushRevenue() : Promise.resolve(),
    upsells.value.some(u => !u.synced && u.status === 'Paid') ? pushUpsells() : Promise.resolve(),
  ])
  isPushingAll.value = false
  toast.success('All entries pushed to Jurnal.')
}

const isAnyPushing = computed(() =>
  isPushingAll.value || isPushingCosts.value || isPushingRevenue.value || isPushingUpsells.value,
)

const channelIcon: Record<string, string> = {
  'Booking.com': 'i-lucide-globe',
  Airbnb: 'i-lucide-home',
  Direct: 'i-lucide-link',
}

// ── Recent Activity ────────────────────────────────────────────────────────
interface ActivityRow {
  _type: 'reservation' | 'upsell' | 'cost'
  id: string
  date: string
  description: string
  listing: string
  detail: string
  amount: string
  badge: string
  badgeClass: string
  synced: boolean
}

const recentActivity = computed<ActivityRow[]>(() => {
  const rows: ActivityRow[] = []

  reservations.value.forEach(r => rows.push({
    _type: 'reservation',
    id: r.id,
    date: r.checkIn,
    description: r.guest,
    listing: r.listing,
    detail: r.channel,
    amount: formatCHF(r.amount),
    badge: r.status,
    badgeClass: r.status === 'Confirmed'
      ? 'text-green-700 bg-green-50'
      : r.status === 'In Progress'
        ? 'text-blue-700 bg-blue-50'
        : 'text-amber-700 bg-amber-50',
    synced: r.synced,
  }))

  upsells.value.forEach(u => rows.push({
    _type: 'upsell',
    id: u.id,
    date: u.date,
    description: u.guest,
    listing: u.listing,
    detail: u.channel,
    amount: formatCHF(u.amount),
    badge: u.type,
    badgeClass: upsellTypeBadge[u.type] ?? 'text-slate-700 bg-slate-100',
    synced: u.synced,
  }))

  costs.value.forEach(c => rows.push({
    _type: 'cost',
    id: c.id,
    date: c.date,
    description: c.staff,
    listing: c.listing,
    detail: c.category,
    amount: formatIDR(c.amount),
    badge: c.type,
    badgeClass: costTypeBadge[c.type] ?? 'text-slate-700 bg-slate-100',
    synced: c.synced,
  }))

  return rows
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Pending Actions table -->
    <div class="rounded-md border">
      <div class="flex items-center justify-between gap-3 border-b bg-muted/40 px-5 py-2.5">
        <div class="flex items-center gap-2">
          <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Pending Actions
          </p>
          <span
            v-if="allPending.length > 0"
            class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"
          >
            {{ allPending.length }}
          </span>
        </div>

        <Button
          v-if="isConnected && allPending.length > 0"
          size="sm"
          :disabled="isAnyPushing"
          @click="pushAll"
        >
          <Icon
            v-if="isAnyPushing"
            name="i-lucide-loader-2"
            class="mr-1.5 h-3.5 w-3.5 animate-spin"
          />
          <Icon v-else name="i-lucide-upload-cloud" class="mr-1.5 h-3.5 w-3.5" />
          {{ isAnyPushing ? 'Syncing…' : 'Sync all' }}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-24">Source</TableHead>
            <TableHead class="w-28">Date</TableHead>
            <TableHead>Guest / Staff</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead class="text-right">Amount</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="allPending.length === 0">
            <TableCell colspan="7" class="py-12 text-center text-sm text-muted-foreground">
              All entries are synced to Jurnal.
            </TableCell>
          </TableRow>
          <TableRow v-for="row in allPending" v-else :key="`${row._type}-${row.id}`" class="hover:bg-muted/50">
            <TableCell>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="sourceClass[row._type]">
                {{ sourceLabel[row._type] }}
              </span>
            </TableCell>
            <TableCell class="tabular-nums text-sm text-muted-foreground">{{ row.date }}</TableCell>
            <TableCell class="font-medium">{{ row.description }}</TableCell>
            <TableCell class="max-w-44 truncate text-muted-foreground" :title="row.listing">
              {{ row.listing }}
            </TableCell>
            <TableCell>
              <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon
                  v-if="row._type !== 'cost'"
                  :name="channelIcon[row.detail] ?? 'i-lucide-link'"
                  class="h-3.5 w-3.5"
                />
                {{ row.detail }}
              </span>
            </TableCell>
            <TableCell class="text-right font-semibold tabular-nums">{{ row.amount }}</TableCell>
            <TableCell>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="row.badgeClass">
                <span v-if="row._type === 'cost'" class="h-1.5 w-1.5 rounded-full" :class="costTypeDotClass[row.badge]" />
                {{ row.badge }}
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Recent Activity table -->
    <div class="rounded-md border">
      <div class="border-b bg-muted/40 px-5 py-2.5">
        <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent Activity
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-24">Source</TableHead>
            <TableHead class="w-28">Date</TableHead>
            <TableHead>Guest / Staff</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead class="text-right">Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead class="w-20 text-center">Synced</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in recentActivity" :key="`act-${row._type}-${row.id}`" class="hover:bg-muted/50">
            <TableCell>
              <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="sourceClass[row._type]">
                {{ sourceLabel[row._type] }}
              </span>
            </TableCell>
            <TableCell class="tabular-nums text-sm text-muted-foreground">{{ row.date }}</TableCell>
            <TableCell class="font-medium">{{ row.description }}</TableCell>
            <TableCell class="max-w-44 truncate text-muted-foreground" :title="row.listing">
              {{ row.listing }}
            </TableCell>
            <TableCell>
              <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Icon
                  v-if="row._type !== 'cost'"
                  :name="channelIcon[row.detail] ?? 'i-lucide-link'"
                  class="h-3.5 w-3.5"
                />
                {{ row.detail }}
              </span>
            </TableCell>
            <TableCell class="text-right font-semibold tabular-nums">{{ row.amount }}</TableCell>
            <TableCell>
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="row.badgeClass">
                <span v-if="row._type === 'cost'" class="h-1.5 w-1.5 rounded-full" :class="costTypeDotClass[row.badge]" />
                {{ row.badge }}
              </span>
            </TableCell>
            <TableCell class="text-center">
              <Icon
                v-if="row.synced"
                name="i-lucide-cloud-check"
                class="mx-auto h-4 w-4 text-green-500"
              />
              <Icon
                v-else
                name="i-lucide-cloud-off"
                class="mx-auto h-4 w-4 text-muted-foreground"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
