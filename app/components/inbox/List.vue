<script lang="ts" setup>
import type { Conversation } from '~/components/inbox/data/conversations'

interface ListProps {
  items: Conversation[]
}

defineProps<ListProps>()
const selectedConversationId = defineModel<string>('selectedConversationId', { required: false })

const { activeFilter } = useInbox()

function setAllFilter() {
  activeFilter.value = 'all'
}
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-4 py-2">
      <span class="text-sm text-muted-foreground">
        {{ items.length }} conversation{{ items.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <ScrollArea class="flex-1">
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="lucide:inbox" class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          You're all caught up!
        </p>
        <button
          class="text-sm text-[#C8A84B] hover:underline"
          @click="setAllFilter"
        >
          View all conversations
        </button>
      </div>

      <div v-else class="flex flex-col gap-2 p-4 pt-0">
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