<script lang="ts" setup>
import { useMediaQuery } from '@vueuse/core'
import { Search } from 'lucide-vue-next'
import { cn } from '~/lib/utils'
import { conversations } from '~/components/inbox/data/conversations'

const props = withDefaults(defineProps<InboxLayoutProps>(), {
  defaultCollapsed: false,
  defaultLayout: () => [18, 25, 42, 15],
})

interface InboxLayoutProps {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize: number
}

const {
  selectedConversationId,
  searchValue,
  filteredConversations,
  selectedConversation,
  selectedReservation,
} = useInbox()

const isCollapsed = ref(props.defaultCollapsed)
const debouncedSearch = refDebounced(searchValue, 250)

const totalUnread = computed(() =>
  conversations.reduce((sum, c) => sum + c.unreadCount, 0),
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
            <h1 class="text-xl font-bold">
              Inbox
            </h1>
            <span
              v-if="totalUnread > 0"
              class="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-semibold"
            >
              {{ totalUnread }}
            </span>
          </template>
        </div>
        <Separator />
        <InboxNav :is-collapsed="isCollapsed" />
      </ResizablePanel>
      <ResizableHandle id="inbox-handle-1" with-handle />
      <ResizablePanel id="inbox-list-panel" :default-size="defaultLayout[1]" :min-size="20">
        <div class="flex h-[56px] items-center px-4">
          <div class="relative flex-1">
            <Search class="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input v-model="searchValue" placeholder="Search guests, listings, tags..." class="pl-8" />
          </div>
        </div>
        <Separator />
        <InboxList
          v-model:selected-conversation-id="selectedConversationId"
          :items="filteredConversations"
        />
      </ResizablePanel>
      <ResizableHandle id="inbox-handle-2" with-handle />
      <ResizablePanel id="inbox-thread-panel" :default-size="defaultLayout[2]" :min-size="30">
        <InboxThread />
      </ResizablePanel>
      <ResizableHandle id="inbox-handle-3" with-handle />
      <ResizablePanel
        id="inbox-reservation-panel"
        :default-size="defaultLayout[3]"
        :min-size="15"
        :max-size="25"
        collapsible
      >
        <template v-if="selectedConversation && selectedReservation">
          <InboxReservationPanel
            :conversation="selectedConversation"
            :reservation="selectedReservation"
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
  </TooltipProvider>
</template>