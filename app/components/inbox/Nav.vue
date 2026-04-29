<script lang="ts" setup>
import type { StayStatus } from '~/components/inbox/data/conversations'
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface NavProps {
  isCollapsed: boolean
}

defineProps<NavProps>()

const { showActionNeeded, unreadFilter, assignedToMeFilter, activeStayFilter, activeListingFilter, activeTagFilters, listingSearchText, stayCountByStatus, allListingOptions, listingOptions, listingTags, toggleListingFilter, clearListingFilters, toggleTagFilter, clearTagFilters, clearAllListingFilters, totalCount } = useInbox()

const stayFilters = computed(() => [
  { key: 'current' as StayStatus, label: 'Current', icon: 'lucide:home', count: stayCountByStatus('current') },
  { key: 'future' as StayStatus, label: 'Future', icon: 'lucide:calendar-plus', count: stayCountByStatus('future') },
  { key: 'past' as StayStatus, label: 'Past', icon: 'lucide:history', count: stayCountByStatus('past') },
  { key: 'inquiry' as StayStatus, label: 'Inquiry', icon: 'lucide:help-circle', count: stayCountByStatus('inquiry') },
])

const tagSearch = ref('')

const filteredTags = computed(() => {
  if (!tagSearch.value) return listingTags.value
  const q = tagSearch.value.toLowerCase()
  return listingTags.value.filter(t => t.tag.toLowerCase().includes(q))
})

const hasAnyListingFilter = computed(() =>
  activeListingFilter.value.length > 0
  || activeTagFilters.value.length > 0
  || listingSearchText.value,
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
</script>

<template>
  <div
    :data-collapsed="isCollapsed"
    class="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
  >
    <div>
      <nav class="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
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

    <!-- Expanded: search, tags popover, chips, listing checkboxes -->
    <div v-else class="flex flex-col gap-2 px-2">
      <!-- Search + Tags button row -->
      <div class="flex items-center gap-1.5">
        <div class="relative min-w-0 flex-1">
          <Icon name="lucide:search" class="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="listingSearchText"
            placeholder="Search listings..."
            class="h-7 pl-7 text-xs"
          />
        </div>
        <Popover>
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" class="h-7 shrink-0 gap-1 px-2 text-xs">
              <Icon name="lucide:tags" class="size-3.5" />
              Tags
              <span v-if="activeTagFilters.length > 0" class="rounded-full bg-primary px-1.5 text-[10px] leading-none text-primary-foreground">{{ activeTagFilters.length }}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-56 p-0" align="start" :side-offset="4">
            <div class="p-2">
              <Input v-model="tagSearch" placeholder="Search tags..." class="h-7 text-xs" />
            </div>
            <ScrollArea class="max-h-48">
              <div class="px-2 pb-2">
                <div
                  v-for="tagItem of filteredTags"
                  :key="tagItem.tag"
                  class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  @click="toggleTagFilter(tagItem.tag)"
                >
                  <div :class="cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                    activeTagFilters.includes(tagItem.tag)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input',
                  )">
                    <Icon v-if="activeTagFilters.includes(tagItem.tag)" name="lucide:check" class="size-3" />
                  </div>
                  <span class="flex-1 truncate">{{ tagItem.tag }}</span>
                  <span class="text-muted-foreground text-xs">{{ tagItem.count }}</span>
                </div>
                <div v-if="filteredTags.length === 0" class="py-4 text-center text-sm text-muted-foreground">
                  No tags found.
                </div>
              </div>
            </ScrollArea>
            <div v-if="activeTagFilters.length > 0" class="border-t px-2 py-1.5">
              <Button variant="ghost" size="sm" class="h-6 w-full text-xs text-muted-foreground" @click="clearTagFilters()">
                Clear all tags
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          v-if="hasAnyListingFilter"
          variant="ghost"
          size="icon"
          class="h-7 w-7 shrink-0"
          @click="clearAllListingFilters()"
        >
          <Icon name="lucide:x" class="size-3.5" />
        </Button>
      </div>

      <!-- Selected tag chips -->
      <div v-if="activeTagFilters.length > 0" class="flex flex-wrap gap-1">
        <Badge
          v-for="tag of activeTagFilters"
          :key="tag"
          variant="default"
          class="cursor-pointer select-none gap-0.5 text-[11px]"
          @click="toggleTagFilter(tag)"
        >
          {{ tag }}
          <Icon name="lucide:x" class="size-3" />
        </Badge>
      </div>

      <!-- Listing list with check indicators -->
      <nav class="grid gap-0.5">
        <template v-for="listing of listingOptions" :key="listing.name">
          <button
            type="button"
            :class="cn(
              buttonVariants({ variant: activeListingFilter.includes(listing.name) ? 'default' : 'ghost', size: 'sm' }),
              activeListingFilter.includes(listing.name)
                && 'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
              'w-full justify-start gap-2 min-w-0',
            )"
            @click="toggleListingFilter(listing.name)"
          >
            <div :class="cn(
              'flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border',
              activeListingFilter.includes(listing.name)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input',
            )">
              <Icon v-if="activeListingFilter.includes(listing.name)" name="lucide:check" class="size-2.5" />
            </div>
            <span class="truncate">{{ listing.name }}</span>
          </button>
        </template>
      </nav>
    </div>
  </div>
</template>