<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { jurnalAccounts } from '@/components/finance/data/jurnal'
import { useJurnal } from '@/composables/useJurnal'
import { allListings, useListingMappings } from '@/composables/useListingMappings'

const {
  isConnected,
  apiKey,
  apiKeyInput,
  companyName,
  lastConnected,
  isTesting,
  isSaving,
  isPushingCosts,
  isPushingRevenue,
  syncLogs,
  pendingCostEntries,
  pendingRevenueEntries,
  lastCostSync,
  lastRevenueSync,
  testConnection,
  saveApiKey,
  disconnect,
  pushCosts,
  pushRevenue,
  formatDate,
} = useJurnal()

const showDisconnectConfirm = ref(false)
const showApiKeyInput = ref(false)

// ── Listing mapping ────────────────────────────────────────────────────────
const { mappings, setMapping, clearMapping, getMappingFor } = useListingMappings()

const regionFilter = ref<'all' | 'Switzerland' | 'Bali'>('all')
const applyToAllAccount = ref('')

const filteredListings = computed(() =>
  regionFilter.value === 'all' ? allListings : allListings.filter(l => l.region === regionFilter.value),
)

const jurnalMappedCount = computed(() =>
  allListings.filter(l => getMappingFor(l.name)?.integration === 'jurnal').length,
)

function isMappedToBexio(listingName: string): boolean {
  return getMappingFor(listingName)?.integration === 'bexio'
}

function setJurnalMapping(listingName: string, accountId: string) {
  if (accountId)
    setMapping(listingName, 'jurnal', accountId)
  else clearMapping(listingName)
}

function applyToAll(accountId: string) {
  if (!accountId)
    return
  filteredListings.value
    .filter(l => !isMappedToBexio(l.name))
    .forEach(l => setMapping(l.name, 'jurnal', accountId))
}

function accountLabel(id: string) {
  const acc = jurnalAccounts.find(a => a.id === id)
  return acc ? `${acc.code} – ${acc.name}` : '—'
}

function getMappingValue(listingName: string): string {
  const m = getMappingFor(listingName)
  return m?.integration === 'jurnal' ? m.accountId : ''
}

async function handleTestConnection() {
  const ok = await testConnection()
  if (ok)
    toast.success('Connection successful — Jurnal API responded.')
  else toast.error('Connection failed. Check your API key.')
}

async function handleSaveApiKey() {
  if (!apiKeyInput.value.trim()) {
    toast.error('API key cannot be empty.')
    return
  }
  await saveApiKey()
  showApiKeyInput.value = false
  toast.success('API key saved. Connected to Mekari Jurnal.')
}

function handleDisconnect() {
  disconnect()
  showDisconnectConfirm.value = false
  toast.success('Disconnected from Mekari Jurnal.')
}

async function handlePushCosts() {
  await pushCosts()
  toast.success(`${pendingCostEntries.value} cost entries pushed to Jurnal.`)
}

async function handlePushRevenue() {
  await pushRevenue()
  toast.success(`${pendingRevenueEntries.value} revenue entries pushed to Jurnal.`)
}

const statusBadge: Record<string, string> = {
  Success: 'text-green-700 bg-green-50',
  Partial: 'text-amber-700 bg-amber-50',
  Failed: 'text-red-700 bg-red-50',
}

const typeBadge: Record<string, string> = {
  Cost: 'text-amber-700 bg-amber-50',
  Revenue: 'text-blue-700 bg-blue-50',
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Connection card -->
    <div class="rounded-lg border bg-card">
      <div class="flex items-center justify-between border-b px-5 py-3.5">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
            <Icon name="i-lucide-link" class="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p class="text-sm font-medium">
              Mekari Jurnal
            </p>
            <p class="text-xs text-muted-foreground">
              Accounting & ledger integration
            </p>
          </div>
        </div>
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          :class="isConnected ? 'text-green-700 bg-green-50' : 'text-slate-600 bg-slate-100'"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-slate-400'" />
          {{ isConnected ? 'Connected' : 'Not connected' }}
        </span>
      </div>

      <div class="p-5">
        <!-- Connected state -->
        <template v-if="isConnected">
          <dl class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs text-muted-foreground">
                Company
              </dt>
              <dd class="mt-0.5 font-medium">
                {{ companyName }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">
                API Key
              </dt>
              <dd class="mt-0.5 font-mono text-sm">
                {{ apiKey }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">
                Connected since
              </dt>
              <dd class="mt-0.5 font-medium">
                {{ lastConnected }}
              </dd>
            </div>
          </dl>
          <div class="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="isTesting"
              @click="handleTestConnection"
            >
              <Icon
                name="i-lucide-refresh-cw"
                class="mr-2 h-3.5 w-3.5"
                :class="{ 'animate-spin': isTesting }"
              />
              {{ isTesting ? 'Testing…' : 'Test Connection' }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="showApiKeyInput = !showApiKeyInput"
            >
              <Icon name="i-lucide-key" class="mr-2 h-3.5 w-3.5" />
              Update API Key
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="showDisconnectConfirm = true"
            >
              <Icon name="i-lucide-unlink" class="mr-2 h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        </template>

        <!-- Not connected state -->
        <template v-else>
          <p class="mb-4 text-sm text-muted-foreground">
            Connect your Mekari Jurnal account to push cost and revenue entries directly into your accounting ledger.
          </p>
          <Button size="sm" @click="showApiKeyInput = true">
            <Icon name="i-lucide-plug" class="mr-2 h-3.5 w-3.5" />
            Connect Mekari Jurnal
          </Button>
        </template>

        <!-- API key input -->
        <div v-if="showApiKeyInput" class="mt-4 flex flex-col gap-3 rounded-lg border bg-muted/40 p-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium">API Key</label>
            <p class="mb-2 text-xs text-muted-foreground">
              Found in Mekari Jurnal → Settings → API Access.
            </p>
            <Input
              v-model="apiKeyInput"
              type="password"
              placeholder="sk-jurnal-..."
              class="font-mono"
              @keydown.enter="handleSaveApiKey"
            />
          </div>
          <div class="flex gap-2">
            <Button size="sm" :disabled="isSaving" @click="handleSaveApiKey">
              <Icon
                v-if="isSaving"
                name="i-lucide-loader-2"
                class="mr-2 h-3.5 w-3.5 animate-spin"
              />
              {{ isSaving ? 'Saving…' : 'Save & Connect' }}
            </Button>
            <Button variant="ghost" size="sm" @click="showApiKeyInput = false; apiKeyInput = ''">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Push actions (only when connected) -->
    <div v-if="isConnected" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <!-- Push costs -->
      <div class="rounded-lg border bg-card p-5">
        <div class="mb-3 flex items-start justify-between">
          <div>
            <p class="text-sm font-medium">
              Push Cost Entries
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Send cost entries to Jurnal as expense transactions.
            </p>
          </div>
          <span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {{ pendingCostEntries }} entries
          </span>
        </div>
        <div v-if="lastCostSync" class="mb-3 text-xs text-muted-foreground">
          Last synced: {{ formatDate(lastCostSync) }}
        </div>
        <Button
          size="sm"
          :disabled="isPushingCosts || pendingCostEntries === 0"
          @click="handlePushCosts"
        >
          <Icon
            v-if="isPushingCosts"
            name="i-lucide-loader-2"
            class="mr-2 h-3.5 w-3.5 animate-spin"
          />
          <Icon v-else name="i-lucide-upload" class="mr-2 h-3.5 w-3.5" />
          {{ isPushingCosts ? 'Pushing…' : 'Push to Jurnal' }}
        </Button>
      </div>

      <!-- Push revenue -->
      <div class="rounded-lg border bg-card p-5">
        <div class="mb-3 flex items-start justify-between">
          <div>
            <p class="text-sm font-medium">
              Push Revenue Entries
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Send booking revenue to Jurnal as income transactions.
            </p>
          </div>
          <span class="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {{ pendingRevenueEntries }} entries
          </span>
        </div>
        <div v-if="lastRevenueSync" class="mb-3 text-xs text-muted-foreground">
          Last synced: {{ formatDate(lastRevenueSync) }}
        </div>
        <Button
          size="sm"
          :disabled="isPushingRevenue || pendingRevenueEntries === 0"
          @click="handlePushRevenue"
        >
          <Icon
            v-if="isPushingRevenue"
            name="i-lucide-loader-2"
            class="mr-2 h-3.5 w-3.5 animate-spin"
          />
          <Icon v-else name="i-lucide-upload" class="mr-2 h-3.5 w-3.5" />
          {{ isPushingRevenue ? 'Pushing…' : 'Push to Jurnal' }}
        </Button>
      </div>
    </div>

    <!-- Listing mapping -->
    <div v-if="isConnected" class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium">
            Listing Mapping
          </p>
          <p class="text-xs text-muted-foreground">
            Map listings to Jurnal revenue accounts for automatic posting
          </p>
        </div>
        <Badge variant="secondary" class="tabular-nums shrink-0">
          {{ jurnalMappedCount }}/{{ allListings.length }} mapped
        </Badge>
      </div>
      <div class="p-5 flex flex-col gap-4">
        <!-- Apply to all + region filter -->
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted-foreground">Apply one account to visible listings</label>
            <div class="flex gap-2">
              <Select v-model="applyToAllAccount">
                <SelectTrigger class="h-8 w-72 text-sm">
                  <SelectValue placeholder="Select Jurnal account…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="acc in jurnalAccounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} – {{ acc.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" class="h-8" :disabled="!applyToAllAccount" @click="applyToAll(applyToAllAccount)">
                Apply to all
              </Button>
            </div>
          </div>
          <div class="flex items-center gap-1 self-end">
            <Button
              v-for="r in ['all', 'Switzerland', 'Bali']"
              :key="r"
              variant="ghost"
              size="sm"
              class="h-8 px-3 text-xs"
              :class="regionFilter === r && 'bg-muted font-medium'"
              @click="regionFilter = r as typeof regionFilter"
            >
              {{ r === 'all' ? 'All' : r }}
            </Button>
          </div>
        </div>

        <!-- Table -->
        <div class="rounded-md border overflow-hidden">
          <ScrollArea class="h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead class="w-24">
                    Region
                  </TableHead>
                  <TableHead class="w-80">
                    Jurnal Account
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="listing in filteredListings"
                  :key="listing.name"
                  :class="isMappedToBexio(listing.name) ? 'opacity-60' : getMappingValue(listing.name) ? '' : 'bg-amber-50/40 dark:bg-amber-900/10'"
                >
                  <TableCell class="text-sm font-medium max-w-xs truncate" :title="listing.name">
                    {{ listing.name }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" class="text-xs font-normal">
                      {{ listing.region }}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div v-if="isMappedToBexio(listing.name)" class="flex items-center gap-1.5">
                      <Icon name="i-lucide-lock" class="h-3 w-3 text-muted-foreground" />
                      <span class="text-xs text-muted-foreground">Mapped to Bexio</span>
                    </div>
                    <Select
                      v-else
                      :model-value="getMappingValue(listing.name)"
                      @update:model-value="val => setJurnalMapping(listing.name, val)"
                    >
                      <SelectTrigger class="h-7 w-full text-xs">
                        <SelectValue placeholder="Select account…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="acc in jurnalAccounts" :key="acc.id" :value="acc.id">
                          {{ acc.code }} – {{ acc.name }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>

    <!-- Sync history -->
    <div class="rounded-lg border bg-card">
      <div class="border-b px-5 py-3.5">
        <p class="text-sm font-medium">
          Sync History
        </p>
        <p class="text-xs text-muted-foreground">
          All push operations to Mekari Jurnal
        </p>
      </div>
      <div v-if="syncLogs.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b bg-muted/40">
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Date & Time
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Type
              </th>
              <th class="px-3 py-2.5 text-center text-xs font-medium text-muted-foreground">
                Entries
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Jurnal Ref
              </th>
              <th class="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">
                Pushed by
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <template v-for="log in syncLogs" :key="log.id">
              <tr class="hover:bg-muted/30">
                <td class="px-5 py-3 tabular-nums text-muted-foreground">
                  {{ formatDate(log.date) }}
                </td>
                <td class="px-3 py-3">
                  <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="typeBadge[log.type]">
                    {{ log.type }}
                  </span>
                </td>
                <td class="px-3 py-3 text-center tabular-nums">
                  {{ log.entriesSuccess }}/{{ log.entriesTotal }}
                </td>
                <td class="px-3 py-3">
                  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusBadge[log.status]">
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="{
                        'bg-green-500': log.status === 'Success',
                        'bg-amber-500': log.status === 'Partial',
                        'bg-red-500': log.status === 'Failed',
                      }"
                    />
                    {{ log.status }}
                  </span>
                </td>
                <td class="px-3 py-3 font-mono text-xs">
                  {{ log.jurnalReference ?? '—' }}
                </td>
                <td class="px-5 py-3 text-muted-foreground">
                  {{ log.pushedBy }}
                </td>
              </tr>
              <!-- Error row -->
              <tr v-if="log.errorMessage" class="bg-red-50/50">
                <td colspan="6" class="px-5 py-2 text-xs text-red-600">
                  <Icon name="i-lucide-alert-circle" class="mr-1 inline h-3 w-3" />
                  {{ log.errorMessage }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-else class="px-5 py-10 text-center text-sm text-muted-foreground">
        No sync history yet. Push your first entries to get started.
      </div>
    </div>

    <!-- Disconnect confirm dialog -->
    <AlertDialog :open="showDisconnectConfirm" @update:open="showDisconnectConfirm = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Mekari Jurnal?</AlertDialogTitle>
          <AlertDialogDescription as="div" class="flex flex-col gap-3">
            <p>Your API key will be removed and future entries will no longer be synced automatically.</p>
            <div
              v-if="pendingCostEntries > 0"
              class="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5"
            >
              <Icon name="i-lucide-triangle-alert" class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p class="text-sm text-amber-800">
                <span class="font-medium">{{ pendingCostEntries }} {{ pendingCostEntries === 1 ? 'entry' : 'entries' }}</span>
                not yet synced will remain unsynced until you reconnect.
              </p>
            </div>
            <p class="text-xs text-muted-foreground">
              Entries already pushed to Jurnal will remain there and are not affected.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="handleDisconnect">
            Disconnect
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
