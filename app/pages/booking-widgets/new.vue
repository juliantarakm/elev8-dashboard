<script setup lang="ts">
import { toast } from 'vue-sonner'
import { bookingWidgets, useBookingWidgets } from '~/components/booking-widget/data/widgets'
import BookingWidgetWysiwyg from '~/components/booking-widget/BookingWidgetWysiwyg.vue'
import { listings } from '~/components/listings/data/listings'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { buildEmbedPreview, getSnippetForForm } = useBookingWidgets()
const activeTab = ref<'accommodation' | 'system' | 'embed'>('accommodation')
const listingDialogOpen = ref(false)
const listingSearch = ref('')
const activeTags = ref<string[]>([])
const tagPanelOpen = ref(false)
const tagSearch = ref('')
const paymentMethodOpen = ref(false)
const embedPreviewOpen = ref(false)

const form = reactive({
  name: '',
  unitMode: 'single' as 'single' | 'multi',
  listingId: '',
  selectedUnitIds: [] as string[],
  currency: 'EUR',
  paymentMethods: [
    'Invoice (Bank Transfer)',
    'PayPal',
    'Pay upon arrival',
    'Stripe Connect (Credit Card)',
    'iDEAL (Stripe Connect)',
    'SEPA Direct Debit (Stripe Connect)',
    'Bancontact (Stripe Connect)',
    'EPS (Stripe Connect)',
    'Przelewy24 (Stripe Connect)',
    'Apple Pay',
    'ACH Direct Debit (Stripe Connect)',
    'Afterpay and Clearpay (Stripe Connect)',
    'Alipay (Stripe Connect)',
    'Bacs Direct Debit (Stripe Connect)',
    'BECS direct debit (Stripe Connect)',
    'Boleto (Stripe Connect)',
    'FPX (Stripe Connect)',
    'GrabPay (Stripe Connect)',
    'Klarna (Stripe Connect)',
    'Konbini (Stripe Connect)',
    'OXXO (Stripe Connect)',
    'PayNow (Stripe Connect)',
    'Sofort (Stripe Connect)',
    'WeChat Pay (Stripe Connect)',
  ] as string[],
  defaultPaymentOption: '',
  requestNumberOfPersons: 'Only number of persons(default)',
  contactCopy: 'Contact',
  legalRequirementsCopy: 'Legal requirements',
  detailsCopy: 'Details',
  successfullyBookedCopy: 'Successfully booked',
  customStyleCopy: 'Custom style',
  accentColor: '#C8A84B',
  cornerRadius: 12,
  depositPct: 30,
  minDaysBeforeArrival: 0,
  allowedDomains: [''],
  promoCodes: [] as Array<{ id: string, code: string, discountType: '%' | 'fixed', value: number, currency: string | null, active: boolean, redemptionCount: number, validFrom: string, validUntil: string }>,
  utmSource: '',
  utmMedium: '',
  utmCampaign: '',
})

const paymentMethodOptions = [
  'Invoice (Bank Transfer)',
  'PayPal',
  'Pay upon arrival',
  'Stripe Connect (Credit Card)',
  'iDEAL (Stripe Connect)',
  'SEPA Direct Debit (Stripe Connect)',
  'Bancontact (Stripe Connect)',
  'EPS (Stripe Connect)',
  'Przelewy24 (Stripe Connect)',
  'Apple Pay',
  'ACH Direct Debit (Stripe Connect)',
  'Afterpay and Clearpay (Stripe Connect)',
  'Alipay (Stripe Connect)',
  'Bacs Direct Debit (Stripe Connect)',
  'BECS direct debit (Stripe Connect)',
  'Boleto (Stripe Connect)',
  'FPX (Stripe Connect)',
  'GrabPay (Stripe Connect)',
  'Klarna (Stripe Connect)',
  'Konbini (Stripe Connect)',
  'OXXO (Stripe Connect)',
  'PayNow (Stripe Connect)',
  'Sofort (Stripe Connect)',
  'WeChat Pay (Stripe Connect)',
]

const requestNumberOptions = [
  'Only number of persons(default)',
  'Contact',
  'Legal requirements',
  'Details',
  'Successfully booked',
  'Custom style',
]

const paymentMethodSummary = computed(() => {
  if (form.paymentMethods.length === 0)
    return 'Please select'
  if (form.paymentMethods.length <= 2)
    return form.paymentMethods.join(', ')
  return `${form.paymentMethods.length} selected`
})

const defaultPaymentMethodOptions = computed(() => form.paymentMethods)

watch(() => form.paymentMethods, (methods) => {
  if (!methods.includes(form.defaultPaymentOption))
    form.defaultPaymentOption = methods[0] || ''
}, { deep: true })

function isPaymentMethodSelected(method: string) {
  return form.paymentMethods.includes(method)
}

function togglePaymentMethod(method: string, checked: boolean) {
  form.paymentMethods = checked
    ? [...form.paymentMethods, method]
    : form.paymentMethods.filter(item => item !== method)

  if (!form.paymentMethods.includes(form.defaultPaymentOption))
    form.defaultPaymentOption = form.paymentMethods[0] || ''
}

function clearPaymentMethods() {
  form.paymentMethods = []
  form.defaultPaymentOption = ''
}

const embedPreviewWidget = computed(() => buildEmbedPreview({
  id: 'preview',
  name: form.name || 'New Booking Widget',
  mode: form.listingId ? 'single' : 'multi',
  listingIds: form.listingId ? [form.listingId] : [],
  primaryListingId: form.listingId || null,
  currency: form.currency,
  paymentMethods: form.paymentMethods,
  defaultPaymentOption: form.defaultPaymentOption || null,
  requestNumberOfPersons: form.requestNumberOfPersons,
  contactCopy: form.contactCopy,
  legalRequirementsCopy: form.legalRequirementsCopy,
  detailsCopy: form.detailsCopy,
  successfullyBookedCopy: form.successfullyBookedCopy,
  customStyleCopy: form.customStyleCopy,
  accentColor: form.accentColor,
  cornerRadius: form.cornerRadius,
  depositPct: form.depositPct,
  minDaysBeforeArrival: form.minDaysBeforeArrival,
  allowedDomains: form.allowedDomains.filter(Boolean),
  promoCodes: form.promoCodes.map(promo => ({
    ...promo,
    currency: promo.discountType === 'fixed' ? widgetCurrency.value : null,
    validFrom: promo.validFrom || null,
    validUntil: promo.validUntil || null,
  })),
  embedVersion: 'v1',
  utmSource: form.utmSource || null,
  utmMedium: form.utmMedium || null,
  utmCampaign: form.utmCampaign || null,
}))

const embedSnippet = computed(() => getSnippetForForm({
  id: 'preview',
  name: form.name || 'New Booking Widget',
  mode: form.listingId ? 'single' : 'multi',
  listingIds: form.listingId ? [form.listingId] : [],
  primaryListingId: form.listingId || null,
  currency: form.currency,
  paymentMethods: form.paymentMethods,
  defaultPaymentOption: form.defaultPaymentOption || null,
  requestNumberOfPersons: form.requestNumberOfPersons,
  contactCopy: form.contactCopy,
  legalRequirementsCopy: form.legalRequirementsCopy,
  detailsCopy: form.detailsCopy,
  successfullyBookedCopy: form.successfullyBookedCopy,
  customStyleCopy: form.customStyleCopy,
  accentColor: form.accentColor,
  cornerRadius: form.cornerRadius,
  depositPct: form.depositPct,
  minDaysBeforeArrival: form.minDaysBeforeArrival,
  allowedDomains: form.allowedDomains.filter(Boolean),
  promoCodes: form.promoCodes.map(promo => ({
    ...promo,
    currency: promo.discountType === 'fixed' ? widgetCurrency.value : null,
    validFrom: promo.validFrom || null,
    validUntil: promo.validUntil || null,
  })),
  embedVersion: 'v1',
  utmSource: form.utmSource || null,
  utmMedium: form.utmMedium || null,
  utmCampaign: form.utmCampaign || null,
}))

async function copySnippet() {
  await navigator.clipboard.writeText(embedSnippet.value)
  toast.success('Snippet copied')
}

const eligibleListings = computed(() => listings.value.map((listing) => {
  const eligible = Boolean(listing.photos.length > 0 && listing.resources.basics.description?.trim() && listing.status !== 'inactive')
  return {
    id: listing.id,
    name: listing.name,
    location: listing.location,
    tags: listing.tags,
    unitType: listing.unitType,
    units: listing.units ?? [],
    currency: listing.currency ?? 'USD',
    eligible,
  }
}))

const filteredListings = computed(() => {
  const query = listingSearch.value.trim().toLowerCase()
  return eligibleListings.value.filter((listing) => {
    const matchesSearch = !query || listing.name.toLowerCase().includes(query) || listing.location.toLowerCase().includes(query)
    const matchesTag = activeTags.value.length === 0 || activeTags.value.every(tag => listing.tags.includes(tag))
    return matchesSearch && matchesTag
  })
})

const allTags = computed(() => Array.from(new Set(eligibleListings.value.flatMap(listing => listing.tags))).sort())

const filteredTags = computed(() => {
  if (!tagSearch.value)
    return allTags.value
  const q = tagSearch.value.toLowerCase()
  return allTags.value.filter(tag => tag.toLowerCase().includes(q))
})

function toggleTag(tag: string) {
  if (tag === 'all') {
    activeTags.value = []
    return
  }

  activeTags.value = activeTags.value.includes(tag)
    ? activeTags.value.filter(t => t !== tag)
    : [...activeTags.value, tag]
}

function clearTags() {
  activeTags.value = []
}

watch(tagPanelOpen, (open) => {
  if (!open)
    tagSearch.value = ''
})

const selectedListing = computed(() => eligibleListings.value.find(listing => listing.id === form.listingId) ?? null)
const widgetCurrency = computed(() => selectedListing.value?.currency ?? 'USD')

const previewWidget = computed(() => ({
  id: 'preview' as const,
  name: form.name || 'New Booking Widget',
  mode: form.listingId ? 'single' : 'multi',
  listingIds: form.listingId ? [form.listingId] : [],
  primaryListingId: form.listingId || null,
  accentColor: form.accentColor,
  cornerRadius: form.cornerRadius,
  depositPct: form.depositPct,
  minDaysBeforeArrival: form.minDaysBeforeArrival,
  allowedDomains: form.allowedDomains.filter(Boolean),
  promoCodes: form.promoCodes.map(promo => ({
    ...promo,
    currency: promo.discountType === 'fixed' ? widgetCurrency.value : null,
    validFrom: promo.validFrom || null,
    validUntil: promo.validUntil || null,
  })),
  currency: form.currency,
  paymentMethods: form.paymentMethods,
  defaultPaymentOption: form.defaultPaymentOption || null,
  requestNumberOfPersons: form.requestNumberOfPersons,
  contactCopy: form.contactCopy,
  legalRequirementsCopy: form.legalRequirementsCopy,
  detailsCopy: form.detailsCopy,
  successfullyBookedCopy: form.successfullyBookedCopy,
  customStyleCopy: form.customStyleCopy,
  embedVersion: 'v1' as const,
  utmSource: form.utmSource || null,
  utmMedium: form.utmMedium || null,
  utmCampaign: form.utmCampaign || null,
}))

function selectListing(listingId: string) {
  if (form.listingId === listingId) {
    form.listingId = ''
    form.selectedUnitIds = []
    return
  }

  form.listingId = listingId
  const listing = eligibleListings.value.find(item => item.id === listingId)
  form.selectedUnitIds = form.unitMode === 'single'
    ? (listing?.units?.[0]?.id ? [listing.units[0].id] : [])
    : []
  listingDialogOpen.value = false
  listingSearch.value = ''
}

function toggleUnit(unitId: string) {
  if (form.unitMode === 'single') {
    form.selectedUnitIds = [unitId]
    return
  }

  form.selectedUnitIds = form.selectedUnitIds.includes(unitId)
    ? form.selectedUnitIds.filter(id => id !== unitId)
    : [...form.selectedUnitIds, unitId]
}

function addDomain() {
  form.allowedDomains = [...form.allowedDomains, '']
}

function addPromoCode() {
  form.promoCodes = [...form.promoCodes, { id: `promo-${Date.now()}-${form.promoCodes.length}`, code: '', discountType: '%', value: 10, currency: widgetCurrency.value, active: true, redemptionCount: 0, validFrom: '', validUntil: '' }]
}

function removePromoCode(index: number) {
  form.promoCodes = form.promoCodes.filter((_, i) => i !== index)
}

function saveWidget() {
  bookingWidgets.value.unshift({
    id: `bk-widget-${Date.now()}`,
    name: form.name || 'Untitled Widget',
    mode: form.listingId ? 'single' : 'multi',
    listingIds: form.listingId ? [form.listingId] : [],
    primaryListingId: form.listingId || null,
    accentColor: form.accentColor,
    cornerRadius: form.cornerRadius,
    depositPct: form.depositPct,
    minDaysBeforeArrival: form.minDaysBeforeArrival,
    allowedDomains: form.allowedDomains.filter(Boolean),
  promoCodes: form.promoCodes.map(promo => ({
    ...promo,
    currency: promo.discountType === 'fixed' ? widgetCurrency.value : null,
    validFrom: promo.validFrom || null,
    validUntil: promo.validUntil || null,
  })),
  currency: form.currency,
  paymentMethods: form.paymentMethods,
  defaultPaymentOption: form.defaultPaymentOption || null,
  requestNumberOfPersons: form.requestNumberOfPersons,
  contactCopy: form.contactCopy,
  legalRequirementsCopy: form.legalRequirementsCopy,
  detailsCopy: form.detailsCopy,
  successfullyBookedCopy: form.successfullyBookedCopy,
  customStyleCopy: form.customStyleCopy,
  embedVersion: 'v1',
    utmSource: form.utmSource || null,
    utmMedium: form.utmMedium || null,
    utmCampaign: form.utmCampaign || null,
  })

  toast.success('Booking widget created')
  router.push('/booking-widgets')
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.push('/booking-widgets')">
        <Icon name="i-lucide-arrow-left" class="size-4 mr-2" />
        Back to Booking Widgets
      </Button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Create Booking Widget</h2>
        <p class="text-sm text-muted-foreground">Configure accommodation, booking system, and embed settings.</p>
      </div>
      <Button @click="saveWidget">
        <Icon name="i-lucide-save" class="size-4 mr-2" />
        Save Widget
      </Button>
    </div>

    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-3">
        <TabsTrigger value="accommodation">Accommodation Setting</TabsTrigger>
        <TabsTrigger value="system">Booking System Setting</TabsTrigger>
        <TabsTrigger value="embed">Embed in Website</TabsTrigger>
      </TabsList>

      <TabsContent value="accommodation" class="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Accommodation Setting</CardTitle>
            <CardDescription>Choose the listing and unit setup for this widget.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2 sm:col-span-2">
                <Label>Widget name</Label>
                <Input v-model="form.name" placeholder="Canggu Portfolio Widget" />
              </div>

              <div class="space-y-2">
                <Label>Unit type</Label>
                <Tabs v-model="form.unitMode" class="w-full">
                  <TabsList class="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Single unit</TabsTrigger>
                    <TabsTrigger value="multi">Multi unit</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div class="space-y-2">
                <Label>Selected listing</Label>
                <div>
                  <Dialog v-model:open="listingDialogOpen">
                    <DialogTrigger as-child>
                      <Button variant="outline" class="w-full justify-between">
                        <span class="truncate">{{ selectedListing?.name ?? 'Select listing' }}</span>
                        <Icon name="i-lucide-chevron-down" class="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent class="sm:max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Select listing</DialogTitle>
                        <DialogDescription>Search listings and filter by tags.</DialogDescription>
                      </DialogHeader>

                      <div class="space-y-4">
                        <Command v-model="listingSearch" class="gap-0">
                          <div class="flex flex-wrap items-center gap-2 border-b px-3 py-2">
                            <div class="flex-1 min-w-[200px] max-w-xs">
                              <Input v-model="listingSearch" placeholder="Search listings..." class="h-9" />
                            </div>
                            <Popover v-model:open="tagPanelOpen">
                              <PopoverTrigger as-child>
                                <Button variant="outline" size="sm" class="h-9 gap-1.5 text-xs" :class="activeTags.length > 0 ? 'border-primary text-primary' : ''">
                                  <Icon name="i-lucide-tag" class="size-3.5" />
                                  Tags
                                  <Badge v-if="activeTags.length > 0" variant="default" class="ml-0.5 h-4 min-w-4 rounded-full px-1 text-[9px]">
                                    {{ activeTags.length }}
                                  </Badge>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent class="w-56 p-0" align="start" :side-offset="4">
                                <div class="p-2">
                                  <Input v-model="tagSearch" placeholder="Search tags..." class="h-7 text-xs" />
                                </div>
                                <ScrollArea class="h-48 overflow-hidden">
                                  <div class="space-y-1">
                                    <div v-for="tag in filteredTags" :key="tag" class="flex items-center gap-2 cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent" @click="toggleTag(tag)">
                                      <div class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border" :class="activeTags.includes(tag) ? 'border-primary bg-primary text-primary-foreground' : 'border-input'">
                                        <Icon v-if="activeTags.includes(tag)" name="lucide:check" class="size-3" />
                                      </div>
                                      <span class="flex-1">{{ tag }}</span>
                                    </div>
                                    <p v-if="filteredTags.length === 0" class="px-2 py-1.5 text-xs text-muted-foreground">
                                      No tags found.
                                    </p>
                                  </div>
                                </ScrollArea>
                                <div v-if="activeTags.length > 0" class="border-t px-2 py-2">
                                  <Button variant="ghost" size="sm" class="h-7 w-full text-xs text-muted-foreground" @click="clearTags">
                                    Clear all tags
                                  </Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>

                          <CommandList>
                            <CommandEmpty>No listings found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                v-for="listing in filteredListings"
                                :key="listing.id"
                                :value="listing.id"
                                @select="selectListing(listing.id)"
                              >
                                <div class="flex w-full items-center justify-between gap-3">
                                  <div class="min-w-0">
                                    <p class="text-sm font-medium truncate">{{ listing.name }}</p>
                                    <p class="text-xs text-muted-foreground truncate">{{ listing.location }}</p>
                                  </div>
                                  <Badge :variant="listing.eligible ? 'default' : 'destructive'">{{ listing.eligible ? 'Eligible' : 'Blocked' }}</Badge>
                                </div>
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <div v-if="selectedListing" class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <Label>Unit selection</Label>
                  <p class="text-xs text-muted-foreground">Single unit uses radio style, multi unit uses checkbox style.</p>
                </div>
              </div>

              <div v-if="selectedListing.unitType === 'multi'" class="grid gap-2 md:grid-cols-2">
                <button
                  v-for="unit in selectedListing.units"
                  :key="unit.id"
                  type="button"
                  class="rounded-lg border p-3 text-left transition-colors"
                  :class="form.selectedUnitIds.includes(unit.id) ? 'border-foreground bg-muted' : 'hover:bg-muted/60'"
                  @click="toggleUnit(unit.id)"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-sm font-medium">{{ unit.name }}</p>
                      <p class="text-xs text-muted-foreground">Capacity {{ unit.capacity }}</p>
                    </div>
                    <Icon :name="form.selectedUnitIds.includes(unit.id) ? 'i-lucide-square-check' : 'i-lucide-square'" class="size-4 text-muted-foreground" />
                  </div>
                </button>
              </div>

              <div v-else class="space-y-2">
                <label v-for="unit in selectedListing.units" :key="unit.id" class="flex items-center justify-between gap-3 rounded-lg border px-3 py-3">
                  <span>
                    <span class="block text-sm font-medium">{{ unit.name }}</span>
                    <span class="block text-xs text-muted-foreground">Capacity {{ unit.capacity }}</span>
                  </span>
                  <input
                    type="radio"
                    class="size-4"
                    :name="'unit-choice'"
                    :checked="form.selectedUnitIds[0] === unit.id"
                    @change="toggleUnit(unit.id)"
                  >
                </label>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Promo codes</Label>
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-xs text-muted-foreground">Add booking-specific promo codes for this widget.</p>
                  <p class="text-xs text-muted-foreground">Fixed amounts use {{ widgetCurrency }}.</p>
                </div>
                <Button variant="outline" size="sm" @click="addPromoCode">
                  <Icon name="i-lucide-plus" class="size-4 mr-2" />
                  Add code
                </Button>
              </div>

              <div v-if="form.promoCodes.length > 0" class="space-y-3">
                <div v-for="(promo, index) in form.promoCodes" :key="promo.id" class="grid gap-3 rounded-lg border p-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] md:items-end">
                  <div class="space-y-2">
                    <Label>Code</Label>
                    <Input v-model="form.promoCodes[index].code" placeholder="WELCOME10" class="uppercase" />
                  </div>
                  <div class="space-y-2">
                    <Label>Type</Label>
                    <Select v-model="form.promoCodes[index].discountType">
                      <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="%">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <Label>Value</Label>
                    <div class="flex items-center gap-2">
                      <span v-if="form.promoCodes[index].discountType === 'fixed'" class="rounded-md border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{{ widgetCurrency }}</span>
                      <Input v-model.number="form.promoCodes[index].value" type="number" min="1" />
                    </div>
                  </div>
                  <div class="space-y-2">
                    <Label>Valid from</Label>
                    <Input v-model="form.promoCodes[index].validFrom" type="date" />
                  </div>
                  <div class="space-y-2">
                    <Label>Valid until</Label>
                    <Input v-model="form.promoCodes[index].validUntil" type="date" />
                  </div>
                  <Button variant="ghost" size="icon-sm" type="button" class="justify-self-end" @click="removePromoCode(index)">
                    <Icon name="i-lucide-x" class="size-4" />
                  </Button>
                </div>
              </div>

              <Empty v-else class="rounded-lg border py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Icon name="i-lucide-ticket-percent" class="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No discount codes yet</EmptyTitle>
                  <EmptyDescription>Add a code to run widget-specific campaigns.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="system" class="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Booking System Setting</CardTitle>
            <CardDescription>Define pricing behavior and booking rules.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-2">
                <Label>Currency</Label>
                <Input v-model="form.currency" maxlength="3" class="uppercase font-mono" />
              </div>
              <div class="space-y-2">
                <Label>Deposit %</Label>
                <Input v-model.number="form.depositPct" type="number" min="10" max="100" />
              </div>
              <div class="space-y-2">
                <Label>Lead time (days)</Label>
                <Input v-model.number="form.minDaysBeforeArrival" type="number" min="0" />
              </div>
              <div class="space-y-2">
                <Label>Corner radius</Label>
                <Input v-model.number="form.cornerRadius" type="number" min="0" max="24" />
              </div>
            </div>

            <div class="grid gap-4 xl:grid-cols-2">
              <div class="space-y-2">
                <Label>Payment Methods</Label>
                <Popover v-model:open="paymentMethodOpen">
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      role="combobox"
                      :aria-expanded="paymentMethodOpen"
                      class="h-9 w-full justify-between text-left font-normal"
                    >
                      <span class="flex min-w-0 items-center gap-2 truncate">
                        <Icon name="lucide:credit-card" class="size-3.5 shrink-0" />
                        <span class="truncate">{{ paymentMethodSummary }}</span>
                      </span>
                      <Badge v-if="form.paymentMethods.length > 0" variant="secondary" class="ml-2 h-4 min-w-4 rounded-full px-1 text-[9px]">
                        {{ form.paymentMethods.length }}
                      </Badge>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-[420px] p-0" align="start" :side-offset="4">
                    <Command>
                      <CommandInput placeholder="Search payment methods..." />
                      <CommandEmpty>No payment methods found.</CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          <CommandItem
                            v-for="method in paymentMethodOptions"
                            :key="method"
                            :value="method"
                            @select="() => togglePaymentMethod(method, !isPaymentMethodSelected(method))"
                          >
                            <Checkbox :checked="isPaymentMethodSelected(method)" class="mr-2" />
                            <span class="flex-1 truncate">{{ method }}</span>
                            <Icon
                              name="radix-icons:check"
                              :class="cn('ml-auto size-4', isPaymentMethodSelected(method) ? 'opacity-100' : 'opacity-0')"
                            />
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <div class="flex items-center justify-between gap-2 border-t p-2">
                      <Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground" @click="clearPaymentMethods">
                        Clear all
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div class="space-y-2">
                <Label>Default payment option</Label>
                <Select v-model="form.defaultPaymentOption">
                  <SelectTrigger>
                    <SelectValue placeholder="Please select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="method in defaultPaymentMethodOptions" :key="method" :value="method">
                      {{ method }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Request number of persons</Label>
              <Select v-model="form.requestNumberOfPersons">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in requestNumberOptions" :key="option" :value="option">
                    {{ option }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Accordion type="multiple" class="w-full" collapsible>
              <AccordionItem value="contact">
                <AccordionTrigger>Contact</AccordionTrigger>
                <AccordionContent class="pb-4">
                  <BookingWidgetWysiwyg v-model="form.contactCopy" label="Contact" placeholder="Write contact content..." />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="legal-requirements">
                <AccordionTrigger>Legal requirements</AccordionTrigger>
                <AccordionContent class="pb-4">
                  <BookingWidgetWysiwyg v-model="form.legalRequirementsCopy" label="Legal requirements" placeholder="Write legal requirements content..." />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="details">
                <AccordionTrigger>Details</AccordionTrigger>
                <AccordionContent class="pb-4">
                  <BookingWidgetWysiwyg v-model="form.detailsCopy" label="Details" placeholder="Write details content..." />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="successfully-booked">
                <AccordionTrigger>Successfully booked</AccordionTrigger>
                <AccordionContent class="pb-4">
                  <BookingWidgetWysiwyg v-model="form.successfullyBookedCopy" label="Successfully booked" placeholder="Write success message..." />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="custom-style">
                <AccordionTrigger>Custom style</AccordionTrigger>
                <AccordionContent class="pb-4">
                  <BookingWidgetWysiwyg v-model="form.customStyleCopy" label="Custom style" placeholder="Write custom style notes or HTML content..." />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="embed" class="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">Embed in Website</CardTitle>
            <CardDescription>Configure allowed domains, snippet output, and embed preview.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="space-y-2">
              <Label>Allowed domains</Label>
              <div v-for="(domain, index) in form.allowedDomains" :key="index" class="flex items-center gap-2">
                <Input v-model="form.allowedDomains[index]" placeholder="partner-bali.com" />
              </div>
              <Button variant="outline" size="sm" @click="addDomain">
                <Icon name="i-lucide-plus" class="size-4 mr-2" />
                Add domain
              </Button>
            </div>

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-3">
                <Label>Embed snippet</Label>
                <div class="flex items-center gap-2">
                  <Button variant="outline" size="sm" class="h-8 gap-1.5" @click="embedPreviewOpen = true">
                    <Icon name="lucide:eye" class="size-4" />
                    Preview
                  </Button>
                  <Button size="sm" class="h-8 gap-1.5" @click="copySnippet">
                    <Icon name="lucide:copy" class="size-4" />
                    Copy snippet
                  </Button>
                </div>
              </div>
              <pre class="overflow-x-auto rounded-md border bg-muted/40 p-4 text-xs leading-6"><code>{{ embedSnippet }}</code></pre>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div class="space-y-2">
                <Label>UTM source</Label>
                <Input v-model="form.utmSource" placeholder="partner-name" />
              </div>
              <div class="space-y-2">
                <Label>UTM medium</Label>
                <Input v-model="form.utmMedium" placeholder="partner-site" />
              </div>
              <div class="space-y-2">
                <Label>UTM campaign</Label>
                <Input v-model="form.utmCampaign" placeholder="summer-2026" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog v-model:open="embedPreviewOpen">
          <DialogContent class="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Embed Preview</DialogTitle>
              <DialogDescription>Preview is generated from the current booking widget settings.</DialogDescription>
            </DialogHeader>
            <BookingWidgetPreview :widget="embedPreviewWidget" :listings="selectedListing ? [selectedListing] : eligibleListings" />
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  </div>
</template>
