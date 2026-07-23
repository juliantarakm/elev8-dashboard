<script setup lang="ts">
import type { OwnerStay, OwnerStaySyncTarget } from '~/components/owners/data/owner-stays'
import { useOwnerPortal } from '~/composables/useOwnerPortal'
import { useOwnerStays } from '~/composables/useOwnerStays'
import PortalStaysCalendar from './PortalStaysCalendar.vue'

const { myStays, currentOwner } = useOwnerPortal()
const { cancelStay, retrySync } = useOwnerStays()
void currentOwner
const dialogOpen = ref(false)
const editing = ref<OwnerStay | null>(null)

const active = computed(() => myStays.value.filter(s => s.status === 'active'))
const cancelled = computed(() => myStays.value.filter(s => s.status === 'cancelled'))

function edit(stay: OwnerStay) {
  editing.value = stay
  dialogOpen.value = true
}

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}

function cancel(stay: OwnerStay) {
  cancelStay(stay.id, 'Cancelled by owner')
}

function retry(payload: { stay: OwnerStay, target: OwnerStaySyncTarget }) {
  retrySync(payload.stay.id, payload.target)
}

function saved() {
  editing.value = null
  dialogOpen.value = false
}
</script>

<template>
  <div class="flex min-h-0 flex-col gap-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">
          My Stays
        </h1><p class="text-sm text-muted-foreground">
          Manage owner-use reservations for your properties.
        </p>
      </div><Button @click="openCreate">
        <Icon name="lucide:plus" class="mr-2 size-4" />Create stay
      </Button>
    </div><Tabs default-value="calendar" class="min-h-0">
      <TabsList>
        <TabsTrigger value="calendar">
          Calendar
        </TabsTrigger><TabsTrigger value="list">
          List
        </TabsTrigger>
      </TabsList><TabsContent value="calendar" class="min-h-0">
        <div v-if="active.length" class="space-y-3">
          <PortalStaysCalendar @edit="edit" @cancel="cancel" @retry="retry" />
        </div>
        <Card v-else>
          <CardContent class="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <Icon name="lucide:calendar-off" class="size-6 opacity-60" />
            <p>No active stays yet. Create your first stay to see it on the calendar.</p>
            <Button size="sm" @click="openCreate">
              <Icon name="lucide:plus" class="mr-1.5 size-4" />Create stay
            </Button>
          </CardContent>
        </Card>
      </TabsContent><TabsContent value="list">
        <Card v-if="[...active, ...cancelled].length === 0">
          <CardContent class="flex flex-col items-center gap-2 p-8 text-center text-sm text-muted-foreground">
            <Icon name="lucide:calendar-off" class="size-6 opacity-60" />
            <p>No owner stays yet.</p>
          </CardContent>
        </Card>
        <div v-else class="overflow-auto rounded-md border">
          <Table>
            <TableHeader><TableRow><TableHead>Dates</TableHead><TableHead>Guest</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>
              <TableRow v-for="stay in [...active, ...cancelled]" :key="stay.id">
                <TableCell>{{ stay.checkIn }} → {{ stay.checkOut }}</TableCell><TableCell>{{ stay.guestName }}</TableCell><TableCell>{{ stay.status }}</TableCell><TableCell class="text-right">
                  <Button v-if="stay.status === 'active'" size="sm" variant="ghost" @click="edit(stay)">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs><PortalStayDialog
      :open="dialogOpen"
      :stay="editing"
      :owner-id="currentOwner?.id ?? 'own-1'"
      @update:open="(v: boolean) => dialogOpen = v"
      @saved="saved"
    />
  </div>
</template>
