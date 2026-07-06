<script lang="ts" setup>
import type { StayStatus } from '~/components/inbox/data/conversations'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface NavProps {
  isCollapsed: boolean
}

defineProps<NavProps>()

const { showActionNeeded, unreadFilter, assignedToMeFilter, activeStayFilter, activeDateFilter, activeListingFilter, activeTagFilters, listingSearchText, stayCountByStatus, allListingOptions, listingOptions, listingTags, toggleListingFilter, clearListingFilters, toggleTagFilter, clearTagFilters, clearAllListingFilters, totalCount, inboxView } = useInbox()

const { activeCallsFilter, callsCountByStatus, activeListingFilter: callsActiveListingFilter, toggleListingFilter: callsToggleListingFilter, clearListingFilters: callsClearListingFilters, listingOptions: callsListingOptions, listingSearchText: callsListingSearchText, activeTagFilters: callsActiveTagFilters, toggleTagFilter: callsToggleTagFilter, clearTagFilters: callsClearTagFilters, listingTags: callsListingTags } = useCallsFilters()

const stayFilters = computed(() => [
  { key: 'current' as StayStatus, label: 'Current', icon: 'lucide:home', count: stayCountByStatus('current') },
  { key: 'future' as StayStatus, label: 'Future', icon: 'lucide:calendar-plus', count: stayCountByStatus('future') },
  { key: 'past' as StayStatus, label: 'Past', icon: 'lucide:history', count: stayCountByStatus('past') },
  { key: 'inquiry' as StayStatus, label: 'Inquiry', icon: 'lucide:help-circle', count: stayCountByStatus('inquiry') },
  { key: 'unmatched' as StayStatus, label: 'Unmatched', icon: 'lucide:user-x', count: stayCountByStatus('unmatched') },
])

const callsFilters = computed(() => [
  { key: 'completed' as const, label: 'Completed', icon: 'lucide:phone-incoming', count: callsCountByStatus('completed') },
  { key: 'missed' as const, label: 'Missed', icon: 'lucide:phone-missed', count: callsCountByStatus('missed') },
  { key: 'voicemail' as const, label: 'Voicemail', icon: 'lucide:voicemail', count: callsCountByStatus('voicemail') },
  { key: 'unmatched' as const, label: 'Unmatched', icon: 'lucide:user-x', count: callsCountByStatus('unmatched') },
])

function setCallsFilter(key: 'all' | 'completed' | 'missed' | 'voicemail' | 'unmatched') {
  activeCallsFilter.value = key
}

const hasAnyListingFilter = computed(() =>
  activeListingFilter.value.length > 0
  || activeTagFilters.value.length > 0
  || listingSearchText.value,
)

const hasAnyCallsListingFilter = computed(() =>
  callsActiveListingFilter.value.length > 0
  || callsListingSearchText.value,
)

function setStayFilter(key: StayStatus | 'all') {
  activeStayFilter.value = key
}

function clearStayFilter() {
  activeStayFilter.value = 'all'
}

function clearAll() {
  showActionNeeded.value = false
  unreadFilter.value = false
  assignedToMeFilter.value = false
  activeStayFilter.value = 'all'
  activeDateFilter.value = null
}

function clearAllCalls() {
  activeCallsFilter.value = 'all'
}
</script>

<template>
  <div
    :data-collapsed="isCollapsed"
    class="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
  >
    <div>
      <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        <template v-if="inboxView === 'conversations'">
          <Tooltip v-if="isCollapsed" :delay-duration="0">
            <TooltipTrigger as-child>
              <a
                href="#"
                :class="cn(buttonVariants({ variant: activeStayFilter === 'all' && !showActionNeeded && !unreadFilter && !assignedToMeFilter ? 'default' : 'ghost', size: 'icon' }), 'h-9 w-9')"
                @click.prevent="clearAll()"
              >
                <Icon name="lucide:inbox" class="size-4" />
                <span class="sr-only">All</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" class="flex items-center gap-4">
              All
              <span class="ml-auto text-muted-foreground">{{ totalCount() }}</span>
            </TooltipContent>
          </Tooltip>
          <a
            v-else
            href="#"
            :class="cn(
              buttonVariants({ variant: activeStayFilter === 'all' && !showActionNeeded && !unreadFilter && !assignedToMeFilter ? 'default' : 'ghost', size: 'sm' }),
              'justify-start',
            )"
            @click.prevent="clearAll()"
          >
            <Icon name="lucide:inbox" class="mr-2 size-4" />
            All
            <span
              v-if="totalCount() > 0"
              class="ml-auto text-muted-foreground"
            >
              {{ totalCount() }}
            </span>
          </a>

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
                class="ml-auto text-muted-foreground"
              >
                {{ filter.count }}
              </span>
            </a>
          </template>
        </template>

        <template v-else>
          <Tooltip v-if="isCollapsed" :delay-duration="0">
            <TooltipTrigger as-child>
              <a
                href="#"
                :class="cn(buttonVariants({ variant: activeCallsFilter === 'all' ? 'default' : 'ghost', size: 'icon' }), 'h-9 w-9')"
                @click.prevent="clearAllCalls()"
              >
                <Icon name="lucide:phone" class="size-4" />
                <span class="sr-only">All</span>
              </a>
            </TooltipTrigger>
            <TooltipContent side="right" class="flex items-center gap-4">
              All
              <span class="ml-auto text-muted-foreground">{{ callsCountByStatus('all') }}</span>
            </TooltipContent>
          </Tooltip>
          <a
            v-else
            href="#"
            :class="cn(
              buttonVariants({ variant: activeCallsFilter === 'all' ? 'default' : 'ghost', size: 'sm' }),
              'justify-start',
            )"
            @click.prevent="clearAllCalls()"
          >
            <Icon name="lucide:phone" class="mr-2 size-4" />
            All
            <span
              v-if="callsCountByStatus('all') > 0"
              class="ml-auto text-muted-foreground"
            >
              {{ callsCountByStatus('all') }}
            </span>
          </a>

          <template v-for="filter of callsFilters" :key="filter.key">
            <Tooltip v-if="isCollapsed" :delay-duration="0">
              <TooltipTrigger as-child>
                <a
                  href="#"
                  :class="cn(
                    buttonVariants({ variant: activeCallsFilter === filter.key ? 'default' : 'ghost', size: 'icon' }),
                    'h-9 w-9',
                    activeCallsFilter === filter.key
                      && 'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
                  )"
                  @click.prevent="setCallsFilter(filter.key)"
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
                buttonVariants({ variant: activeCallsFilter === filter.key ? 'default' : 'ghost', size: 'sm' }),
                activeCallsFilter === filter.key
                  && 'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
                'justify-start',
              )"
              @click.prevent="setCallsFilter(filter.key)"
            >
              <Icon :name="filter.icon" class="mr-2 size-4" />
              {{ filter.label }}
              <span
                v-if="filter.count > 0"
                class="ml-auto text-muted-foreground"
              >
                {{ filter.count }}
              </span>
            </a>
          </template>
        </template>
      </nav>
    </div>

    <Separator />

    <!-- Collapsed: single icon button -->
    <div v-if="isCollapsed" class="flex flex-col items-center gap-1 px-2">
      <Tooltip :delay-duration="0">
        <TooltipTrigger as-child>
          <a
            href="#"
            :class="cn(buttonVariants({ variant: hasAnyListingFilter ? 'default' : 'ghost', size: 'icon' }), 'h-9 w-9')"
            @click.prevent
          >
            <Icon name="lucide:building" class="size-4" />
            <span class="sr-only">Listings</span>
          </a>
        </TooltipTrigger>
        <TooltipContent side="right" class="flex items-center gap-4">
          Listings
          <span v-if="activeListingFilter.length > 0" class="ml-auto text-muted-foreground">{{ activeListingFilter.length }} selected</span>
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Expanded: search, tags popover, chips, listing checkboxes (conversations only) -->
    <InboxListingFilterSection
      v-if="inboxView === 'conversations' && !isCollapsed"
      v-model:search-text="listingSearchText"
      :options="listingOptions"
      :active-filter="activeListingFilter"
      :toggle="toggleListingFilter"
      :clear-all="clearAllListingFilters"
      :has-any-filter="hasAnyListingFilter"
      :show-tags="true"
      :tag-options="listingTags"
      :active-tags="activeTagFilters"
      :toggle-tag="toggleTagFilter"
      :clear-tags="clearTagFilters"
    />

    <!-- Calls: listing filter (with tags) -->
    <InboxListingFilterSection
      v-else-if="inboxView === 'calls' && !isCollapsed"
      v-model:search-text="callsListingSearchText"
      :options="callsListingOptions"
      :active-filter="callsActiveListingFilter"
      :toggle="callsToggleListingFilter"
      :clear-all="callsClearListingFilters"
      :has-any-filter="hasAnyCallsListingFilter"
      :show-tags="true"
      :tag-options="callsListingTags"
      :active-tags="callsActiveTagFilters"
      :toggle-tag="callsToggleTagFilter"
      :clear-tags="callsClearTagFilters"
    />
  </div>
</template>
