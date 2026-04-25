<script lang="ts" setup>
import type { Conversation, ConversationStatus, StayStatus } from '~/components/inbox/data/conversations'

interface ListProps {
  items: Conversation[]
}

defineProps<ListProps>()
const selectedConversationId = defineModel<string | undefined>('selectedConversationId', { required: false })

const { activeFilter, activeStayFilter, sortBy, unreadCountByStatus, stayCountByStatus, conversations } = useInbox()

const totalConversations = computed(() => conversations.length)

function setAllFilter() {
  activeFilter.value = 'all'
  activeStayFilter.value = 'all'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex flex-wrap items-center gap-1.5 px-4 py-1.5 border-b">
      <button
        :class="[
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
          activeFilter === 'all' && activeStayFilter === 'all'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:text-foreground',
        ]"
        @click="setAllFilter"
      >
        All
        <span class="text-[10px] opacity-70">{{ totalConversations }}</span>
      </button>

      <template v-for="[key, label, count] of ([
        ['needs_reply', 'Needs Reply', unreadCountByStatus('needs_reply')] as const,
        ['waiting_on_guest', 'Waiting', unreadCountByStatus('waiting_on_guest')] as const,
        ['done', 'Done', unreadCountByStatus('done')] as const,
      ] as const)">
        <button
          :class="[
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
            activeFilter === key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          ]"
          @click="activeFilter = key as ConversationStatus"
        >
          {{ label }}
          <span v-if="count > 0" class="text-[10px] opacity-70">{{ count }}</span>
        </button>
      </template>

      <span class="text-muted-foreground/40 mx-0.5">|</span>

      <template v-for="[key, label, count] of ([
        ['current', 'Current', stayCountByStatus('current')] as const,
        ['future', 'Future', stayCountByStatus('future')] as const,
        ['past', 'Past', stayCountByStatus('past')] as const,
        ['inquiry', 'Inquiry', stayCountByStatus('inquiry')] as const,
      ] as const)">
        <button
          :class="[
            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
            activeStayFilter === key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          ]"
          @click="activeStayFilter = activeStayFilter === key ? 'all' : (key as StayStatus)"
        >
          {{ label }}
          <span v-if="count > 0" class="text-[10px] opacity-70">{{ count }}</span>
        </button>
      </template>

      <div class="ml-auto">
        <Select v-model="sortBy">
          <SelectTrigger class="h-7 w-auto gap-1 border-none px-2 text-xs shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              Newest first
            </SelectItem>
            <SelectItem value="oldest">
              Oldest first
            </SelectItem>
            <SelectItem value="unread">
              Unread first
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <ScrollArea class="flex-1">
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="lucide:inbox" class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          You're all caught up!
        </p>
        <button
          class="text-sm text-muted-foreground hover:underline"
          @click="setAllFilter"
        >
          View all conversations
        </button>
      </div>

      <div v-else class="flex flex-col gap-2 p-4 pt-2">
        <TransitionGroup name="list" appear>
          <InboxListItem
            v-for="item of items"
            :key="item.id"
            :conversation="item"
            :is-selected="selectedConversationId === item.id"
            @select="selectedConversationId = item.id"
          />
        </TransitionGroup>
      </div>
    </ScrollArea>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

.list-leave-active {
  position: absolute;
}
</style>