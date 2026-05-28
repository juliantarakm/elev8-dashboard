<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { INVENTORY_CATEGORIES } from '@/components/inventory/data/catalog'
import type { InventoryItem } from '@/components/inventory/data/catalog'
import { useInventoryCatalog } from '@/composables/useInventoryCatalog'

const { filteredItems, searchValue, activeCategoryFilter, activeTypeFilter, deleteItem } = useInventoryCatalog()

const drawerOpen = ref(false)
const selectedItem = ref<InventoryItem | null>(null)

function openAdd() {
  selectedItem.value = null
  drawerOpen.value = true
}

function openEdit(item: InventoryItem) {
  selectedItem.value = item
  drawerOpen.value = true
}

function handleDelete(item: InventoryItem) {
  deleteItem(item.id)
  toast.success(`"${item.name}" removed from catalog`)
}

function warrantyStatus(expiry?: string): 'expired' | 'soon' | 'ok' | 'none' {
  if (!expiry) return 'none'
  const exp = new Date(expiry)
  const now = new Date()
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'expired'
  if (diff <= 30) return 'soon'
  return 'ok'
}

function formatIDR(val?: number) {
  if (val === undefined || val === null) return '—'
  return `IDR ${val.toLocaleString('id-ID')}`
}

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-48">
        <Icon name="lucide:search" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchValue" placeholder="Search items..." class="pl-8" />
      </div>

      <div class="flex flex-wrap gap-1.5">
        <Button
          v-for="cat in ['all', ...INVENTORY_CATEGORIES]"
          :key="cat"
          :variant="activeCategoryFilter === cat ? 'default' : 'outline'"
          size="sm"
          class="h-8"
          @click="activeCategoryFilter = cat as typeof activeCategoryFilter"
        >
          {{ cat === 'all' ? 'All' : cat }}
        </Button>
      </div>

      <Select v-model="activeTypeFilter">
        <SelectTrigger class="w-36 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="permanent">Permanent</SelectItem>
          <SelectItem value="consumable">Consumable</SelectItem>
        </SelectContent>
      </Select>

      <div class="ml-auto">
        <Button size="sm" @click="openAdd">
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-12" />
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Purchase Value</TableHead>
            <TableHead>Warranty</TableHead>
            <TableHead class="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="item in filteredItems"
            :key="item.id"
            class="cursor-pointer"
            @click="openEdit(item)"
          >
            <TableCell>
              <div class="w-9 h-9 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                <img v-if="item.photo" :src="item.photo" class="w-full h-full object-cover" :alt="item.name" />
                <Icon v-else name="lucide:package" class="h-4 w-4 text-muted-foreground" />
              </div>
            </TableCell>
            <TableCell class="font-medium">{{ item.name }}</TableCell>
            <TableCell>
              <Badge variant="outline">{{ item.category }}</Badge>
            </TableCell>
            <TableCell>
              <Badge :variant="item.type === 'permanent' ? 'secondary' : 'outline'" class="capitalize">
                {{ item.type }}
              </Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ item.unit }}</TableCell>
            <TableCell class="text-muted-foreground">{{ formatIDR(item.purchaseValue) }}</TableCell>
            <TableCell>
              <template v-if="warrantyStatus(item.warrantyExpiry) === 'none'">
                <span class="text-muted-foreground">—</span>
              </template>
              <Badge
                v-else-if="warrantyStatus(item.warrantyExpiry) === 'expired'"
                variant="destructive"
              >
                Expired
              </Badge>
              <Badge
                v-else-if="warrantyStatus(item.warrantyExpiry) === 'soon'"
                class="bg-amber-100 text-amber-700 border-amber-200"
              >
                Expiring soon
              </Badge>
              <span v-else class="text-sm text-muted-foreground">
                {{ formatDate(item.warrantyExpiry) }}
              </span>
            </TableCell>
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Icon name="lucide:ellipsis" class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="openEdit(item)">
                    <Icon name="lucide:pencil" class="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive" @click="handleDelete(item)">
                    <Icon name="lucide:trash-2" class="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          <TableRow v-if="filteredItems.length === 0">
            <TableCell colspan="8" class="text-center text-muted-foreground py-10">
              No items found.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <InventoryItemDrawer v-model:open="drawerOpen" :item="selectedItem" />
  </div>
</template>
