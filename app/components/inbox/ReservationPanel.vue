<script lang="ts" setup>
import type { Conversation, Reservation } from '~/components/inbox/data/conversations'
import { toast } from 'vue-sonner'

interface ReservationPanelProps {
  conversation: Conversation
  reservation: Reservation
}

const props = defineProps<ReservationPanelProps>()

const { isElevaiEnabled, getElevaiState, enableElevai, pauseElevai, disableElevai } = useInbox()
const elevaiOn = computed(() => isElevaiEnabled(props.conversation.id))

const now = ref(Date.now())
let ticker: ReturnType<typeof setInterval>
onMounted(() => { ticker = setInterval(() => { now.value = Date.now() }, 15000) })
onUnmounted(() => clearInterval(ticker))

const elevaiPausedMins = computed(() => {
  const s = getElevaiState(props.conversation.id)
  if (!s.on && s.pausedUntil !== undefined) {
    const remaining = s.pausedUntil - now.value
    return remaining > 0 ? Math.ceil(remaining / 60000) : null
  }
  return null
})

function handleEnable() {
  enableElevai(props.conversation.id)
  toast.success('ElevAI enabled')
}

function handlePause() {
  pauseElevai(props.conversation.id, 15)
  toast.info('ElevAI paused for 15 minutes')
}

function handleDisable() {
  disableElevai(props.conversation.id)
  toast.info('ElevAI turned off')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex h-[56px] items-center justify-between px-4">
      <h2 class="font-semibold text-sm">Reservation</h2>

      <div class="flex items-center gap-2">
        <span class="text-xs text-muted-foreground">
          ElevAI
          <span v-if="elevaiPausedMins" class="text-amber-500 font-medium"> · {{ elevaiPausedMins }}m</span>
        </span>

        <!-- ON: clicking opens dropdown to choose how to turn off -->
        <DropdownMenu v-if="elevaiOn">
          <DropdownMenuTrigger as-child>
            <button class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full bg-warning transition-colors">
              <span class="pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-4" style="margin-top: 2px;" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem @click="handlePause">
              <Icon name="lucide:clock" class="size-4 mr-2" />
              Pause for 15 minutes
            </DropdownMenuItem>
            <DropdownMenuItem @click="handleDisable">
              <Icon name="lucide:power-off" class="size-4 mr-2" />
              Turn off
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <!-- OFF or paused: click to re-enable -->
        <button
          v-else
          class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full bg-muted-foreground/30 transition-colors"
          @click="handleEnable"
        >
          <span class="pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-0.5" style="margin-top: 2px;" />
        </button>
      </div>
    </div>

    <ScrollArea class="flex-1 min-h-0">
      <div class="px-4 pt-2 pb-2">
        <InboxReservationGuest :guest="reservation.guestDetails" :reservation="reservation" :stay-status="conversation.stayStatus" :conversation="conversation" />
      </div>

      <Separator />

      <Tabs default-value="summary" class="flex flex-col">
        <TabsList class="w-full justify-start rounded-none border-b bg-transparent px-2 h-9 overflow-x-auto">
          <TabsTrigger value="summary" class="text-xs shrink-0">Summary</TabsTrigger>
          <TabsTrigger value="listing" class="text-xs shrink-0">Listing</TabsTrigger>
          <TabsTrigger value="tasks" class="text-xs shrink-0">Tasks</TabsTrigger>
          <TabsTrigger value="activity" class="text-xs shrink-0">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div class="p-4">
            <InboxReservationSummary
              :sentiment="conversation.sentiment"
              :sentiment-note="conversation.sentimentNote"
              :smart-actions="reservation.smartActions"
            />
          </div>
        </TabsContent>

        <TabsContent value="listing">
          <div class="p-4">
            <InboxReservationListing :listing="reservation.listingDetails" />
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div class="p-4">
            <InboxReservationTasks :tasks="reservation.tasks" />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div class="p-4">
            <InboxReservationActivity :activity="reservation.activity" />
          </div>
        </TabsContent>
      </Tabs>
    </ScrollArea>
  </div>
</template>