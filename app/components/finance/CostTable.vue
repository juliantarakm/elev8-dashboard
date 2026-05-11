<script setup lang="ts">
import type { CostEntry } from '@/components/finance/data/costs'

const props = defineProps<{
  costs: CostEntry[]
}>()

const emit = defineEmits<{
  select: [cost: CostEntry]
  approve: [id: string]
  reject: [id: string]
}>()

function formatIDR(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

const statusDotClass = (status: string) => ({
  'bg-amber-500': status === 'Pending',
  'bg-green-500': status === 'Approved',
  'bg-red-500': status === 'Rejected',
})

const statusBgClass = (status: string) => ({
  'text-amber-700 bg-amber-50': status === 'Pending',
  'text-green-700 bg-green-50': status === 'Approved',
  'text-red-700 bg-red-50': status === 'Rejected',
})

const typeDotClass = (type: string) => ({
  'bg-slate-500': type === 'Manual',
  'bg-teal-500': type === 'Cleaning',
  'bg-purple-500': type === 'Activity',
})

const typeBgClass = (type: string) => ({
  'text-slate-700 bg-slate-100': type === 'Manual',
  'text-teal-700 bg-teal-50': type === 'Cleaning',
  'text-purple-700 bg-purple-50': type === 'Activity',
})
</script>

<template>
  <div class="rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-28">
            Date
          </TableHead>
          <TableHead>Listing</TableHead>
          <TableHead class="w-24">
            Type
          </TableHead>
          <TableHead>Category</TableHead>
          <TableHead class="w-36 text-right">
            Amount
          </TableHead>
          <TableHead>Staff</TableHead>
          <TableHead class="w-20 text-center">
            Invoice
          </TableHead>
          <TableHead class="w-28">
            Status
          </TableHead>
          <TableHead class="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="props.costs.length > 0">
          <TableRow
            v-for="cost in props.costs"
            :key="cost.id"
            class="cursor-pointer hover:bg-muted/50"
            @click="emit('select', cost)"
          >
            <TableCell class="text-sm text-muted-foreground">
              {{ cost.date }}
            </TableCell>
            <TableCell class="font-medium">
              {{ cost.listing }}
            </TableCell>
            <TableCell>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="typeBgClass(cost.type)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="typeDotClass(cost.type)" />
                {{ cost.type }}
              </span>
            </TableCell>
            <TableCell class="text-sm">
              {{ cost.category }}
              <span v-if="cost.duration" class="ml-1 text-xs text-muted-foreground">
                ({{ formatDuration(cost.duration) }})
              </span>
            </TableCell>
            <TableCell class="text-right font-medium tabular-nums">
              {{ formatIDR(cost.amount) }}
            </TableCell>
            <TableCell class="text-sm">
              {{ cost.staff }}
            </TableCell>
            <TableCell class="text-center">
              <Icon
                v-if="cost.invoice"
                name="i-lucide-paperclip"
                class="mx-auto h-4 w-4 text-muted-foreground"
              />
              <span v-else class="text-xs text-muted-foreground">—</span>
            </TableCell>
            <TableCell>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="statusBgClass(cost.status)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(cost.status)" />
                {{ cost.status }}
              </span>
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-7 w-7" aria-label="Row actions">
                    <Icon name="i-lucide-ellipsis" class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="emit('select', cost)">
                    <Icon name="i-lucide-eye" class="mr-2 h-4 w-4" />
                    View detail
                  </DropdownMenuItem>
                  <template v-if="cost.status === 'Pending'">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="emit('approve', cost.id)">
                      <Icon name="i-lucide-check" class="mr-2 h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem class="text-destructive" @click="emit('reject', cost.id)">
                      <Icon name="i-lucide-x" class="mr-2 h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </template>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell colspan="9" class="py-16 text-center text-sm text-muted-foreground">
              No cost entries yet. Costs submitted by your staff will appear here.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
