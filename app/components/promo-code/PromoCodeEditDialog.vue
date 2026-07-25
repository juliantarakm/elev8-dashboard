<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import type { PromoCode, PromoCodeDiscountType } from './data/promo-codes'
import { usePromoCodes } from '~/composables/usePromoCodes'
import { mockUpsellServices } from '~/components/upsells/data/upsell-services'
import { listings as allListings, allTags } from '~/components/listings/data/listings'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  promoCode: PromoCode | null
}>()

const emit = defineEmits<{
  updated: [codeId: string]
}>()

const { updatePromoCode, isCodeTaken } = usePromoCodes()

const code = ref('')
const description = ref('')
const discountType = ref<PromoCodeDiscountType>('%')
const value = ref<number>(10)
const currency = ref<string>('USD')
const validFrom = ref('')
const validUntil = ref('')
const usageLimit = ref<number | null>(null)
const active = ref(true)
const freeUpsellServiceIds = ref<string[]>([])
const listingIds = ref<string[]>([])

const codeError = ref('')
const freeUpsellError = ref('')

const currencyOptions = ['USD', 'EUR', 'GBP', 'IDR', 'CHF', 'AUD', 'JPY']

const isFreeUpsell = computed(() => discountType.value === 'free_upsell')

function hydrate() {
  const c = props.promoCode
  if (!c) return
  code.value = c.code
  description.value = c.description ?? ''
  discountType.value = c.discountType
  value.value = c.discountType === 'free_upsell' ? 0 : c.value
  currency.value = c.currency ?? 'USD'
  validFrom.value = c.validFrom ?? ''
  validUntil.value = c.validUntil ?? ''
  usageLimit.value = c.usageLimit ?? null
  active.value = c.active
  freeUpsellServiceIds.value = c.freeUpsellServiceIds ? [...c.freeUpsellServiceIds] : []
  listingIds.value = c.listingIds ? [...c.listingIds] : []
  codeError.value = ''
  freeUpsellError.value = ''
  freeUpsellSearch.value = ''
  listingSearch.value = ''
}

watch(open, (isOpen) => {
  if (isOpen)
    hydrate()
})

watch(() => props.promoCode, () => {
  if (open.value)
    hydrate()
})

function onCodeInput(event: Event) {
  const target = event.target as HTMLInputElement
  const upper = target.value.toUpperCase().replace(/\s+/g, '')
  code.value = upper
  target.value = upper
  codeError.value = ''
}

// ─── Free Upsell services picker ────────────────────────────────────────────
const freeUpsellOpen = ref(false)
const freeUpsellSearch = ref('')

const filteredUpsellServices = computed(() => {
  const query = freeUpsellSearch.value.trim().toLowerCase()
  if (!query) return mockUpsellServices
  return mockUpsellServices.filter((s) => {
    const haystack = `${s.name} ${s.category}`.toLowerCase()
    return haystack.includes(query)
  })
})

const selectedUpsellServices = computed(() =>
  mockUpsellServices.filter(s => freeUpsellServiceIds.value.includes(s.id)),
)

function toggleUpsellService(id: string) {
  freeUpsellServiceIds.value = freeUpsellServiceIds.value.includes(id)
    ? freeUpsellServiceIds.value.filter(x => x !== id)
    : [...freeUpsellServiceIds.value, id]
  freeUpsellError.value = ''
}

function clearUpsellServices() {
  freeUpsellServiceIds.value = []
  freeUpsellError.value = ''
}

function upsellTriggerLabel() {
  const n = freeUpsellServiceIds.value.length
  if (n === 0) return 'Select upsell services'
  if (n === 1) return '1 service selected'
  return `${n} services selected`
}

watch(freeUpsellOpen, (open) => {
  if (!open) freeUpsellSearch.value = ''
})

// ─── Listings picker ────────────────────────────────────────────────────────
const listingOpen = ref(false)
const listingSearch = ref('')
const listingTagsFilter = ref<string[]>([])
const tagPopoverOpen = ref(false)
const tagSearch = ref('')

const filteredTags = computed(() => {
  const q = tagSearch.value.trim().toLowerCase()
  if (!q) return allTags.value
  return allTags.value.filter(t => t.toLowerCase().includes(q))
})

const filteredListings = computed(() => {
  const query = listingSearch.value.trim().toLowerCase()
  let result = allListings.value
  if (listingTagsFilter.value.length > 0) {
    // AND logic: listing must contain every selected tag
    result = result.filter(l => listingTagsFilter.value.every(t => l.tags.includes(t)))
  }
  if (query) {
    result = result.filter((l) => {
      const haystack = `${l.name} ${l.location ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }
  return result
})

function toggleListing(id: string) {
  listingIds.value = listingIds.value.includes(id)
    ? listingIds.value.filter(x => x !== id)
    : [...listingIds.value, id]
}

function toggleListingTag(tag: string) {
  listingTagsFilter.value = listingTagsFilter.value.includes(tag)
    ? listingTagsFilter.value.filter(x => x !== tag)
    : [...listingTagsFilter.value, tag]
}

function clearListingTags() {
  listingTagsFilter.value = []
}

function clearListings() {
  listingIds.value = []
}

function listingTriggerLabel() {
  const n = listingIds.value.length
  if (n === 0) return 'All listings'
  if (n === 1) return '1 listing'
  return `${n} listings`
}

watch(listingOpen, (open) => {
  if (!open) {
    listingSearch.value = ''
    listingTagsFilter.value = []
    tagSearch.value = ''
  }
})

watch(tagPopoverOpen, (open) => {
  if (!open) tagSearch.value = ''
})

// ─── Submit ────────────────────────────────────────────────────────────────
function submit() {
  if (!props.promoCode) return
  const trimmed = code.value.trim()
  if (!trimmed) {
    codeError.value = 'Code is required'
    return
  }
  if (isCodeTaken(trimmed, props.promoCode.id)) {
    codeError.value = 'A code with this value already exists'
    return
  }
  if (isFreeUpsell.value && freeUpsellServiceIds.value.length === 0) {
    freeUpsellError.value = 'Select at least one upsell service for a Free Upsell code'
    return
  }
  if (!isFreeUpsell.value && (!value.value || value.value <= 0)) {
    toast.error('Value must be greater than 0')
    return
  }

  updatePromoCode(props.promoCode.id, {
    code: trimmed,
    description: description.value.trim() || undefined,
    discountType: discountType.value,
    value: isFreeUpsell.value ? 0 : value.value,
    currency: discountType.value === 'fixed' ? currency.value : null,
    active: active.value,
    validFrom: validFrom.value || null,
    validUntil: validUntil.value || null,
    usageLimit: usageLimit.value,
    freeUpsellServiceIds: isFreeUpsell.value ? freeUpsellServiceIds.value : [],
    listingIds: listingIds.value,
  })

  toast.success(`Code ${trimmed} updated`)
  emit('updated', props.promoCode.id)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit promo code</DialogTitle>
        <DialogDescription>Update the code details. Existing usages are not affected.</DialogDescription>
      </DialogHeader>

      <form v-if="promoCode" class="space-y-4" @submit.prevent="submit">
        <div class="space-y-2">
          <Label>Code</Label>
          <Input
            :model-value="code"
            placeholder="WELCOME10"
            class="font-mono uppercase"
            :class="codeError ? 'border-destructive' : ''"
            @input="onCodeInput"
          />
          <p v-if="codeError" class="text-xs text-destructive">
            {{ codeError }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>Description <span class="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea v-model="description" placeholder="What is this code for?" rows="2" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label>Type</Label>
            <Select v-model="discountType">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="%">
                  Percentage
                </SelectItem>
                <SelectItem value="fixed">
                  Fixed amount
                </SelectItem>
                <SelectItem value="free_upsell">
                  Free Upsell
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="!isFreeUpsell" class="space-y-2">
            <Label>Value</Label>
            <div class="flex items-center gap-2">
              <span v-if="discountType === 'fixed'" class="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{{ currency }}</span>
              <span v-else class="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">%</span>
              <Input v-model.number="value" type="number" min="1" class="flex-1" />
            </div>
          </div>
        </div>

        <div v-if="discountType === 'fixed'" class="space-y-2">
          <Label>Currency</Label>
          <Select v-model="currency">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in currencyOptions" :key="c" :value="c">
                {{ c }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Free Upsell services picker -->
        <div v-if="isFreeUpsell" class="space-y-2">
          <Label>
            Free upsell services
            <span class="text-muted-foreground font-normal">(required)</span>
          </Label>
          <Popover v-model:open="freeUpsellOpen">
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full justify-between">
                <span class="truncate">{{ upsellTriggerLabel() }}</span>
                <div class="flex items-center gap-2">
                  <Badge v-if="freeUpsellServiceIds.length > 0" variant="secondary" class="h-4 min-w-4 rounded-full px-1 text-[9px]">
                    {{ freeUpsellServiceIds.length }}
                  </Badge>
                  <Icon name="i-lucide-chevron-down" class="size-4 shrink-0 text-muted-foreground" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[420px] p-0" align="start" :side-offset="4">
              <div class="p-2 border-b">
                <Input v-model="freeUpsellSearch" placeholder="Search upsell services..." class="h-8 text-sm" />
              </div>
              <Command>
                <CommandList>
                  <CommandEmpty>No upsell services found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="service in filteredUpsellServices"
                      :key="service.id"
                      :value="service.id"
                      class="cursor-pointer"
                      @select="() => toggleUpsellService(service.id)"
                    >
                      <div class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border" :class="freeUpsellServiceIds.includes(service.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'">
                        <Icon v-if="freeUpsellServiceIds.includes(service.id)" name="lucide:check" class="size-3" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">
                          {{ service.name }}
                        </p>
                        <p class="text-xs text-muted-foreground truncate">
                          {{ service.category }}
                        </p>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
              <div class="flex items-center justify-between gap-2 border-t p-2">
                <Button v-if="freeUpsellServiceIds.length > 0" variant="ghost" size="sm" class="h-6 text-xs" @click="clearUpsellServices">
                  Clear
                </Button>
                <span v-else class="text-xs text-muted-foreground">{{ freeUpsellServiceIds.length }} selected</span>
                <Button size="sm" class="h-7" @click="freeUpsellOpen = false">
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div v-if="selectedUpsellServices.length > 0" class="flex flex-wrap gap-1.5">
            <Badge v-for="service in selectedUpsellServices" :key="service.id" variant="secondary" class="gap-1 pr-1">
              <Icon name="lucide:sparkles" class="size-3 text-primary" />
              <span class="text-xs">{{ service.name }}</span>
              <button type="button" class="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5" @click="toggleUpsellService(service.id)">
                <Icon name="lucide:x" class="size-3" />
              </button>
            </Badge>
          </div>
          <p v-if="freeUpsellError" class="text-xs text-destructive">
            {{ freeUpsellError }}
          </p>
        </div>

        <!-- Assigned listings picker -->
        <div class="space-y-2">
          <Label>
            Assigned listings
            <span class="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Popover v-model:open="listingOpen">
            <PopoverTrigger as-child>
              <Button variant="outline" class="w-full justify-between">
                <span class="truncate">{{ listingTriggerLabel() }}</span>
                <div class="flex items-center gap-2">
                  <Badge v-if="listingIds.length > 0" variant="secondary" class="h-4 min-w-4 rounded-full px-1 text-[9px]">
                    {{ listingIds.length }}
                  </Badge>
                  <Icon name="i-lucide-chevron-down" class="size-4 shrink-0 text-muted-foreground" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[420px] p-0" align="start" :side-offset="4">
              <div class="flex items-center gap-1.5 border-b p-2">
                <div class="relative flex-1">
                  <Icon name="lucide:search" class="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input v-model="listingSearch" placeholder="Search listings..." class="h-8 pl-7 text-sm" />
                </div>
                <Popover v-model:open="tagPopoverOpen">
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-8 shrink-0"
                      :class="listingTagsFilter.length > 0 ? 'border-primary text-primary' : ''"
                    >
                      <Icon name="lucide:tag" class="size-3.5" />
                      Tags
                      <span v-if="listingTagsFilter.length > 0" class="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                        {{ listingTagsFilter.length }}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-56 p-0" align="end" :side-offset="4">
                    <div class="border-b px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Filter by tag
                    </div>
                    <div class="p-2">
                      <Input v-model="tagSearch" placeholder="Search tags..." class="mb-2 h-8 text-xs" />
                      <div class="max-h-48 overflow-y-auto">
                        <button
                          v-for="tag in filteredTags"
                          :key="tag"
                          type="button"
                          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                          @click="toggleListingTag(tag)"
                        >
                          <span
                            class="inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors"
                            :class="listingTagsFilter.includes(tag) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-transparent'"
                          >
                            <Icon v-if="listingTagsFilter.includes(tag)" name="lucide:check" class="size-3.5" />
                          </span>
                          {{ tag }}
                        </button>
                        <p v-if="filteredTags.length === 0" class="px-2 py-3 text-sm text-muted-foreground">
                          No tags found.
                        </p>
                      </div>
                      <Button
                        v-if="listingTagsFilter.length"
                        variant="ghost"
                        size="sm"
                        class="mt-2 h-7 w-full text-xs text-muted-foreground"
                        @click="clearListingTags"
                      >
                        Clear tags
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Command>
                <CommandList>
                  <CommandEmpty>No listings found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      v-for="listing in filteredListings"
                      :key="listing.id"
                      :value="listing.id"
                      class="cursor-pointer"
                      @select="() => toggleListing(listing.id)"
                    >
                      <div class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border" :class="listingIds.includes(listing.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'">
                        <Icon v-if="listingIds.includes(listing.id)" name="lucide:check" class="size-3" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">
                          {{ listing.name }}
                        </p>
                        <p v-if="listing.location" class="text-xs text-muted-foreground truncate">
                          {{ listing.location }}
                        </p>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
              <div class="flex items-center justify-between gap-2 border-t p-2">
                <Button v-if="listingIds.length > 0" variant="ghost" size="sm" class="h-6 text-xs" @click="clearListings">
                  Clear
                </Button>
                <span v-else class="text-xs text-muted-foreground">No listings = applies to all</span>
                <Button size="sm" class="h-7" @click="listingOpen = false">
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <Label>Valid from <span class="text-muted-foreground font-normal">(optional)</span></Label>
            <Input v-model="validFrom" type="date" />
          </div>
          <div class="space-y-2">
            <Label>Valid until <span class="text-muted-foreground font-normal">(optional)</span></Label>
            <Input v-model="validUntil" type="date" />
          </div>
        </div>

        <div class="space-y-2">
          <Label>Usage limit <span class="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            :model-value="usageLimit === null ? '' : String(usageLimit)"
            type="number"
            min="1"
            placeholder="Unlimited"
            @input="(e: Event) => { const v = (e.target as HTMLInputElement).value; usageLimit = v === '' ? null : Number(v) }"
          />
        </div>

        <div class="flex items-center justify-between gap-3 rounded-md border p-3">
          <div>
            <p class="text-sm font-medium">
              Active
            </p>
            <p class="text-xs text-muted-foreground">
              Inactive codes cannot be redeemed.
            </p>
          </div>
          <button
            type="button"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            :class="active ? 'bg-primary' : 'bg-input'"
            @click="active = !active"
          >
            <span
              class="pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform"
              :class="active ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" @click="open = false">
          Cancel
        </Button>
        <Button @click="submit">
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>