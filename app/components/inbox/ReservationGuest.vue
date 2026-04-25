<script lang="ts" setup>
import type { Conversation, GuestDetails, Reservation, StayStatus } from '~/components/inbox/data/conversations'
import { otaSources, staffMembers } from '~/components/inbox/data/conversations'
import { format } from 'date-fns'
import { cn } from '~/lib/utils'
import { toast } from 'vue-sonner'

interface ReservationGuestProps {
  guest: GuestDetails
  reservation: Reservation
  stayStatus: StayStatus
  conversation: Conversation
}

const props = defineProps<ReservationGuestProps>()

const { assignTo, getAssignedStaff } = useInbox()

const initials = computed(() =>
  props.guest.name.split(' ').map(n => n[0]).join(''),
)

const stayStatusConfig: Record<StayStatus, { label: string, class: string }> = {
  inquiry: { label: 'Inquiry', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  current: { label: 'Current Stay', class: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  future: { label: 'Upcoming', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
  past: { label: 'Checked Out', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
}

const stayCfg = computed(() => stayStatusConfig[props.stayStatus])
const otaIconMap: Record<string, string> = Object.fromEntries(otaSources.map(s => [s.name, s.icon]))
const hasDates = computed(() => !!props.reservation.checkIn && !!props.reservation.checkOut)
const checkInDate = computed(() => hasDates.value ? new Date(props.reservation.checkIn) : null)
const checkOutDate = computed(() => hasDates.value ? new Date(props.reservation.checkOut) : null)

const assignedStaff = computed(() => getAssignedStaff(props.conversation))

function handleAssign(staffId: string | null) {
  assignTo(props.conversation.id, staffId)
  if (staffId) {
    const staff = staffMembers.find(s => s.id === staffId)
    toast.success(`Assigned to ${staff?.name ?? 'staff'}`)
  } else {
    toast.info('Unassigned conversation')
  }
}
</script>

<template>
  <div class="space-y-3">
    <!-- Guest header -->
    <div class="flex items-start gap-3">
      <Avatar class="size-12 shrink-0">
        <AvatarFallback class="text-sm font-semibold">{{ initials }}</AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0 pt-0.5">
        <div class="font-semibold text-sm leading-tight">{{ guest.name }}</div>
        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
          <span :class="cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', stayCfg.class)">
            {{ stayCfg.label }}
          </span>
          <span class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">
            <Icon :name="otaIconMap[reservation.otaSource] ?? 'lucide:globe'" class="size-3" />
            {{ reservation.otaSource }}
          </span>
        </div>
      </div>
    </div>

    <!-- Stay dates card -->
    <div v-if="hasDates" class="rounded-lg border bg-muted/40 p-3 space-y-2.5">
      <div class="flex items-center">
        <div class="flex-1 text-center">
          <div class="text-[10px] text-muted-foreground mb-0.5">Check-in</div>
          <div class="font-semibold text-sm">{{ format(checkInDate!, 'MMM d') }}</div>
          <div class="text-[10px] text-muted-foreground">{{ format(checkInDate!, 'EEE') }}</div>
        </div>
        <div class="flex flex-col items-center gap-0.5 px-3">
          <div class="flex items-center gap-1 text-muted-foreground">
            <div class="h-px w-5 bg-border" />
            <Icon name="lucide:moon" class="size-3 text-muted-foreground" />
            <div class="h-px w-5 bg-border" />
          </div>
          <div class="text-[10px] font-medium text-muted-foreground">{{ reservation.nights }}n</div>
        </div>
        <div class="flex-1 text-center">
          <div class="text-[10px] text-muted-foreground mb-0.5">Check-out</div>
          <div class="font-semibold text-sm">{{ format(checkOutDate!, 'MMM d') }}</div>
          <div class="text-[10px] text-muted-foreground">{{ format(checkOutDate!, 'EEE') }}</div>
        </div>
      </div>
      <Separator />
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5 text-muted-foreground">
          <Icon name="lucide:users" class="size-3.5" />
          <span class="text-xs">{{ reservation.guestCount }} guest{{ reservation.guestCount !== 1 ? 's' : '' }}</span>
        </div>
        <div class="text-sm font-semibold">{{ reservation.currency }} {{ reservation.totalPrice.toLocaleString() }}</div>
      </div>
    </div>

    <!-- Property + Contact -->
    <div class="rounded-lg border bg-muted/50 divide-y">
      <div class="p-3 flex items-start gap-2.5">
        <Icon name="lucide:home" class="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">{{ reservation.listingName }}</div>
          <div class="text-xs text-muted-foreground">{{ reservation.propertyName }}</div>
        </div>
      </div>
      <div class="p-3 space-y-2">
        <div class="flex items-center gap-2.5">
          <Icon name="lucide:mail" class="size-3.5 shrink-0 text-muted-foreground" />
          <span class="text-xs truncate">{{ guest.email }}</span>
        </div>
        <div class="flex items-center gap-2.5">
          <Icon name="lucide:phone" class="size-3.5 shrink-0 text-muted-foreground" />
          <span class="text-xs">{{ guest.phone }}</span>
        </div>
      </div>
    </div>

    <!-- Notes -->
    <div v-if="guest.notes" class="rounded-lg border bg-muted/50 p-3">
      <div class="flex items-center gap-2 mb-1.5">
        <Icon name="lucide:pencil-line" class="size-3.5 text-muted-foreground" />
        <span class="text-sm font-medium">Notes</span>
      </div>
      <p class="text-xs text-muted-foreground leading-relaxed">{{ guest.notes }}</p>
    </div>

    <!-- Assign To -->
    <div class="rounded-lg border bg-muted/50 p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="lucide:user-check" class="size-3.5 text-muted-foreground" />
          <span class="text-sm font-medium">Assigned to</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="h-7 gap-1.5 text-xs">
              <template v-if="assignedStaff">
                <Avatar class="size-5">
                  <AvatarFallback class="text-[9px]">{{ assignedStaff.initials }}</AvatarFallback>
                </Avatar>
                {{ assignedStaff.name }}
              </template>
              <template v-else>
                Unassigned
              </template>
              <Icon name="lucide:chevron-down" class="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-52">
            <DropdownMenuItem @click="handleAssign('staff-1')">
              <Icon name="lucide:crown" class="size-4 mr-2" />
              You (Admin)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="member of staffMembers.filter(s => s.id !== 'staff-1')"
              :key="member.id"
              @click="handleAssign(member.id)"
            >
              {{ member.name }}
              <span class="ml-1 text-muted-foreground">· {{ member.role }}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleAssign(null)">
              <Icon name="lucide:user-x" class="size-4 mr-2" />
              Unassign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>
