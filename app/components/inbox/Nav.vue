<script lang="ts" setup>
import type { ConversationStatus } from '~/components/inbox/data/conversations'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface NavProps {
  isCollapsed: boolean
}

defineProps<NavProps>()

const { activeFilter, unreadCountByStatus, filteredConversations } = useInbox()

interface FilterItem {
  key: ConversationStatus | 'all'
  label: string
  icon: string
  count: number
}

const statusFilters = computed<FilterItem[]>(() => [
  { key: 'needs_reply', label: 'Needs Reply', icon: 'lucide:message-circle-warning', count: unreadCountByStatus('needs_reply') },
  { key: 'waiting_on_guest', label: 'Waiting', icon: 'lucide:clock', count: unreadCountByStatus('waiting_on_guest') },
  { key: 'done', label: 'Done', icon: 'lucide:check-circle', count: unreadCountByStatus('done') },
  { key: 'all', label: 'All', icon: 'lucide:inbox', count: filteredConversations.value.length },
])

const quickFilters = computed<FilterItem[]>(() => {
  const allConvs = filteredConversations.value
  return [
    { key: 'all', label: 'Check-in Today', icon: 'lucide:calendar-check', count: allConvs.filter(c => c.labels.includes('check-in-today')).length },
    { key: 'all', label: 'Unassigned', icon: 'lucide:user-x', count: allConvs.filter(c => !c.isAssignedToMe).length },
  ]
})

function setFilter(key: ConversationStatus | 'all') {
  activeFilter.value = key
}
</script>

<template>
  <div
    :data-collapsed="isCollapsed"
    class="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
  >
    <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      <template v-for="filter of statusFilters" :key="filter.key + filter.label">
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
              @click.prevent="setFilter(filter.key)"
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
          @click.prevent="setFilter(filter.key)"
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

    <Separator />

    <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      <template v-for="filter of quickFilters" :key="'quick-' + filter.label">
        <Tooltip v-if="isCollapsed" :delay-duration="0">
          <TooltipTrigger as-child>
            <a
              href="#"
              :class="cn(
                buttonVariants({ variant: 'ghost', size: 'icon' }),
                'h-9 w-9',
              )"
              @click.prevent="setFilter(filter.key)"
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
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'justify-start',
          )"
          @click.prevent="setFilter(filter.key)"
        >
          <Icon :name="filter.icon" class="mr-2 size-4" />
          {{ filter.label }}
          <span v-if="filter.count > 0" class="ml-auto text-muted-foreground">
            {{ filter.count }}
          </span>
        </a>
      </template>
    </nav>
  </div>
</template>