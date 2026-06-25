<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { listings } from '~/components/listings/data/listings'
import type { WhatsAppAccount } from '~/composables/useWhatsApp'

const {
  whatsappAccounts,
  addAccount,
  removeAccount,
  assignListings,
  bulkAssign,
} = useWhatsApp()

const activeTab = ref<'connected' | 'unassigned'>('connected')
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const isConnecting = ref(false)

// Edit mode
const editAccountId = ref('')
const selectedListings = ref<string[]>([])
const accountToDelete = ref<WhatsAppAccount | null>(null)

// Unassigned tab
const unassignedSearch = ref('')
const unassignedTagSearch = ref('')
const selectedUnassignedTags = ref<string[]>([])
const selectedUnassignedListings = ref<string[]>([])
const selectedBulkAccountId = ref('')
const unassignedTagPopoverOpen = ref(false)

// Assign step in dialog
const assignSearch = ref('')
const assignTagSearch = ref('')
const assignTagPopoverOpen = ref(false)

const editingAccount = computed(() =>
  whatsappAccounts.value.find(a => a.id === editAccountId.value) ?? null,
)

const listingOptions = computed(() =>
  listings.value.map(listing => ({ id: listing.id, name: listing.name, location: listing.location })),
)

const assignableListings = computed(() => {
  const query = assignSearch.value.trim().toLowerCase()
  const tag = assignTagSearch.value.trim().toLowerCase()
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

const assignTags = computed(() =>
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

const mockAccounts = [
  { phoneNumber: '+62 811 2345 6789', businessName: 'Elev8 Bali Office' },
  { phoneNumber: '+62 877 8901 2345', businessName: 'Elev8 Seminyak Hub' },
  { phoneNumber: '+62 813 5678 9012', businessName: 'Elev8 Canggu Lodge' },
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function resetDialog() {
  editAccountId.value = ''
  selectedListings.value = []
  assignSearch.value = ''
  assignTagSearch.value = ''
  assignTagPopoverOpen.value = false
}

function startOAuthFlow() {
  if (isConnecting.value) return
  isConnecting.value = true

  toast.info('Opening Meta Embedded Signup…')

  setTimeout(() => {
    // Simulate OAuth success — Meta returns phone + business name
    const mock = pickRandom(mockAccounts)
    const newId = `wa-${Date.now()}`
    const newAccount: WhatsAppAccount = {
      id: newId,
      phoneNumber: mock.phoneNumber,
      businessName: mock.businessName,
      status: 'connected',
      connectedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      listingIds: [],
    }

    addAccount(newAccount)
    toast.success(`${mock.businessName} connected.`)

    // Open listing assignment dialog for the new account
    editAccountId.value = newId
    selectedListings.value = []
    dialogOpen.value = true
    isConnecting.value = false
  }, 1200)
}

function openEditDialog(account: WhatsAppAccount) {
  editAccountId.value = account.id
  selectedListings.value = [...account.listingIds]
  assignSearch.value = ''
  assignTagSearch.value = ''
  dialogOpen.value = true
}

function saveAssignments() {
  if (!editAccountId.value) return
  assignListings(editAccountId.value, [...selectedListings.value])
  toast.success('Listing assignments saved.')
  dialogOpen.value = false
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

function toggleListing(listingId: string) {
  selectedListings.value = selectedListings.value.includes(listingId)
    ? selectedListings.value.filter(id => id !== listingId)
    : [...selectedListings.value, listingId]
}

function toggleAssignTag(tag: string) {
  assignTagSearch.value = assignTagSearch.value === tag ? '' : tag
}

function toggleUnassignedListing(listingId: string) {
  selectedUnassignedListings.value = selectedUnassignedListings.value.includes(listingId)
    ? selectedUnassignedListings.value.filter(id => id !== listingId)
    : [...selectedUnassignedListings.value, listingId]
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
  toast.success(`Test message sent to ${account.phoneNumber}.`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-end justify-between gap-4">
      <div class="space-y-1">
        <h3 class="text-lg font-medium">WhatsApp Business</h3>
        <p class="text-sm text-muted-foreground">Connect WhatsApp Business numbers to send and receive guest messages.</p>
      </div>
      <Button class="gap-2" :disabled="isConnecting" @click="startOAuthFlow">
        <Icon v-if="isConnecting" name="lucide:loader-circle" class="size-4 animate-spin" />
        <Icon v-else name="lucide:plus" class="size-4" />
        {{ isConnecting ? 'Connecting…' : 'Add account' }}
      </Button>
    </div>

    <!-- Empty state -->
    <div v-if="!hasAccounts && !isConnecting" class="border border-dashed bg-card/40 p-10 text-center">
      <div class="mx-auto flex max-w-md flex-col items-center gap-4">
        <div class="flex size-12 items-center justify-center rounded-full border bg-background">
          <Icon name="lucide:message-circle" class="size-5 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <p class="text-base font-medium">No WhatsApp account yet</p>
          <p class="text-sm text-muted-foreground">Connect a WhatsApp Business number via Meta to start messaging guests.</p>
        </div>
        <Button class="gap-2" @click="startOAuthFlow">
          <Icon name="lucide:message-circle" class="size-4" />
          Connect with Meta
        </Button>
      </div>
    </div>

    <Tabs v-model="activeTab" class="space-y-4">
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
              <p class="mt-0.5 text-xs text-muted-foreground">{{ account.phoneNumber }}</p>
              <p class="text-xs text-muted-foreground">Connected {{ account.connectedAt }} · {{ account.listingIds.length }} listing{{ account.listingIds.length !== 1 ? 's' : '' }}</p>
              <div class="mt-3 flex gap-2">
                <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="openEditDialog(account)">
                  <Icon name="lucide:pencil" class="size-3.5" />
                  Assign Listings
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
              {{ account.status === 'connected' ? 'Connected' : account.status }}
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
                  <p v-if="!unassignedTags.filter(t => t.toLowerCase().includes(unassignedTagSearch.trim().toLowerCase())).length" class="px-2 py-3 text-sm text-muted-foreground">
                    No tags found.
                  </p>
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

    <!-- Assign Listings Dialog (opens after OAuth, or via Edit) -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Listings</DialogTitle>
          <DialogDescription v-if="editingAccount">
            Choose which listings use <strong>{{ editingAccount.businessName }}</strong> ({{ editingAccount.phoneNumber }}).
          </DialogDescription>
        </DialogHeader>

        <div v-if="editingAccount" class="space-y-4">
          <div class="rounded-lg border bg-muted/30 p-3 text-sm">
            <p class="font-medium">{{ editingAccount.businessName }}</p>
            <p class="text-xs text-muted-foreground">{{ editingAccount.phoneNumber }} · Connected {{ editingAccount.connectedAt }}</p>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>Listings</Label>
              <Badge variant="secondary" class="text-[10px]">{{ selectedListings.length }} selected</Badge>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <div class="relative min-w-[200px] flex-1">
                <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input v-model="assignSearch" placeholder="Search listing or location" class="h-9 pl-9 text-xs" />
              </div>
              <Popover v-model:open="assignTagPopoverOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" size="sm" class="gap-1.5">
                    <Icon name="lucide:tags" class="size-3.5" />
                    Tags
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-72 p-0" align="start" :side-offset="4">
                  <div class="space-y-2 p-2">
                    <Input v-model="assignTagSearch" placeholder="Search tags..." class="h-8 text-xs" />
                    <div class="max-h-56 space-y-1 overflow-auto">
                      <button
                        v-for="tag in assignTags.filter(t => t.toLowerCase().includes(assignTagSearch.trim().toLowerCase()))"
                        :key="tag"
                        type="button"
                        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                        @click="toggleAssignTag(tag)"
                      >
                        <Checkbox :model-value="assignTagSearch === tag" class="size-3.5" @update:model-value="() => toggleAssignTag(tag)" />
                        <span>{{ tag }}</span>
                      </button>
                      <p v-if="!assignTags.filter(t => t.toLowerCase().includes(assignTagSearch.trim().toLowerCase())).length" class="px-2 py-3 text-sm text-muted-foreground">
                        No tags found.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button v-if="assignSearch || assignTagSearch" variant="ghost" size="sm" class="size-9 p-0" @click="assignSearch = ''; assignTagSearch = ''">
                <Icon name="lucide:x" class="size-3.5" />
              </Button>
            </div>

            <div class="max-h-[280px] space-y-1.5 overflow-auto rounded-lg border p-1.5">
              <label
                v-for="listing in assignableListings"
                :key="listing.id"
                class="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/50"
              >
                <Checkbox :model-value="selectedListings.includes(listing.id)" @update:model-value="() => toggleListing(listing.id)" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-xs font-medium">{{ listing.name }}</p>
                  <p class="text-[11px] text-muted-foreground">{{ listing.location }}</p>
                </div>
              </label>
              <p v-if="!assignableListings.length" class="py-4 text-center text-xs text-muted-foreground">
                No listings found.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialogOpen = false">Cancel</Button>
          <Button @click="saveAssignments">Save Assignments</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete confirmation -->
    <Dialog v-model:open="deleteDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disconnect WhatsApp?</DialogTitle>
          <DialogDescription>This will remove the WhatsApp account and its listing assignments.</DialogDescription>
        </DialogHeader>
        <div class="rounded-lg border bg-muted/20 p-4 text-sm">
          <p class="font-medium">{{ accountToDelete?.businessName }}</p>
          <p class="mt-1 text-muted-foreground">{{ accountToDelete?.phoneNumber }}</p>
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
