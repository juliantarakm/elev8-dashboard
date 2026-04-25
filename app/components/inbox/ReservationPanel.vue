<script lang="ts" setup>
import type { Conversation, Reservation } from '~/components/inbox/data/conversations'

interface ReservationPanelProps {
  conversation: Conversation
  reservation: Reservation
}

const props = defineProps<ReservationPanelProps>()
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex h-[56px] items-center px-4">
      <h2 class="font-semibold text-sm">Reservation</h2>
    </div>

    <ScrollArea class="flex-1 min-h-0">
      <div class="px-4 pt-2 pb-2">
        <InboxReservationGuest :guest="reservation.guestDetails" />
      </div>

      <Separator />

      <Tabs default-value="summary" class="flex flex-col">
        <TabsList class="w-full justify-start rounded-none border-b bg-transparent px-4 h-9">
          <TabsTrigger value="summary" class="text-xs">Summary</TabsTrigger>
          <TabsTrigger value="listing" class="text-xs">Listing</TabsTrigger>
          <TabsTrigger value="tasks" class="text-xs">Tasks</TabsTrigger>
          <TabsTrigger value="activity" class="text-xs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div class="p-4">
            <InboxReservationSummary
              :reservation="reservation"
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