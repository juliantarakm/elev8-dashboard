<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import type { WhatsAppAccount } from '~/composables/useWhatsApp'

const {
  whatsappAccounts,
  validateAndConnect,
  updateAccount,
  removeAccount,
  assignListings,
  bulkAssign,
} = useWhatsApp()

const activeTab = ref<'connected' | 'unassigned'>('connected')

// --- Connect form ---
const connectDialogOpen = ref(false)
const isConnecting = ref(false)
const formAccessToken = ref('')
const formWabaId = ref('')
const formPhoneNumberId = ref('')
const formError = ref('')

// --- Manage dialog (unified: credentials + listings + webhook) ---
const manageDialogOpen = ref(false)
const manageAccount = ref<WhatsAppAccount | null>(null)
const manageTab = ref<'credentials' | 'listings'>('credentials')
const manageStepMode = ref(false)
const manageStep = ref(1)

// Manage: credentials form
const manageAccessToken = ref('')
const manageWabaId = ref('')
const managePhoneNumberId = ref('')
const manageCredsError = ref('')
const manageSavingCreds = ref(false)

// Manage: listings form
const manageSelectedListings = ref<string[]>([])
const manageListingSearch = ref('')
const manageListingTagSearch = ref('')
const manageListingTagPopoverOpen = ref(false)

// --- Delete ---
const deleteDialogOpen = ref(false)
const accountToDelete = ref<WhatsAppAccount | null>(null)

// --- Unassigned tab ---
const unassignedSearch = ref('')
const unassignedTagSearch = ref('')
const selectedUnassignedTags = ref<string[]>([])
const selectedUnassignedListings = ref<string[]>([])
const selectedBulkAccountId = ref('')
const unassignedTagPopoverOpen = ref(false)

const listingOptions = computed(() =>
  listings.value.map(listing => ({ id: listing.id, name: listing.name, location: listing.location })),
)

const manageAssignableListings = computed(() => {
  const query = manageListingSearch.value.trim().toLowerCase()
  const tag = manageListingTagSearch.value.trim().toLowerCase()
  return listingOptions.value.filter((listing) => {
    const source = listings.value.find(item => item.id === listing.id)
    const haystack = `${listing.name} ${listing.location} ${(source?.tags ?? []).join(' ')}`.toLowerCase()
    if (query && !haystack.includes(query))
      return false
    if (tag && !(source?.tags ?? []).some(t => t.toLowerCase().includes(tag)))
      return false
    return true
  })
})

const manageAssignTags = computed(() =>
  Array.from(new Set(listings.value.flatMap(listing => listing.tags))).sort(),
)

const unassignedListings = computed(() => {
  const query = unassignedSearch.value.trim().toLowerCase()
  const tags = selectedUnassignedTags.value
  return listingOptions.value.filter((listing) => {
    const source = listings.value.find(item => item.id === listing.id)
    const assigned = whatsappAccounts.value.some(a => a.listingIds.includes(listing.id))
    if (assigned)
      return false
    if (query && !`${listing.name} ${listing.location} ${(source?.tags ?? []).join(' ')}`.toLowerCase().includes(query))
      return false
    if (tags.length > 0 && !tags.every(t => source?.tags.includes(t)))
      return false
    return true
  })
})

const unassignedTags = computed(() =>
  Array.from(new Set(
    listings.value
      .filter(l => !whatsappAccounts.value.some(a => a.listingIds.includes(l.id)))
      .flatMap(l => l.tags),
  )).sort(),
)

const selectedUnassignedCount = computed(() => selectedUnassignedListings.value.length)
const hasAccounts = computed(() => whatsappAccounts.value.length > 0)

function resetConnectForm() {
  formAccessToken.value = ''
  formWabaId.value = ''
  formPhoneNumberId.value = ''
  formError.value = ''
}

async function handleConnect() {
  if (isConnecting.value) return

  // Validate fields not empty
  if (!formAccessToken.value.trim() || !formWabaId.value.trim() || !formPhoneNumberId.value.trim()) {
    formError.value = 'All fields are required.'
    return
  }

  isConnecting.value = true
  formError.value = ''

  const result = await validateAndConnect(
    formAccessToken.value.trim(),
    formWabaId.value.trim(),
    formPhoneNumberId.value.trim(),
  )

  if (result.success) {
    toast.success(`${result.businessName} connected.`)
    connectDialogOpen.value = false
    resetConnectForm()
    isConnecting.value = false

    // Step 1: webhook info
    const newAccount = whatsappAccounts.value[whatsappAccounts.value.length - 1]
    if (!newAccount) return
    // Open step-by-step flow: Webhook → Assign Listings
    openManageDialog(newAccount, true)
  }
  else {
    formError.value = result.error
    isConnecting.value = false
  }
}

function openManageDialog(account: WhatsAppAccount, stepMode = false) {
  manageAccount.value = account
  manageStepMode.value = stepMode
  manageStep.value = 1
  manageTab.value = 'credentials'

  // Populate credentials form
  manageAccessToken.value = account.accessToken
  manageWabaId.value = account.wabaId
  managePhoneNumberId.value = account.phoneNumberId
  manageCredsError.value = ''

  // Populate listings form
  manageSelectedListings.value = [...account.listingIds]
  manageListingSearch.value = ''
  manageListingTagSearch.value = ''

  manageDialogOpen.value = true
}

function closeManageDialog() {
  manageDialogOpen.value = false
  manageAccount.value = null
}

function copyCallbackUrl() {
  if (!manageAccount.value) return
  const url = `https://api.elev8suite.com/webhooks/whatsapp/${manageAccount.value.wabaId}`
  navigator.clipboard.writeText(url)
  toast.success('Callback URL copied.')
}

function copyWebhookToken() {
  if (!manageAccount.value) return
  navigator.clipboard.writeText(manageAccount.value.webhookToken)
  toast.success('Webhook verification token copied.')
}

async function saveManageCredentials() {
  if (!manageAccount.value) return
  if (!manageAccessToken.value.trim() || !manageWabaId.value.trim() || !managePhoneNumberId.value.trim()) {
    manageCredsError.value = 'All fields are required.'
    return
  }

  manageSavingCreds.value = true
  manageCredsError.value = ''
  await new Promise(resolve => setTimeout(resolve, 600))

  updateAccount(manageAccount.value.id, {
    accessToken: manageAccessToken.value.trim(),
    wabaId: manageWabaId.value.trim(),
    phoneNumberId: managePhoneNumberId.value.trim(),
  })

  toast.success('Credentials updated.')
  manageSavingCreds.value = false
}

function saveManageListings() {
  if (!manageAccount.value) return
  assignListings(manageAccount.value.id, [...manageSelectedListings.value])
  toast.success('Listing assignments saved.')
}

function toggleManageListing(listingId: string) {
  manageSelectedListings.value = manageSelectedListings.value.includes(listingId)
    ? manageSelectedListings.value.filter(id => id !== listingId)
    : [...manageSelectedListings.value, listingId]
}

function toggleManageListingTag(tag: string) {
  manageListingTagSearch.value = manageListingTagSearch.value === tag ? '' : tag
}

function toggleUnassignedListing(listingId: string) {
  selectedUnassignedListings.value = selectedUnassignedListings.value.includes(listingId)
    ? selectedUnassignedListings.value.filter(id => id !== listingId)
    : [...selectedUnassignedListings.value, listingId]
}

function askDelete(account: WhatsAppAccount) {
  accountToDelete.value = account
  deleteDialogOpen.value = true
}

function confirmDelete() {
  if (!accountToDelete.value) return
  removeAccount(accountToDelete.value.id)
  toast.info(`${accountToDelete.value.businessName} disconnected.`)
  deleteDialogOpen.value = false
  accountToDelete.value = null
}

function toggleUnassignedTag(tag: string) {
  selectedUnassignedTags.value = selectedUnassignedTags.value.includes(tag)
    ? selectedUnassignedTags.value.filter(item => item !== tag)
    : [...selectedUnassignedTags.value, tag]
}

function clearUnassignedFilters() {
  unassignedSearch.value = ''
  unassignedTagSearch.value = ''
  selectedUnassignedTags.value = []
}

function setBulkAccountId(value: string | number | null | undefined) {
  selectedBulkAccountId.value = value ? String(value) : ''
}

function bulkAssignSelected() {
  const target = whatsappAccounts.value.find(a => a.id === selectedBulkAccountId.value)
  if (!target || !selectedUnassignedListings.value.length) return

  bulkAssign(selectedBulkAccountId.value, [...selectedUnassignedListings.value])
  toast.success(`${selectedUnassignedListings.value.length} listing${selectedUnassignedListings.value.length > 1 ? 's' : ''} assigned.`)
  selectedUnassignedListings.value = []
}

function handleTestSend(account: WhatsAppAccount) {
  toast.success(`Test message sent to ${account.displayPhoneNumber}.`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-lg font-medium">WhatsApp Business</h3>
        <p class="text-sm text-muted-foreground">Connect WhatsApp Business numbers via Meta Cloud API to send and receive guest messages.</p>
      </div>
      <Button v-if="hasAccounts" class="gap-2" @click="connectDialogOpen = true">
        <Icon name="lucide:plus" class="size-4" />
        Add account
      </Button>
    </div>

    <!-- Empty state -->
    <div v-if="!hasAccounts" class="border border-dashed bg-card/40 p-10 text-center">
      <div class="mx-auto flex max-w-md flex-col items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-full border bg-background">
          <Icon name="lucide:message-circle" class="size-5 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <p class="text-base font-medium">No WhatsApp account yet</p>
          <p class="text-sm text-muted-foreground">Enter your Meta WhatsApp Cloud API credentials to connect.</p>
        </div>
        <Button class="gap-2" @click="connectDialogOpen = true">
          <Icon name="lucide:message-circle" class="size-4" />
          Connect with Meta
        </Button>
      </div>
    </div>

    <Tabs v-if="hasAccounts" v-model="activeTab" class="space-y-4">
      <TabsList>
        <TabsTrigger value="connected">Connected</TabsTrigger>
        <TabsTrigger value="unassigned" class="gap-2">
          Listing Unassigned
          <Badge variant="secondary" class="rounded-full px-2 py-0 text-[10px]">{{ unassignedListings.length }}</Badge>
        </TabsTrigger>
      </TabsList>

      <!-- Connected tab -->
      <TabsContent value="connected" class="space-y-3">
        <div
          v-for="account in whatsappAccounts"
          :key="account.id"
          class="rounded-lg border bg-card p-4"
        >
          <div class="flex items-start gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-md border bg-green-50 dark:bg-green-950">
              <Icon name="lucide:message-circle" class="size-5 text-green-600" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ account.businessName }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ account.displayPhoneNumber }}</p>
              <p class="text-xs text-muted-foreground">Connected {{ account.connectedAt }} · {{ account.listingIds.length }} listing{{ account.listingIds.length !== 1 ? 's' : '' }}</p>
              <p class="mt-1 text-[11px] text-muted-foreground/60">
                WABA: {{ account.wabaId }} · Phone ID: {{ account.phoneNumberId }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="openManageDialog(account)">
                  <Icon name="lucide:settings-2" class="size-3.5" />
                  Manage
                </Button>
                <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="handleTestSend(account)">
                  <Icon name="lucide:send" class="size-3.5" />
                  Test Send
                </Button>
                <Button size="sm" variant="outline" class="h-8 gap-1.5 text-destructive hover:text-destructive" @click="askDelete(account)">
                  <Icon name="lucide:trash-2" class="size-3.5" />
                  Disconnect
                </Button>
              </div>
            </div>
            <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700">
              <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          </div>
        </div>
      </TabsContent>

      <!-- Unassigned tab -->
      <TabsContent value="unassigned" class="space-y-4">
        <div class="rounded-lg border bg-card p-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-medium">Listing Unassigned</p>
              <p class="text-sm text-muted-foreground">Listings without a WhatsApp account assigned.</p>
            </div>
            <Badge variant="outline">{{ unassignedListings.length }}</Badge>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="relative min-w-[260px] flex-1">
            <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="unassignedSearch" placeholder="Search listing or location" class="h-10 pl-9" />
          </div>
          <Popover v-model:open="unassignedTagPopoverOpen">
            <PopoverTrigger as-child>
              <Button variant="outline" class="gap-2">
                <Icon name="lucide:tags" class="size-4" />
                Tags
                <Badge variant="secondary" class="ml-1">{{ selectedUnassignedTags.length }}</Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-72 p-0" align="start" :side-offset="4">
              <div class="space-y-2 p-2">
                <Input v-model="unassignedTagSearch" placeholder="Search tags..." class="h-8 text-xs" />
                <div class="max-h-56 space-y-1 overflow-auto">
                  <button
                    v-for="tag in unassignedTags.filter(t => t.toLowerCase().includes(unassignedTagSearch.trim().toLowerCase()))"
                    :key="tag"
                    type="button"
                    class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    @click="toggleUnassignedTag(tag)"
                  >
                    <Checkbox :model-value="selectedUnassignedTags.includes(tag)" class="size-3.5" @update:model-value="() => toggleUnassignedTag(tag)" />
                    <span>{{ tag }}</span>
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" class="h-10" @click="clearUnassignedFilters">
            Clear filters
          </Button>
        </div>

        <div class="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
          <p class="text-sm text-muted-foreground">
            {{ selectedUnassignedCount }} selected · {{ unassignedListings.length }} shown
          </p>
          <div class="flex items-center gap-2">
            <Select :model-value="selectedBulkAccountId" @update:model-value="setBulkAccountId">
              <SelectTrigger class="h-9 w-[220px]">
                <SelectValue placeholder="Bulk assign to account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="account in whatsappAccounts" :key="account.id" :value="account.id">
                  {{ account.businessName }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button :disabled="!selectedBulkAccountId || selectedUnassignedCount === 0" @click="bulkAssignSelected">
              Assign selected
            </Button>
          </div>
        </div>

        <div v-if="unassignedListings.length" class="space-y-3">
          <div v-for="listing in unassignedListings" :key="listing.id" class="rounded-lg border bg-card p-4">
            <label class="flex items-start gap-3">
              <Checkbox :model-value="selectedUnassignedListings.includes(listing.id)" @update:model-value="() => toggleUnassignedListing(listing.id)" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">{{ listing.name }}</p>
                <p class="mt-1 text-xs text-muted-foreground">{{ listing.location }}</p>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  <Badge v-for="tag in listings.find(item => item.id === listing.id)?.tags ?? []" :key="tag" variant="outline" class="text-[10px]">
                    {{ tag }}
                  </Badge>
                </div>
              </div>
            </label>
          </div>
        </div>
        <Empty v-else class="border bg-card/40 py-10">
          <Icon name="lucide:check-circle-2" class="size-8 text-muted-foreground" />
          <div class="space-y-1">
            <p class="font-medium">All listings are assigned</p>
            <p class="text-sm text-muted-foreground">Every listing already has a WhatsApp account.</p>
          </div>
        </Empty>
      </TabsContent>
    </Tabs>

    <!-- Add Account Dialog — Manual Credential Form -->
    <Dialog v-model:open="connectDialogOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect WhatsApp Business</DialogTitle>
          <DialogDescription>
            Enter your Meta WhatsApp Cloud API credentials. These can be found in your
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-foreground">Meta Developer Portal</a>
            under <strong>WhatsApp &rarr; API Setup</strong>.
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleConnect">
          <div class="space-y-2">
            <Label for="access-token">Access Token</Label>
            <Input
              id="access-token"
              v-model="formAccessToken"
              type="password"
              placeholder="EAAT4cB..."
              class="w-full font-mono text-sm"
            />
            <p class="text-[11px] text-muted-foreground">Permanent access token from Meta App &rarr; WhatsApp &rarr; API Setup.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="waba-id">WABA ID</Label>
              <Input
                id="waba-id"
                v-model="formWabaId"
                placeholder="123456789"
                class="w-full font-mono text-sm"
              />
              <p class="text-[11px] text-muted-foreground">WhatsApp Business Account ID</p>
            </div>
            <div class="space-y-2">
              <Label for="phone-id">Phone Number ID</Label>
              <Input
                id="phone-id"
                v-model="formPhoneNumberId"
                placeholder="987654321"
                class="w-full font-mono text-sm"
              />
              <p class="text-[11px] text-muted-foreground">Phone Number ID from WABA</p>
            </div>
          </div>

          <div v-if="formError" class="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div class="flex items-start gap-2">
              <Icon name="lucide:alert-circle" class="mt-0.5 size-4 shrink-0" />
              <span>{{ formError }}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" :disabled="isConnecting" @click="connectDialogOpen = false; resetConnectForm()">
              Cancel
            </Button>
            <Button type="submit" :disabled="isConnecting" class="gap-2">
              <Icon v-if="isConnecting" name="lucide:loader-circle" class="size-4 animate-spin" />
              {{ isConnecting ? 'Validating…' : 'Connect' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Manage Dialog -->
    <Dialog v-model:open="manageDialogOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ manageStepMode ? 'Connect WhatsApp' : 'Manage Account' }}</DialogTitle>
          <DialogDescription v-if="manageAccount">
            <strong>{{ manageAccount.businessName }}</strong> · {{ manageAccount.displayPhoneNumber }}
          </DialogDescription>
        </DialogHeader>

        <!-- Step mode (post-connect) -->
        <template v-if="manageStepMode && manageAccount">
          <!-- Step indicator -->
          <div class="flex items-center gap-2 border-b pb-3">
            <div class="flex items-center gap-1.5">
              <span class="flex size-6 items-center justify-center rounded-full text-xs font-medium"
                :class="manageStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">1</span>
              <span class="text-xs" :class="manageStep >= 1 ? 'text-foreground font-medium' : 'text-muted-foreground'">Webhook</span>
            </div>
            <Icon name="lucide:chevron-right" class="size-4 text-muted-foreground" />
            <div class="flex items-center gap-1.5">
              <span class="flex size-6 items-center justify-center rounded-full text-xs font-medium"
                :class="manageStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'">2</span>
              <span class="text-xs" :class="manageStep >= 2 ? 'text-foreground font-medium' : 'text-muted-foreground'">Assign Listings</span>
            </div>
          </div>

          <!-- Step 1: Webhook -->
          <div v-if="manageStep === 1" class="space-y-5 pt-2">
            <div class="space-y-4">
              <div>
                <Label class="mb-1.5 block text-xs font-medium">Callback URL</Label>
                <div class="flex gap-2">
                  <Input :model-value="`https://api.elev8suite.com/webhooks/whatsapp/${manageAccount.wabaId}`" readonly class="flex-1 font-mono text-xs" />
                  <Button variant="outline" size="sm" class="shrink-0" @click="copyCallbackUrl()">
                    <Icon name="lucide:copy" class="size-3.5" />
                  </Button>
                </div>
                <p class="mt-1 text-[11px] text-muted-foreground">Enter this URL in Meta Developer Portal &rarr; WhatsApp &rarr; Webhook.</p>
              </div>

              <div>
                <Label class="mb-1.5 block text-xs font-medium">Verification Token</Label>
                <div class="flex gap-2">
                  <Input :model-value="manageAccount.webhookToken" readonly class="flex-1 font-mono text-xs" />
                  <Button variant="outline" size="sm" class="shrink-0" @click="copyWebhookToken()">
                    <Icon name="lucide:copy" class="size-3.5" />
                  </Button>
                </div>
                <p class="mt-1 text-[11px] text-muted-foreground">Paste this as the Verify Token in Meta Developer Portal.</p>
              </div>
            </div>

            <div class="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p class="mb-1 font-medium text-foreground">Steps to complete setup:</p>
              <ol class="list-inside list-decimal space-y-1">
                <li>Go to your Meta App &rarr; WhatsApp &rarr; Configuration</li>
                <li>Paste the <strong>Callback URL</strong> and <strong>Verification Token</strong> above</li>
                <li>Click <strong>Verify and save</strong></li>
                <li>Subscribe to the <code>messages</code> webhook field</li>
              </ol>
            </div>

            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="closeManageDialog">Skip</Button>
              <Button @click="manageStep = 2">Next</Button>
            </div>
          </div>

          <!-- Step 2: Assign Listings -->
          <div v-if="manageStep === 2" class="space-y-4 pt-2">
            <div class="flex items-center justify-between">
              <Label>Assign Listings</Label>
              <Badge variant="secondary" class="text-[10px]">{{ manageSelectedListings.length }} selected</Badge>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <div class="relative min-w-[200px] flex-1">
                <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input v-model="manageListingSearch" placeholder="Search listing or location" class="h-9 pl-9 text-xs" />
              </div>
              <Popover v-model:open="manageListingTagPopoverOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" size="sm" class="gap-1.5">
                    <Icon name="lucide:tags" class="size-3.5" />
                    Tags
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-72 p-0" align="start" :side-offset="4">
                  <div class="space-y-2 p-2">
                    <Input v-model="manageListingTagSearch" placeholder="Search tags..." class="h-8 text-xs" />
                    <div class="max-h-56 space-y-1 overflow-auto">
                      <button
                        v-for="tag in manageAssignTags.filter(t => t.toLowerCase().includes(manageListingTagSearch.trim().toLowerCase()))"
                        :key="tag"
                        type="button"
                        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        @click="toggleManageListingTag(tag)"
                      >
                        <Checkbox :model-value="manageListingTagSearch === tag" class="size-3.5" @update:model-value="() => toggleManageListingTag(tag)" />
                        <span>{{ tag }}</span>
                      </button>
                      <p v-if="!manageAssignTags.filter(t => t.toLowerCase().includes(manageListingTagSearch.trim().toLowerCase())).length" class="px-2 py-3 text-sm text-muted-foreground">
                        No tags found.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button v-if="manageListingSearch || manageListingTagSearch" variant="ghost" size="sm" class="size-9 p-0" @click="manageListingSearch = ''; manageListingTagSearch = ''">
                <Icon name="lucide:x" class="size-3.5" />
              </Button>
            </div>

            <div class="max-h-[300px] space-y-1.5 overflow-auto rounded-lg border p-1.5">
              <label
                v-for="listing in manageAssignableListings"
                :key="listing.id"
                class="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/50"
              >
                <Checkbox :model-value="manageSelectedListings.includes(listing.id)" @update:model-value="() => toggleManageListing(listing.id)" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-medium">{{ listing.name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ listing.location }}</p>
                </div>
              </label>
              <p v-if="!manageAssignableListings.length" class="py-4 text-center text-xs text-muted-foreground">
                No listings found.
              </p>
            </div>

            <div class="flex justify-end gap-2">
              <Button variant="outline" @click="manageStep = 1">Back</Button>
              <Button @click="saveManageListings; closeManageDialog()">Done</Button>
            </div>
          </div>
        </template>

        <!-- Tab mode (Manage existing account) -->
        <template v-if="!manageStepMode && manageAccount">
          <Tabs v-model="manageTab" class="space-y-4">
            <TabsList class="w-full justify-start">
              <TabsTrigger value="credentials" class="gap-2">
                <Icon name="lucide:key-round" class="size-3.5" />
                Credentials
              </TabsTrigger>
              <TabsTrigger value="listings" class="gap-2">
                <Icon name="lucide:building-2" class="size-3.5" />
                Listings
              </TabsTrigger>
            </TabsList>

            <!-- Credentials tab -->
            <TabsContent value="credentials" class="space-y-4">
              <form @submit.prevent="saveManageCredentials">
                <div class="space-y-4">
                  <div class="space-y-2">
                    <Label for="manage-access-token">Access Token</Label>
                    <Input id="manage-access-token" v-model="manageAccessToken" type="password" class="w-full font-mono text-sm" />
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <Label for="manage-waba-id">WABA ID</Label>
                      <Input id="manage-waba-id" v-model="manageWabaId" class="w-full font-mono text-sm" />
                    </div>
                    <div class="space-y-2">
                      <Label for="manage-phone-id">Phone Number ID</Label>
                      <Input id="manage-phone-id" v-model="managePhoneNumberId" class="w-full font-mono text-sm" />
                    </div>
                  </div>
                  <p v-if="manageCredsError" class="text-sm text-destructive">{{ manageCredsError }}</p>
                </div>
                <DialogFooter class="mt-6">
                  <Button variant="outline" @click="closeManageDialog">Cancel</Button>
                  <Button type="submit" :disabled="manageSavingCreds" class="gap-2">
                    <Icon v-if="manageSavingCreds" name="lucide:loader-circle" class="size-4 animate-spin" />
                    {{ manageSavingCreds ? 'Saving…' : 'Save Credentials' }}
                  </Button>
                </DialogFooter>
              </form>

              <!-- Webhook fields -->
              <Separator />
              <div class="space-y-1">
                <h4 class="text-sm font-medium">Webhook Configuration</h4>
                <p class="text-xs text-muted-foreground">Incoming message setup for this account.</p>
              </div>
              <div class="space-y-4">
                <div>
                  <Label class="mb-1.5 block text-xs font-medium">Callback URL</Label>
                  <div class="flex gap-2">
                    <Input :model-value="`https://api.elev8suite.com/webhooks/whatsapp/${manageAccount.wabaId}`" readonly class="flex-1 font-mono text-xs" />
                    <Button variant="outline" size="sm" class="shrink-0" @click="copyCallbackUrl()">
                      <Icon name="lucide:copy" class="size-3.5" />
                    </Button>
                  </div>
                  <p class="mt-1 text-[11px] text-muted-foreground">Enter this URL in Meta Developer Portal &rarr; WhatsApp &rarr; Webhook.</p>
                </div>
                <div>
                  <Label class="mb-1.5 block text-xs font-medium">Verification Token</Label>
                  <div class="flex gap-2">
                    <Input :model-value="manageAccount.webhookToken" readonly class="flex-1 font-mono text-xs" />
                    <Button variant="outline" size="sm" class="shrink-0" @click="copyWebhookToken()">
                      <Icon name="lucide:copy" class="size-3.5" />
                    </Button>
                  </div>
                  <p class="mt-1 text-[11px] text-muted-foreground">Paste this as the Verify Token in Meta Developer Portal.</p>
                </div>
              </div>
              <div class="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <p class="mb-1 font-medium text-foreground">Steps to complete setup:</p>
                <ol class="list-inside list-decimal space-y-1">
                  <li>Go to your Meta App &rarr; WhatsApp &rarr; Configuration</li>
                  <li>Paste the <strong>Callback URL</strong> and <strong>Verification Token</strong> above</li>
                  <li>Click <strong>Verify and save</strong></li>
                  <li>Subscribe to the <code>messages</code> webhook field</li>
                </ol>
              </div>
            </TabsContent>

            <!-- Listings tab -->
            <TabsContent value="listings" class="space-y-4">
              <div class="flex items-center justify-between">
                <Label>Assign Listings</Label>
                <Badge variant="secondary" class="text-[10px]">{{ manageSelectedListings.length }} selected</Badge>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <div class="relative min-w-[200px] flex-1">
                  <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input v-model="manageListingSearch" placeholder="Search listing or location" class="h-9 pl-9 text-xs" />
                </div>
                <Popover v-model:open="manageListingTagPopoverOpen">
                  <PopoverTrigger as-child>
                    <Button variant="outline" size="sm" class="gap-1.5">
                      <Icon name="lucide:tags" class="size-3.5" />
                      Tags
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-72 p-0" align="start" :side-offset="4">
                    <div class="space-y-2 p-2">
                      <Input v-model="manageListingTagSearch" placeholder="Search tags..." class="h-8 text-xs" />
                      <div class="max-h-56 space-y-1 overflow-auto">
                        <button v-for="tag in manageAssignTags.filter(t => t.toLowerCase().includes(manageListingTagSearch.trim().toLowerCase()))" :key="tag" type="button" class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted" @click="toggleManageListingTag(tag)">
                          <Checkbox :model-value="manageListingTagSearch === tag" class="size-3.5" @update:model-value="() => toggleManageListingTag(tag)" />
                          <span>{{ tag }}</span>
                        </button>
                        <p v-if="!manageAssignTags.filter(t => t.toLowerCase().includes(manageListingTagSearch.trim().toLowerCase())).length" class="px-2 py-3 text-sm text-muted-foreground">No tags found.</p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button v-if="manageListingSearch || manageListingTagSearch" variant="ghost" size="sm" class="size-9 p-0" @click="manageListingSearch = ''; manageListingTagSearch = ''">
                  <Icon name="lucide:x" class="size-3.5" />
                </Button>
              </div>
              <div class="max-h-[300px] space-y-1.5 overflow-auto rounded-lg border p-1.5">
                <label v-for="listing in manageAssignableListings" :key="listing.id" class="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/50">
                  <Checkbox :model-value="manageSelectedListings.includes(listing.id)" @update:model-value="() => toggleManageListing(listing.id)" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-xs font-medium">{{ listing.name }}</p>
                    <p class="text-[11px] text-muted-foreground">{{ listing.location }}</p>
                  </div>
                </label>
                <p v-if="!manageAssignableListings.length" class="py-4 text-center text-xs text-muted-foreground">No listings found.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" @click="closeManageDialog">Cancel</Button>
                <Button @click="saveManageListings; closeManageDialog()">Save Assignments</Button>
              </DialogFooter>
            </TabsContent>

          </Tabs>
        </template>
      </DialogContent>
    </Dialog>

    <!-- Disconnect confirmation -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disconnect WhatsApp?</DialogTitle>
          <DialogDescription>This will remove the WhatsApp account and its listing assignments.</DialogDescription>
        </DialogHeader>
        <div class="rounded-lg border bg-muted/20 p-4 text-sm">
          <p class="font-medium">{{ accountToDelete?.businessName }}</p>
          <p class="mt-1 text-muted-foreground">{{ accountToDelete?.displayPhoneNumber }}</p>
        </div>
        <ul class="space-y-1.5 text-sm text-muted-foreground">
          <li class="flex gap-2"><span>•</span> Stop all automated WhatsApp messages for assigned listings</li>
          <li class="flex gap-2"><span>•</span> Remove connection credentials</li>
          <li class="flex gap-2"><span>•</span> Existing conversation history remains</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" @click="deleteDialogOpen = false">Cancel</Button>
          <Button variant="destructive" @click="confirmDelete">Yes, Disconnect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
