<script lang="ts" setup>
import type { Conversation, Reservation, PhoneCall } from '~/components/inbox/data/conversations'
import { phoneCalls as phoneCallsData } from '~/components/inbox/data/conversations'

interface ReservationPanelProps {
  conversation: Conversation
  reservation: Reservation
}

const props = defineProps<ReservationPanelProps>()

const conversationPhoneCalls = computed((): PhoneCall[] =>
  phoneCallsData[props.conversation.id] ?? []
)
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex h-[56px] items-center justify-between px-4">
      <h2 class="font-semibold text-sm">Reservation</h2>
      <Button variant="ghost" size="sm" class="h-7 gap-1.5 text-xs text-muted-foreground">
        <Icon name="lucide:external-link" class="size-3.5" />
        Detail
      </Button>
    </div>

    <ScrollArea class="flex-1 min-h-0">
      <div class="px-4 pt-2 pb-2">
        <InboxReservationGuest :guest="reservation.guestDetails" :reservation="reservation" :stay-status="conversation.stayStatus" :conversation="conversation" :sentiment="conversation.sentiment" :sentiment-note="conversation.sentimentNote" />
      </div>

      <Separator />

      <Tabs default-value="summary" class="flex flex-col">
        <TabsList class="w-full justify-start rounded-none border-b bg-transparent px-2 h-9 overflow-x-auto">
          <TabsTrigger value="summary" class="text-xs shrink-0">Summary</TabsTrigger>
          <TabsTrigger value="tasks" class="text-xs shrink-0">Tasks</TabsTrigger>
          <TabsTrigger value="activity" class="text-xs shrink-0">Activity</TabsTrigger>
          <TabsTrigger value="upsells" class="text-xs shrink-0">
            Upsell
            <Badge v-if="reservation.upsells?.length" class="ml-1 h-4 min-w-4 rounded-full px-1 text-[9px]">{{ reservation.upsells.length }}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history" class="text-xs shrink-0">
            History
            <Badge v-if="reservation.bookingHistory?.length" class="ml-1 h-4 min-w-4 rounded-full px-1 text-[9px]">{{ reservation.bookingHistory.length }}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div class="p-4">
            <InboxReservationSummary
              :sentiment="conversation.sentiment"
              :sentiment-note="conversation.sentimentNote"
              :last-message="conversation.lastMessage"
              :smart-actions="reservation.smartActions"
            />
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div class="p-4">
            <InboxReservationTasks :tasks="reservation.tasks" />
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div class="p-4">
            <InboxReservationActivity :activity="reservation.activity" :reservation="reservation" :phone-calls="conversationPhoneCalls" />
          </div>
        </TabsContent>

        <TabsContent value="upsells">
          <div class="p-4">
            <InboxReservationUpsells :upsells="reservation.upsells ?? []" />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div class="p-4">
            <InboxGuestBookingHistory :bookings="reservation.bookingHistory ?? []" />
          </div>
        </TabsContent>
      </Tabs>
    </ScrollArea>
  </div>
</template>