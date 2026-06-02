<script lang="ts" setup>
import type { Reservation } from '~/components/inbox/data/conversations'
import { useMediaQuery } from '@vueuse/core'
import { cn } from '~/lib/utils'

const props = withDefaults(defineProps<InboxLayoutProps>(), {
  defaultCollapsed: false,
  defaultLayout: () => [18, 22, 38, 22],
})

interface InboxLayoutProps {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

const {
  selectedConversationId,
  searchValue,
  sortBy,
  unreadFilter,
  showActionNeeded,
  actionNeededCount,
  filteredConversations,
  selectedConversation,
  selectedReservation,
  conversations,
  rightPanelCollapsed,
} = useInbox()

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'unread', label: 'Unread' },
]

const effectiveReservation = computed<Reservation | undefined>(() => {
  if (selectedReservation.value) return selectedReservation.value
  if (!selectedConversation.value) return undefined
  const c = selectedConversation.value
  return {
    id: c.id,
    propertyName: c.propertyName,
    roomName: c.listingName,
    listingName: c.listingName,
    otaSource: c.otaSource,
    checkIn: c.checkIn || '',
    checkOut: c.checkOut || '',
    nights: 0,
    guestCount: 1,
    totalPrice: 0,
    currency: 'USD',
    smartActions: [],
    guestDetails: { name: c.guestName, email: '', phone: c.guestName, previousStays: 0, notes: 'Unknown sender — not linked to any reservation.', language: '' },
    listingDetails: { name: c.listingName, property: c.propertyName, room: '', amenities: [] },
    tasks: [],
    activity: [],
  }
})

const isCollapsed = ref(props.defaultCollapsed)
const debouncedSearch = refDebounced(searchValue, 250)

const totalUnread = computed(() =>
  conversations.value.filter(c => c.unreadCount > 0).length,
)

function onCollapse() {
  isCollapsed.value = true
}

function onExpand() {
  isCollapsed.value = false
}

const isMobile = useMediaQuery('(max-width: 768px)')

watch(() => isMobile.value, () => {
  isCollapsed.value = isMobile.value
})

const settingsPopoverOpen = ref(false)
const integrationsOpen = ref(false)
const aiSettingsOpen = ref(false)

function openSheet(type: 'integrations' | 'ai') {
  settingsPopoverOpen.value = false
  if (type === 'integrations') integrationsOpen.value = true
  else aiSettingsOpen.value = true
}
</script>

<template>
  <TooltipProvider :delay-duration="0">
    <ResizablePanelGroup
      id="inbox-panel-group"
      direction="horizontal"
      class="h-full items-stretch"
    >
      <ResizablePanel
        id="inbox-filter-panel"
        :default-size="defaultLayout[0]"
        :collapsed-size="navCollapsedSize"
        collapsible
        :min-size="12"
        :max-size="20"
        :class="cn(isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out')"
        @expand="onExpand"
        @collapse="onCollapse"
      >
        <div :class="cn('flex h-[56px] items-center px-4', isCollapsed && 'justify-center px-2')">
          <template v-if="isCollapsed">
            <Icon name="lucide:inbox" class="size-5 text-muted-foreground" />
          </template>
          <template v-else>
            <h1 class="text-xl font-bold flex-1">
              Inbox
            </h1>
            <Popover v-model:open="settingsPopoverOpen">
              <PopoverTrigger as-child>
                <Button variant="ghost" size="icon" class="size-8">
                  <Icon name="lucide:settings-2" class="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-52 p-1.5 text-left" align="end" :side-offset="4">
                <button type="button" class="flex w-full flex-row items-center justify-start gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-left" @click="openSheet('integrations')">
                  <Icon name="lucide:plug" class="size-4 shrink-0 text-muted-foreground" /><span>Integrations</span>
                </button>
                <button type="button" class="flex w-full flex-row items-center justify-start gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors text-left" @click="openSheet('ai')">
                  <Icon name="lucide:sparkles" class="size-4 shrink-0 text-muted-foreground" /><span>AI Conversation Settings</span>
                </button>
              </PopoverContent>
            </Popover>
          </template>
        </div>
        <Separator />
        <InboxNav :is-collapsed="isCollapsed" />
      </ResizablePanel>
      <ResizableHandle id="inbox-handle-1" with-handle />
      <ResizablePanel id="inbox-list-panel" :default-size="defaultLayout[1]" :min-size="20" class="flex flex-col overflow-hidden">
        <InboxList
          v-model:selected-conversation-id="selectedConversationId"
          :items="filteredConversations"
        />
      </ResizablePanel>
      <ResizableHandle id="inbox-handle-2" with-handle />
      <ResizablePanel id="inbox-thread-panel" :default-size="defaultLayout[2]" :min-size="30" class="flex flex-col overflow-hidden">
        <InboxThread />
      </ResizablePanel>
      <ResizableHandle id="inbox-handle-3" with-handle />
      <ResizablePanel
        v-if="!rightPanelCollapsed"
        id="inbox-reservation-panel"
        :default-size="defaultLayout[3]"
        :min-size="20"
        collapsible
      >
        <template v-if="selectedConversation && effectiveReservation">
          <InboxReservationPanel
            :conversation="selectedConversation"
            :reservation="effectiveReservation"
          />
        </template>
        <template v-else>
          <div class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Icon name="lucide:calendar" class="size-10" />
            <p class="text-sm">
              Select a conversation
            </p>
          </div>
        </template>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- Integrations Sheet -->
    <Sheet v-model:open="integrationsOpen">
      <SheetContent class="w-[480px] sm:max-w-[480px] flex flex-col p-0 gap-0">
        <SheetHeader class="px-6 pt-5 pb-4 border-b shrink-0">
          <SheetTitle>Integrations</SheetTitle>
          <SheetDescription>Connect external channels to send and receive guest messages.</SheetDescription>
        </SheetHeader>
        <div class="flex-1 overflow-y-auto p-6">
          <SettingsWhatsAppIntegration />
        </div>
      </SheetContent>
    </Sheet>

    <!-- AI Conversation Settings Sheet -->
    <InboxAiSettings v-model:open="aiSettingsOpen" />
  </TooltipProvider>
</template>