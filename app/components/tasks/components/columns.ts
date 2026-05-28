import type { ColumnDef } from '@tanstack/vue-table'
import type { Task } from '../data/schema'
import { h } from 'vue'
import { Icon } from '#components'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { labels, priorities, statuses } from '../data/data'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import DataTableRowActions from './DataTableRowActions.vue'

export function shortListingName(name: string): string {
  if (!name) return '—'
  if (name.startsWith('BRATAN')) return 'BRATAN'
  if (name.startsWith('TAMBORA')) return 'TAMBORA'
  return name.replace('The R Villa ', 'Villa ')
}

export const columns: ColumnDef<Task>[] = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:checked': value => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Select all',
      'class': 'translate-y-0.5',
    }),
    cell: ({ row }) => h(Checkbox, {
      'checked': row.getIsSelected(),
      'onUpdate:checked': value => row.toggleSelected(!!value),
      'ariaLabel': 'Select row',
      'class': 'translate-y-0.5',
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Task' }),
    cell: ({ row }) => h('div', { class: 'w-20 text-sm text-muted-foreground' }, row.getValue('id')),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Title' }),
    cell: ({ row }) => {
      const label = labels.find(l => l.value === row.original.label)
      return h('div', { class: 'flex space-x-2' }, [
        label ? h(Badge, { variant: 'outline' }, () => label.label) : null,
        h('span', { class: 'max-w-[300px] truncate font-medium' }, row.getValue('title')),
      ])
    },
  },
  {
    accessorKey: 'listing',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Listing' }),
    cell: ({ row }) => {
      const listing = row.getValue('listing') as string | undefined
      if (!listing) return h('span', { class: 'text-muted-foreground text-sm' }, '—')
      return h('span', { class: 'text-sm', title: listing }, shortListingName(listing))
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'inventoryLink',
    header: 'Inventory',
    cell: ({ row }) => {
      const itemName = row.original.linkedInventoryItemName
      const detected = row.original.detectedByHostBuddy
      if (!itemName) return h('span', { class: 'text-muted-foreground text-sm' }, '—')
      return h('div', { class: 'flex items-center gap-1.5' }, [
        detected
          ? h(Icon, { name: 'lucide:sparkles', class: 'h-3 w-3 shrink-0 text-[#C8A84B]' })
          : null,
        h(Badge, { variant: 'outline', class: 'text-xs font-normal' }, () => itemName),
      ])
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const status = statuses.find(s => s.value === row.getValue('status'))
      if (!status) return null
      return h('div', { class: 'flex w-[110px] items-center' }, [
        status.icon && h(status.icon, { class: 'mr-2 h-4 w-4 text-muted-foreground' }),
        h('span', status.label),
      ])
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'priority',
    header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Priority' }),
    cell: ({ row }) => {
      const priority = priorities.find(p => p.value === row.getValue('priority'))
      if (!priority) return null
      return h('div', { class: 'flex items-center' }, [
        priority.icon && h(priority.icon, { class: 'mr-2 h-4 w-4 text-muted-foreground' }),
        h('span', {}, priority.label),
      ])
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'actions',
    cell: ({ row }) => h(DataTableRowActions, { row }),
  },
]
