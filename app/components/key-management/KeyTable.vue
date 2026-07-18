<script setup lang="ts">
import type { PhysicalKey } from './data/keys'
import { formatDistanceToNow } from 'date-fns'
import { staffMembers } from '~/components/inbox/data/conversations'
import { listings } from '~/components/listings/data/listings'
import { keyTypeIcons, keyTypeLabels } from './data/keys'

const { keys, isOverdue } = defineProps<{
  keys: PhysicalKey[]
  isOverdue: (key: PhysicalKey) => boolean
}>()

const emit = defineEmits<{
  checkout: [key: PhysicalKey]
  return: [key: PhysicalKey]
  handover: [key: PhysicalKey]
  lost: [key: PhysicalKey]
  replace: [key: PhysicalKey]
  history: [key: PhysicalKey]
}>()

function getListingName(id: string) {
  return listings.value.find(l => l.id === id)?.name ?? id
}

function getHolder(key: PhysicalKey) {
  return staffMembers.find(s => s.id === key.holderStaffId)
}

function statusBadgeVariant(status: PhysicalKey['status']) {
  switch (status) {
    case 'available': return 'secondary'
    case 'checked_out': return 'default'
    case 'lost': return 'destructive'
  }
}

function statusLabel(status: PhysicalKey['status']) {
  switch (status) {
    case 'available': return 'Available'
    case 'checked_out': return 'Checked out'
    case 'lost': return 'Lost'
  }
}

function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}
</script>

<template>
  <div class="rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Listing</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Holder</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Checked out</TableHead>
          <TableHead class="w-[60px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="keyItem in keys" :key="keyItem.id">
          <TableCell>
            <div class="flex items-center gap-2">
              <Icon :name="keyTypeIcons[keyItem.type]" class="size-4 text-muted-foreground" />
              <div class="min-w-0">
                <p class="font-medium">
                  {{ keyTypeLabels[keyItem.type] }} #{{ keyItem.copyNumber }}
                </p>
                <p v-if="keyItem.label" class="truncate text-xs text-muted-foreground">
                  {{ keyItem.label }}
                </p>
              </div>
            </div>
          </TableCell>
          <TableCell class="max-w-[220px]">
            <span class="line-clamp-1">{{ getListingName(keyItem.listingId) }}</span>
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-1.5">
              <Badge :variant="statusBadgeVariant(keyItem.status)">
                {{ statusLabel(keyItem.status) }}
              </Badge>
              <Badge v-if="isOverdue(keyItem)" variant="destructive">
                Overdue
              </Badge>
            </div>
          </TableCell>
          <TableCell>
            <div v-if="getHolder(keyItem)" class="flex items-center gap-1.5">
              <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                {{ getHolder(keyItem)!.initials }}
              </span>
              <span class="text-sm">{{ getHolder(keyItem)!.name }}</span>
            </div>
            <span v-else class="text-muted-foreground">—</span>
          </TableCell>
          <TableCell>
            <span v-if="keyItem.status === 'available'" class="text-sm">
              {{ keyItem.location === 'key_box' ? 'Key box' : 'Office' }}
            </span>
            <span v-else class="text-muted-foreground">—</span>
          </TableCell>
          <TableCell class="text-muted-foreground">
            <span v-if="keyItem.checkedOutAt">{{ timeAgo(keyItem.checkedOutAt) }}</span>
            <span v-else>—</span>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon" class="h-8 w-8">
                  <Icon name="lucide:more-horizontal" class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="w-44">
                <DropdownMenuItem v-if="keyItem.status === 'available'" class="gap-2" @click="emit('checkout', keyItem)">
                  <Icon name="lucide:log-out" class="size-4" /> Check out
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status === 'checked_out'" class="gap-2" @click="emit('return', keyItem)">
                  <Icon name="lucide:undo-2" class="size-4" /> Return
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status === 'checked_out'" class="gap-2" @click="emit('handover', keyItem)">
                  <Icon name="lucide:arrow-right-left" class="size-4" /> Hand over
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status !== 'lost'" class="gap-2" @click="emit('lost', keyItem)">
                  <Icon name="lucide:triangle-alert" class="size-4" /> Mark lost
                </DropdownMenuItem>
                <DropdownMenuItem v-if="keyItem.status === 'lost'" class="gap-2" :disabled="!!keyItem.replacedByKeyId" @click="emit('replace', keyItem)">
                  <Icon name="lucide:refresh-ccw" class="size-4" /> {{ keyItem.replacedByKeyId ? 'Replaced' : 'Replace' }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="gap-2" @click="emit('history', keyItem)">
                  <Icon name="lucide:history" class="size-4" /> View history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
        <TableRow v-if="!keys.length">
          <TableCell :colspan="7" class="h-24 text-center text-muted-foreground">
            No keys found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
