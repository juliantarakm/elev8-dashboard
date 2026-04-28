<script lang="ts" setup>
import type { Conversation } from '~/components/inbox/data/conversations'
import { Search } from 'lucide-vue-next'
import { cn } from '~/lib/utils'

interface ListProps {
  items: Conversation[]
}

defineProps<ListProps>()
const selectedConversationId = defineModel<string | undefined>('selectedConversationId', { required: false })

const { showActionNeeded, unreadFilter, assignedToMeFilter, activeChannelFilter, searchValue, sortBy, channelOptions, setChannelFilter, clearChannelFilter } = useInbox()

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'unread', label: 'Unread' },
]

const filterOpen = ref(false)

const activeFilterCount = computed(() => {
  let count = 0
  if (showActionNeeded.value) count++
  if (unreadFilter.value) count++
  if (assignedToMeFilter.value) count++
  if (activeChannelFilter.value) count++
  return count
})
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
          <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs">
            <Icon name="lucide:arrow-up-down" class="size-3.5 shrink-0" />
            <span class="truncate">{{ sortOptions.find(o => o.value === sortBy)?.label }}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-44">
          <DropdownMenuItem
            v-for="option in sortOptions"
            :key="option.value"
            :class="{ 'bg-accent': sortBy === option.value }"
            @click="sortBy = option.value as any"
          >
            <Icon :name="option.value === 'newest' ? 'lucide:arrow-down-z-a' : option.value === 'oldest' ? 'lucide:arrow-up-z-a' : 'lucide:mail'" class="mr-2 size-4" />
            {{ option.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover v-model:open="filterOpen">
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="h-8 gap-1.5 text-xs" :class="activeFilterCount > 0 ? 'border-primary text-primary' : ''">
            <Icon name="lucide:sliders-horizontal" class="size-3.5 shrink-0" />
            <span class="truncate">Filters</span>
            <span v-if="activeFilterCount > 0" class="flex size-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] leading-none text-primary-foreground">{{ activeFilterCount }}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-64 p-0" align="end" :side-offset="4">
          <div class="p-3">
            <div class="text-xs font-medium text-muted-foreground mb-2">Status</div>
            <div class="flex flex-col gap-1">
              <button
                type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                :class="showActionNeeded ? 'bg-accent' : ''"
                @click="showActionNeeded = !showActionNeeded"
              >
                <div :class="cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                  showActionNeeded ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                )">
                  <Icon v-if="showActionNeeded" name="lucide:check" class="size-3" />
                </div>
                <Icon name="lucide:circle-alert" class="size-3.5 text-destructive" />
                Action Needed
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                :class="unreadFilter ? 'bg-accent' : ''"
                @click="unreadFilter = !unreadFilter"
              >
                <div :class="cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                  unreadFilter ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                )">
                  <Icon v-if="unreadFilter" name="lucide:check" class="size-3" />
                </div>
                <Icon name="lucide:mail" class="size-3.5" />
                Unread
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                :class="assignedToMeFilter ? 'bg-accent' : ''"
                @click="assignedToMeFilter = !assignedToMeFilter"
              >
                <div :class="cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                  assignedToMeFilter ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                )">
                  <Icon v-if="assignedToMeFilter" name="lucide:check" class="size-3" />
                </div>
                <Icon name="lucide:user-check" class="size-3.5" />
                Assigned to Me
              </button>
            </div>
          </div>

          <Separator />

          <div class="p-3">
            <div class="text-xs font-medium text-muted-foreground mb-2">Channel</div>
            <div class="flex flex-col gap-1">
              <button
                type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                :class="!activeChannelFilter ? 'bg-accent' : ''"
                @click="clearChannelFilter()"
              >
                <Icon name="lucide:globe" class="size-3.5" />
                All Channels
              </button>
              <button
                v-for="ch of channelOptions"
                :key="ch.channel"
                type="button"
                class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                :class="activeChannelFilter === ch.channel ? 'bg-accent' : ''"
                @click="setChannelFilter(ch.channel)"
              >
                <Icon :name="ch.channel === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'" class="size-3.5" />
                {{ ch.channel }}
                <span class="ml-auto text-muted-foreground text-xs">{{ ch.count }}</span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>

    <Separator />

    <ScrollArea class="flex-1 min-h-0">
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="lucide:inbox" class="size-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">
          You're all caught up!
        </p>
        <button
          class="text-sm text-muted-foreground hover:underline"
          @click="showActionNeeded = false; unreadFilter = false; assignedToMeFilter = false; clearChannelFilter()"
        >
          View all conversations
        </button>
      </div>

      <div v-else class="flex flex-col gap-2 px-4 pt-3 pb-4">
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
