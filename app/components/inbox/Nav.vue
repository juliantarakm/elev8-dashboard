<script lang="ts" setup>
import type { ConversationStatus } from '~/components/inbox/data/conversations'
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
            <button
              :class="cn(
                'inline-flex items-center justify-center rounded-md h-9 w-9 transition-colors',
                activeFilter === filter.key
                  ? 'bg-[#C8A84B]/15 text-[#C8A84B]'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )"
              @click="setFilter(filter.key)"
            >
              <Icon :name="filter.icon" class="size-4" />
              <span class="sr-only">{{ filter.label }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" class="flex items-center gap-4">
            {{ filter.label }}
            <span class="ml-auto text-muted-foreground">{{ filter.count }}</span>
          </TooltipContent>
        </Tooltip>

        <button
          v-else
          :class="cn(
            'inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm font-medium transition-colors border-l-2',
            activeFilter === filter.key
              ? 'border-[#C8A84B] bg-[#C8A84B]/10 text-[#C8A84B]'
              : 'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )"
          @click="setFilter(filter.key)"
        >
          <Icon :name="filter.icon" class="size-4" />
          {{ filter.label }}
          <span class="ml-auto">{{ filter.count }}</span>
        </button>
      </template>
    </nav>

    <Separator />

    <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      <template v-for="filter of quickFilters" :key="'quick-' + filter.label">
        <Tooltip v-if="isCollapsed" :delay-duration="0">
          <TooltipTrigger as-child>
            <button
              class="inline-flex items-center justify-center rounded-md h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              @click="setFilter(filter.key)"
            >
              <Icon :name="filter.icon" class="size-4" />
              <span class="sr-only">{{ filter.label }}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {{ filter.label }}
            <span class="ml-auto text-muted-foreground">{{ filter.count }}</span>
          </TooltipContent>
        </Tooltip>

        <button
          v-else
          class="inline-flex items-center gap-2 rounded-md px-3 h-9 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          @click="setFilter(filter.key)"
        >
          <Icon :name="filter.icon" class="size-4" />
          {{ filter.label }}
          <span class="ml-auto">{{ filter.count }}</span>
        </button>
      </template>
    </nav>
  </div>
</template>