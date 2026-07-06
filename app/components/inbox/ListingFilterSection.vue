<script lang="ts" setup>
import { buttonVariants } from '~/components/ui/button'
import { cn } from '~/lib/utils'

interface ListingOption {
  name: string
  count: number
}

interface ListingFilterSectionProps {
  options: ListingOption[]
  activeFilter: string[]
  toggle: (name: string) => void
  clearAll: () => void
  hasAnyFilter: boolean
  searchText: string
  showTags?: boolean
  tagOptions?: Array<{ tag: string, count: number }>
  activeTags?: string[]
  toggleTag?: (tag: string) => void
  clearTags?: () => void
}

const props = defineProps<ListingFilterSectionProps>()
const emit = defineEmits<{
  'update:searchText': [value: string]
}>()

const localTagSearch = ref('')
const filteredTagOptions = computed(() => {
  if (!props.showTags || !props.tagOptions)
    return []
  if (!localTagSearch.value)
    return props.tagOptions
  const q = localTagSearch.value.toLowerCase()
  return props.tagOptions.filter(t => t.tag.toLowerCase().includes(q))
})
</script>

<template>
  <div class="flex flex-col gap-2 px-2">
    <!-- Search + Tags button row -->
    <div class="flex items-center gap-1.5">
      <div class="relative min-w-0 flex-1">
        <Icon name="lucide:search" class="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          :model-value="searchText"
          @update:model-value="(v: string) => emit('update:searchText', v)"
          placeholder="Search listings..."
          class="h-7 pl-7 text-xs"
        />
      </div>
      <Popover v-if="showTags">
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="h-7 shrink-0 gap-1 px-2 text-xs">
            <Icon name="lucide:tags" class="size-3.5" />
            Tags
            <span v-if="activeTags && activeTags.length > 0" class="rounded-full bg-primary px-1.5 text-[10px] leading-none text-primary-foreground">{{ activeTags.length }}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          class="w-56 p-0 overflow-hidden"
          align="end"
          :side-offset="4"
          :style="{ maxHeight: '320px', height: '320px', display: 'flex', flexDirection: 'column' }"
        >
          <div class="p-2 border-b shrink-0">
            <Input v-model="localTagSearch" placeholder="Search tags..." class="h-7 text-xs" />
          </div>
          <ScrollArea class="flex-1 min-h-0 overflow-y-auto">
            <div class="px-2 py-2">
              <div
                v-for="tagItem of filteredTagOptions"
                :key="tagItem.tag"
                class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                @click="toggleTag && toggleTag(tagItem.tag)"
              >
                <div
                  :class="cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-[4px] border',
                    activeTags && activeTags.includes(tagItem.tag)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input',
                  )"
                >
                  <Icon v-if="activeTags && activeTags.includes(tagItem.tag)" name="lucide:check" class="size-3" />
                </div>
                <span class="flex-1 truncate">{{ tagItem.tag }}</span>
                <span class="text-muted-foreground text-xs">{{ tagItem.count }}</span>
              </div>
              <div v-if="filteredTagOptions.length === 0" class="py-4 text-center text-sm text-muted-foreground">
                No tags found.
              </div>
            </div>
          </ScrollArea>
          <div v-if="activeTags && activeTags.length > 0" class="border-t px-2 py-1.5 shrink-0">
            <Button variant="ghost" size="sm" class="h-6 w-full text-xs text-muted-foreground" @click="clearTags && clearTags()">
              Clear all tags
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        v-if="hasAnyFilter"
        variant="ghost"
        size="icon"
        class="h-7 w-7 shrink-0"
        @click="clearAll"
      >
        <Icon name="lucide:x" class="size-3.5" />
      </Button>
    </div>

    <!-- Selected tag chips -->
    <div v-if="showTags && activeTags && activeTags.length > 0" class="flex flex-wrap gap-1">
      <Badge
        v-for="tag of activeTags"
        :key="tag"
        variant="default"
        class="cursor-pointer select-none gap-0.5 text-[11px]"
        @click="toggleTag && toggleTag(tag)"
      >
        {{ tag }}
        <Icon name="lucide:x" class="size-3" />
      </Badge>
    </div>

    <!-- Listing list with check indicators -->
    <nav class="grid gap-0.5">
      <template v-for="listing of options" :key="listing.name">
        <button
          type="button"
          :class="cn(
            buttonVariants({ variant: activeFilter.includes(listing.name) ? 'default' : 'ghost', size: 'sm' }),
            activeFilter.includes(listing.name)
              && 'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
            'w-full justify-start gap-2 min-w-0',
          )"
          @click="toggle(listing.name)"
        >
          <div
            :class="cn(
              'flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border',
              activeFilter.includes(listing.name)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input',
            )"
          >
            <Icon v-if="activeFilter.includes(listing.name)" name="lucide:check" class="size-2.5" />
          </div>
          <span class="truncate">{{ listing.name }}</span>
        </button>
      </template>
    </nav>
  </div>
</template>
