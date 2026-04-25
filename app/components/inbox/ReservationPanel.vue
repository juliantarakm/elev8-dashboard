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

    <Tabs default-value="summary" class="flex flex-col flex-1 min-h-0">
      <TabsList class="w-full justify-start rounded-none border-b bg-transparent px-4 h-9">
        <TabsTrigger value="summary" class="text-xs">Summary</TabsTrigger>
        <TabsTrigger value="guest" class="text-xs">Guest</TabsTrigger>
        <TabsTrigger value="listing" class="text-xs">Listing</TabsTrigger>
        <TabsTrigger value="tasks" class="text-xs">Tasks</TabsTrigger>
        <TabsTrigger value="activity" class="text-xs">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" class="flex-1 min-h-0">
        <ScrollArea class="h-full p-4">
          <InboxReservationSummary
            :reservation="reservation"
            :sentiment="conversation.sentiment"
            :sentiment-note="conversation.sentimentNote"
            :smart-actions="reservation.smartActions"
          />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="guest" class="flex-1 min-h-0">
        <ScrollArea class="h-full p-4">
          <InboxReservationGuest :guest="reservation.guestDetails" />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="listing" class="flex-1 min-h-0">
        <ScrollArea class="h-full p-4">
          <InboxReservationListing :listing="reservation.listingDetails" />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="tasks" class="flex-1 min-h-0">
        <ScrollArea class="h-full p-4">
          <InboxReservationTasks :tasks="reservation.tasks" />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="activity" class="flex-1 min-h-0">
        <ScrollArea class="h-full p-4">
          <InboxReservationActivity :activity="reservation.activity" />
        </ScrollArea>
      </TabsContent>
    </Tabs>
  </div>
</template>