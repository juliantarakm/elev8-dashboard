<script lang="ts" setup>
import type { Conversation } from '~/components/inbox/data/conversations'
import { Search } from 'lucide-vue-next'

interface ListProps {
  items: Conversation[]
}

defineProps<ListProps>()
const selectedConversationId = defineModel<string | undefined>('selectedConversationId', { required: false })

const { showActionNeeded, unreadFilter, assignedToMeFilter, searchValue, sortBy, actionNeededCount, assignedToMeCount, conversations } = useInbox()

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'unread', label: 'Unread' },
]
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <div class="flex h-[56px] items-center gap-2 px-4 shrink-0">
      <div class="relative flex-1">
        <Search class="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input v-model="searchValue" placeholder="Search guests, listings, tags..." class="pl-8 h-8" />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="sm" class="shrink-0 gap-1.5 h-8 text-muted-foreground">
            <Icon name="lucide:arrow-up-down" class="size-4" />
            <span class="hidden sm:inline text-xs">{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-36">
          <DropdownMenuItem
            v-for="option in sortOptions"
            :key="option.value"
            :class="{ 'bg-accent': sortBy === option.value }"
            @click="sortBy = option.value"
          >
            {{ option.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <Separator />

    <div class="flex items-center gap-1.5 shrink-0 px-4 py-2">
      <Badge
        variant="secondary"
        class="cursor-pointer select-none gap-1 text-xs transition-colors"
        :class="showActionNeeded ? 'bg-primary text-primary-foreground' : ''"
        @click="showActionNeeded = !showActionNeeded"
      >
        <Icon name="lucide:circle-alert" class="size-3" />
        Action Needed
      </Badge>
      <Badge
        variant="secondary"
        class="cursor-pointer select-none gap-1 text-xs transition-colors"
        :class="unreadFilter ? 'bg-primary text-primary-foreground' : ''"
        @click="unreadFilter = !unreadFilter"
      >
        <Icon name="lucide:mail" class="size-3" />
        Unread
      </Badge>
      <Badge
        variant="secondary"
        class="cursor-pointer select-none gap-1 text-xs transition-colors"
        :class="assignedToMeFilter ? 'bg-primary text-primary-foreground' : ''"
        @click="assignedToMeFilter = !assignedToMeFilter"
      >
        <Icon name="lucide:user-check" class="size-3" />
        Assigned to Me
      </Badge>
    </div>

    <ScrollArea class="flex-1 min-h-0">
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="lucide:inbox" class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          You're all caught up!
        </p>
        <button
          class="text-sm text-muted-foreground hover:underline"
          @click="showActionNeeded = false; unreadFilter = false; assignedToMeFilter = false"
        >
          View all conversations
        </button>
      </div>

      <div v-else class="flex flex-col gap-2 px-4 pb-4">
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
