<script setup lang="ts">
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/vue-table'
import type { Listing } from '~/components/listings/data/listings'
import {
  FlexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { valueUpdater } from '~/lib/utils'
import { listings, allTags, aiStatusOptions, aiStatusLabels } from '~/components/listings/data/listings'
import { Badge } from '~/components/ui/badge'
import { Icon } from '#components'
import ListingRowActions from '~/components/listings/ListingRowActions.vue'

const searchValue = ref('')

const filteredData = computed(() => {
  if (!searchValue.value) return listings
  const q = searchValue.value.toLowerCase()
  return listings.filter(l =>
    l.name.toLowerCase().includes(q)
    || l.location.toLowerCase().includes(q)
    || l.tags.some(t => t.toLowerCase().includes(q)),
  )
})

const aiStatusIcon: Record<string, string> = {
  active: 'lucide:bot',
  paused: 'lucide:bot-off',
  not_set: 'lucide:bot-off',
}

const aiStatusColor: Record<string, string> = {
  active: 'text-green-600',
  paused: 'text-amber-500',
  not_set: 'text-muted-foreground',
}

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const columns: ColumnDef<Listing, any>[] = [
  {
    accessorKey: 'name',
    header: 'Listing Name',
    enableHiding: false,
    cell: ({ row }) => h('div', { class: 'max-w-[300px] truncate font-medium' }, row.getValue('name')),
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }) => h('span', { class: 'text-muted-foreground text-sm' }, row.getValue('location')),
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    filterFn: (row, _id, filterValue) => {
      const tags = row.getValue('tags') as string[]
      if (!filterValue) return true
      return Array.isArray(filterValue) ? filterValue.every((f: string) => tags.includes(f)) : tags.includes(filterValue)
    },
    cell: ({ row }) => {
      const tags = row.getValue('tags') as string[]
      return h('div', { class: 'flex flex-wrap gap-1' },
        tags.map(tag => h(Badge, { variant: 'outline', class: 'text-[10px] px-1.5 py-0' }, () => tag)),
      )
    },
  },
  {
    accessorKey: 'aiStatus',
    header: 'AI Status',
    filterFn: (row, _id, filterValue) => {
      const status = row.getValue('aiStatus') as string
      if (!filterValue) return true
      return status === filterValue
    },
    cell: ({ row }) => {
      const status = row.getValue('aiStatus') as string
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h(Icon, { name: aiStatusIcon[status] || 'lucide:bot', class: `size-4 ${aiStatusColor[status] || ''}` }),
        h('span', { class: 'text-sm' }, aiStatusLabels[status] || status),
      ])
    },
  },
  {
    accessorKey: 'otaConnected',
    header: 'OTA',
    cell: ({ row }) => {
      const otas = row.getValue('otaConnected') as string[]
      return h('div', { class: 'flex items-center gap-2' },
        otas.map(ota => h(Icon, { name: otaIcon(ota), class: 'size-4', key: ota })),
      )
    },
  },
  {
    accessorKey: 'amenities',
    header: 'Amenities',
    cell: ({ row }) => {
      const amenities = row.getValue('amenities') as string[]
      return h('span', { class: 'text-muted-foreground text-sm truncate max-w-[200px] block' }, amenities.join(', '))
    },
  },
  {
    accessorKey: 'room',
    header: 'Room Type',
    cell: ({ row }) => h('span', { class: 'text-muted-foreground text-sm' }, row.getValue('room')),
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => null,
    size: 40,
    cell: ({ row }) => h(ListingRowActions, { listing: row.original }),
  },
]

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({
  amenities: false,
  room: false,
})

const table = useVueTable({
  get data() { return filteredData.value },
  get columns() { return columns },
  initialState: {
    pagination: { pageSize: 15 },
  },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
  },
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})

const toggleableColumns = computed(() =>
  table.getAllColumns().filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide()),
)

const columnLabels: Record<string, string> = {
  name: 'Listing Name',
  location: 'Location',
  tags: 'Tags',
  aiStatus: 'AI Status',
  otaConnected: 'OTA',
  amenities: 'Amenities',
  room: 'Room Type',
}

const activeTagFilter = ref<string[]>([])
const activeAiFilter = ref<string | null>(null)
const tagSearch = ref('')
const tagPopoverOpen = ref(false)

const filteredTags = computed(() => {
  if (!tagSearch.value) return allTags
  const q = tagSearch.value.toLowerCase()
  return allTags.filter(t => t.toLowerCase().includes(q))
})

function toggleTag(tag: string) {
  const idx = activeTagFilter.value.indexOf(tag)
  if (idx !== -1) {
    activeTagFilter.value = [...activeTagFilter.value.slice(0, idx), ...activeTagFilter.value.slice(idx + 1)]
  } else {
    activeTagFilter.value = [...activeTagFilter.value, tag]
  }
}

watch(tagPopoverOpen, (open) => {
  if (!open) tagSearch.value = ''
})

function clearFilters() {
  activeTagFilter.value = []
  activeAiFilter.value = null
}

watch(activeTagFilter, (tags) => {
  table.getColumn('tags')?.setFilterValue(tags.length > 0 ? tags : undefined)
}, { deep: true })

watch(activeAiFilter, (val) => {
  table.getColumn('aiStatus')?.setFilterValue(val)
})
</script>

<template>
  <div class="w-full flex flex-col items-stretch gap-4">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Listings
        </h2>
        <p class="text-muted-foreground">
          All properties in your Elev8 portfolio.
        </p>
      </div>
      <Badge variant="secondary" class="text-xs">
        {{ listings.length }} listings
      </Badge>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <div class="flex-1 min-w-[200px] max-w-xs">
        <Input
          v-model="searchValue"
          placeholder="Search listings..."
          class="h-9"
        />
      </div>

      <Popover v-model:open="tagPopoverOpen">
        <PopoverTrigger as-child>
          <Button variant="outline" size="sm" class="h-9 gap-1.5 text-xs" :class="activeTagFilter.length > 0 ? 'border-primary text-primary' : ''">
            <Icon name="lucide:tag" class="size-3.5" />
            Tags
            <Badge v-if="activeTagFilter.length > 0" variant="default" class="ml-0.5 h-4 min-w-4 rounded-full px-1 text-[9px]">{{ activeTagFilter.length }}</Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-56 p-0" align="start" :side-offset="4">
          <div class="p-2">
            <Input v-model="tagSearch" placeholder="Search tags..." class="h-7 text-xs" />
          </div>
          <ScrollArea class="h-48 overflow-hidden">
            <div class="space-y-1">
              <div v-for="tag in filteredTags" :key="tag" class="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent" @click="toggleTag(tag)">
                <div class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border" :class="activeTagFilter.includes(tag) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'">
                  <Icon v-if="activeTagFilter.includes(tag)" name="lucide:check" class="size-3" />
                </div>
                <span class="flex-1">{{ tag }}</span>
              </div>
              <p v-if="filteredTags.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">
                No tags found.
              </p>
            </div>
          </ScrollArea>
          <div v-if="activeTagFilter.length > 0" class="border-t px-2 py-2">
            <Button variant="ghost" size="sm" class="h-7 w-full text-xs text-muted-foreground" @click="clearFilters">
              Clear all tags
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" class="h-9 gap-1.5 text-xs" :class="activeAiFilter ? 'border-primary text-primary' : ''">
            <Icon :name="(activeAiFilter && aiStatusIcon[activeAiFilter]) || 'lucide:bot'" class="size-3.5" />
            {{ activeAiFilter ? aiStatusLabels[activeAiFilter] : 'AI Status' }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-40">
          <DropdownMenuItem @click="activeAiFilter = null" :class="{ 'bg-accent': !activeAiFilter }">
            All Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem v-for="opt in aiStatusOptions" :key="opt.value" @click="activeAiFilter = opt.value" :class="{ 'bg-accent': activeAiFilter === opt.value }">
            <Icon :name="aiStatusIcon[opt.value] || 'lucide:bot'" class="mr-2 size-3.5" />
            {{ opt.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div v-if="activeTagFilter.length > 0 || activeAiFilter" class="flex flex-wrap items-center gap-1.5">
      <Badge
        v-for="tag in activeTagFilter"
        :key="tag"
        variant="default"
        class="cursor-pointer select-none gap-0.5 text-[11px]"
        @click="toggleTag(tag)"
      >
        {{ tag }}
        <Icon name="lucide:x" class="size-3" />
      </Badge>
      <Badge
        v-if="activeAiFilter"
        variant="default"
        class="cursor-pointer select-none gap-0.5 text-[11px]"
        @click="activeAiFilter = null"
      >
        {{ aiStatusLabels[activeAiFilter] }}
        <Icon name="lucide:x" class="size-3" />
      </Badge>
      <Button variant="ghost" size="sm" class="h-6 text-[11px] text-muted-foreground" @click="clearFilters">
        Clear all
      </Button>
    </div>

    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <template v-if="header.column.id === 'actions'">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                      <Icon name="lucide:sliders-horizontal" class="size-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      v-for="column in toggleableColumns"
                      :key="column.id"
                      class="flex items-center gap-2"
                      @click="column.toggleVisibility()"
                    >
                      <Icon v-if="column.getIsVisible()" name="lucide:check" class="size-4" />
                      <span v-else class="size-4" />
                      {{ columnLabels[column.id] || column.id }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </template>
              <FlexRender v-else-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              No listings found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between px-2">
      <div class="flex-1 text-sm text-muted-foreground">
        {{ table.getFilteredRowModel().rows.length }} listing{{ table.getFilteredRowModel().rows.length !== 1 ? 's' : '' }}
      </div>
      <div class="flex items-center space-x-6 lg:space-x-8">
        <div class="flex items-center space-x-2">
          <p class="text-sm font-medium">
            Rows per page
          </p>
          <Select
            :model-value="`${table.getState().pagination.pageSize}`"
            @update:model-value="(val) => table.setPageSize(Number(val))"
          >
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem v-for="pageSize in [10, 15, 20, 30, 50]" :key="pageSize" :value="`${pageSize}`">
                {{ pageSize }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="w-[100px] flex items-center justify-center text-sm font-medium">
          Page {{ table.getState().pagination.pageIndex + 1 }} of
          {{ table.getPageCount() }}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            class="hidden h-8 w-8 p-0 lg:flex"
            :disabled="!table.getCanPreviousPage()"
            @click="table.setPageIndex(0)"
          >
            <span class="sr-only">Go to first page</span>
            <Icon name="i-radix-icons-double-arrow-left" class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="h-8 w-8 p-0"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            <span class="sr-only">Go to previous page</span>
            <Icon name="i-radix-icons-chevron-left" class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="h-8 w-8 p-0"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            <span class="sr-only">Go to next page</span>
            <Icon name="i-radix-icons-chevron-right" class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            class="hidden h-8 w-8 p-0 lg:flex"
            :disabled="!table.getCanNextPage()"
            @click="table.setPageIndex(table.getPageCount() - 1)"
          >
            <span class="sr-only">Go to last page</span>
            <Icon name="i-radix-icons-double-arrow-right" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
