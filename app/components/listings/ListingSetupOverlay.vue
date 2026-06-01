<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'
import ListingSetupFieldPanel from '~/components/listings/ListingSetupFieldPanel.vue'
import ListingSetupResourcePanel from '~/components/listings/ListingSetupResourcePanel.vue'

const props = defineProps<{ listing: Listing, open: boolean }>()
const emit = defineEmits<{ 'update:open': [val: boolean], 'update': [listing: Listing] }>()

const showResources = ref(false)
const viewMode = ref<'property' | 'unit'>('property')

const units = computed(() => props.listing.units ?? [])
const activeUnitId = ref(props.listing.activeUnitId ?? units.value[0]?.id ?? '')
const activeUnit = computed(() => units.value.find(u => u.id === activeUnitId.value))

function selectUnit(id: string) {
  activeUnitId.value = id
  viewMode.value = 'unit'
}

function copyToOtherUnits() {
  const active = activeUnit.value
  if (!active)
    return
  emit('update', {
    ...props.listing,
    units: props.listing.units?.map(u => u.id === active.id ? u : { ...u, capacity: active.capacity }),
  })
  toast.success(`Copied "${active.name}" settings to other units`)
}

function saveChanges() {
  toast.success('Changes saved successfully')
  emit('update:open', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex flex-col bg-background">
      <!-- Header -->
      <div class="flex items-center justify-between border-b px-4 py-3 flex-shrink-0 gap-2">
        <!-- Left spacer (mobile: resources toggle) -->
        <div class="flex items-center gap-1 min-w-[80px]">
          <Button variant="ghost" size="sm" class="lg:hidden gap-1.5 text-xs h-8" @click="showResources = !showResources">
            <Icon name="lucide:database" class="size-3.5" />
            <span class="hidden sm:inline">Resources</span>
          </Button>
        </div>

        <!-- Center: title -->
        <div class="flex flex-col items-center gap-1 flex-1 text-center min-w-0">
          <div class="flex items-center gap-2">
            <Icon name="lucide:layout-panel-left" class="size-4 text-muted-foreground shrink-0" />
            <h2 class="text-base font-semibold">
              Listing Setup
            </h2>
          </div>

          <!-- Property/Unit toggle (multi-unit listings) -->
          <div v-if="units.length" class="flex items-center gap-0.5 rounded-md border p-0.5">
            <Button
              :variant="viewMode === 'property' ? 'secondary' : 'ghost'"
              size="sm" class="h-7 gap-1.5 text-xs"
              @click="viewMode = 'property'"
            >
              <Icon name="lucide:building-2" class="size-3.5" /> Property
            </Button>

            <DropdownMenu v-if="units.length > 1">
              <DropdownMenuTrigger as-child>
                <Button :variant="viewMode === 'unit' ? 'secondary' : 'ghost'" size="sm" class="h-7 gap-1.5 text-xs">
                  <Icon name="lucide:door-open" class="size-3.5" />
                  {{ viewMode === 'unit' ? activeUnit?.name : 'Unit' }}
                  <Icon name="lucide:chevron-down" class="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" class="w-48">
                <DropdownMenuItem v-for="u in units" :key="u.id" class="cursor-pointer gap-2" @click="selectUnit(u.id)">
                  <Icon
                    :name="activeUnitId === u.id && viewMode === 'unit' ? 'lucide:check' : 'lucide:door-open'"
                    class="size-3.5"
                    :class="activeUnitId === u.id && viewMode === 'unit' ? 'text-primary' : 'text-muted-foreground'"
                  />
                  <span class="flex-1 truncate">{{ u.name }}</span>
                  <span class="text-xs text-muted-foreground">{{ u.capacity }}p</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              v-else
              :variant="viewMode === 'unit' ? 'secondary' : 'ghost'"
              size="sm" class="h-7 gap-1.5 text-xs"
              @click="viewMode = 'unit'"
            >
              <Icon name="lucide:door-open" class="size-3.5" /> Unit
            </Button>
          </div>

          <span v-else class="text-xs text-muted-foreground truncate w-full">{{ listing.name }}</span>
        </div>

        <!-- Right: close -->
        <div class="flex items-center min-w-[80px] justify-end">
          <Button variant="ghost" size="sm" class="gap-1.5 h-8" @click="emit('update:open', false)">
            <Icon name="lucide:x" class="size-4" />
            <span class="hidden sm:inline">Close</span>
          </Button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Field panel — full width on mobile, flex-1 on lg -->
        <div class="flex-1 overflow-hidden" :class="showResources ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'">
          <ListingSetupFieldPanel
            :listing="listing"
            :view-mode="viewMode"
            :active-unit-id="activeUnitId"
            @update="emit('update', $event)"
          />
        </div>

        <!-- Resource panel — sheet-like on mobile (full screen), fixed sidebar on lg -->
        <div
          class="overflow-hidden border-l"
          :class="showResources
            ? 'flex flex-col flex-1 lg:flex-none lg:w-[300px]'
            : 'hidden lg:flex lg:flex-col lg:w-[300px]'"
        >
          <ListingSetupResourcePanel :listing="listing" @update="emit('update', $event)" />
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between border-t px-4 py-3 flex-shrink-0 gap-3">
        <!-- Copy to other units (unit view only) -->
        <div>
          <Button
            v-if="viewMode === 'unit' && units.length > 1"
            variant="outline" size="sm" class="gap-1.5"
            @click="copyToOtherUnits"
          >
            <Icon name="lucide:copy" class="size-3.5" />
            Copy to Other Units
          </Button>
        </div>

        <!-- Save button -->
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="sm" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button size="sm" @click="saveChanges">
            <Icon name="lucide:check" class="size-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
