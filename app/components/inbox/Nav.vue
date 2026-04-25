<script lang="ts" setup>
import type { ConversationStatus, StayStatus } from '~/components/inbox/data/conversations'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface NavProps {
  isCollapsed: boolean
}

defineProps<NavProps>()

const { activeFilter, activeStayFilter, unreadCountByStatus, stayCountByStatus } = useInbox()

const statusFilters = computed(() => [
  { key: 'needs_reply' as ConversationStatus, label: 'Needs Reply', icon: 'lucide:message-circle-warning', count: unreadCountByStatus('needs_reply') },
  { key: 'waiting_on_guest' as ConversationStatus, label: 'Waiting', icon: 'lucide:clock', count: unreadCountByStatus('waiting_on_guest') },
  { key: 'done' as ConversationStatus, label: 'Done', icon: 'lucide:check-circle', count: unreadCountByStatus('done') },
])

const stayFilters = computed(() => [
  { key: 'current' as StayStatus, label: 'Current', icon: 'lucide:home', count: stayCountByStatus('current') },
  { key: 'future' as StayStatus, label: 'Future', icon: 'lucide:calendar-plus', count: stayCountByStatus('future') },
  { key: 'past' as StayStatus, label: 'Past', icon: 'lucide:history', count: stayCountByStatus('past') },
  { key: 'inquiry' as StayStatus, label: 'Inquiry', icon: 'lucide:help-circle', count: stayCountByStatus('inquiry') },
])

function setStatusFilter(key: ConversationStatus | 'all') {
  activeFilter.value = key
}

function setStayFilter(key: StayStatus | 'all') {
  activeStayFilter.value = key
}

function clearStayFilter() {
  activeStayFilter.value = 'all'
}
</script>

<template>
  <div
    :data-collapsed="isCollapsed"
    class="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
  >
    <div>
      <div v-if="!isCollapsed" class="px-3 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Status
      </div>
      <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <Tooltip v-if="isCollapsed" :delay-duration="0">
          <TooltipTrigger as-child>
            <a
              href="#"
              :class="cn(buttonVariants({ variant: activeFilter === 'all' ? 'default' : 'ghost', size: 'icon' }), 'h-9 w-9')"
              @click.prevent="setStatusFilter('all')"
            >
              <Icon name="lucide:inbox" class="size-4" />
              <span class="sr-only">All</span>
            </a>
          </TooltipTrigger>
          <TooltipContent side="right" class="flex items-center gap-4">
            All
          </TooltipContent>
        </Tooltip>
        <a
          v-else
          href="#"
          :class="cn(
            buttonVariants({ variant: activeFilter === 'all' ? 'default' : 'ghost', size: 'sm' }),
            activeFilter === 'all' && 'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
            'justify-start',
          )"
          @click.prevent="setStatusFilter('all')"
        >
          <Icon name="lucide:inbox" class="mr-2 size-4" />
          All
        </a>

        <template v-for="filter of statusFilters" :key="filter.key">
          <Tooltip v-if="isCollapsed" :delay-duration="0">
            <TooltipTrigger as-child>
              <a
                href="#"
                :class="cn(
                  buttonVariants({ variant: activeFilter === filter.key ? 'default' : 'ghost', size: 'icon' }),
                  'h-9 w-9',
                  activeFilter === filter.key
                    && 'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
                )"
                @click.prevent="setStatusFilter(filter.key)"
              >
                <Icon :name="filter.icon" class="size-4" />
                <span class="sr-only">{{ filter.label }}</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" class="flex items-center gap-4">
              {{ filter.label }}
              <span class="ml-auto text-muted-foreground">{{ filter.count }}</span>
            </TooltipContent>
          </Tooltip>

          <a
            v-else
            href="#"
            :class="cn(
              buttonVariants({ variant: activeFilter === filter.key ? 'default' : 'ghost', size: 'sm' }),
              activeFilter === filter.key
                && 'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
              'justify-start',
            )"
            @click.prevent="setStatusFilter(filter.key)"
          >
            <Icon :name="filter.icon" class="mr-2 size-4" />
            {{ filter.label }}
            <span
              v-if="filter.count > 0"
              :class="cn(
                'ml-auto',
                activeFilter === filter.key
                  && 'text-background dark:text-white',
              )"
            >
              {{ filter.count }}
            </span>
          </a>
        </template>
      </nav>
    </div>

    <Separator />

    <div>
      <div v-if="!isCollapsed" class="px-3 pb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Stay
      </div>
      <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <template v-for="filter of stayFilters" :key="filter.key">
          <Tooltip v-if="isCollapsed" :delay-duration="0">
            <TooltipTrigger as-child>
              <a
                href="#"
                :class="cn(
                  buttonVariants({ variant: activeStayFilter === filter.key ? 'default' : 'ghost', size: 'icon' }),
                  'h-9 w-9',
                  activeStayFilter === filter.key
                    && 'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
                )"
                @click.prevent="setStayFilter(filter.key)"
              >
                <Icon :name="filter.icon" class="size-4" />
                <span class="sr-only">{{ filter.label }}</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" class="flex items-center gap-4">
              {{ filter.label }}
              <span class="ml-auto text-muted-foreground">{{ filter.count }}</span>
            </TooltipContent>
          </Tooltip>

          <a
            v-else
            href="#"
            :class="cn(
              buttonVariants({ variant: activeStayFilter === filter.key ? 'default' : 'ghost', size: 'sm' }),
              activeStayFilter === filter.key
                && 'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
              'justify-start',
            )"
            @click.prevent="activeStayFilter === filter.key ? clearStayFilter() : setStayFilter(filter.key)"
          >
            <Icon :name="filter.icon" class="mr-2 size-4" />
            {{ filter.label }}
            <span
              v-if="filter.count > 0"
              :class="cn(
                'ml-auto',
                activeStayFilter === filter.key
                  && 'text-background dark:text-white',
              )"
            >
              {{ filter.count }}
            </span>
          </a>
        </template>
      </nav>
    </div>
  </div>
</template>