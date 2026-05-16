<script setup lang="ts">
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { useBexio } from '@/composables/useBexio'
import { useListingMappings } from '@/composables/useListingMappings'

const { getMappingFor } = useListingMappings()

function isMappedToJurnal(listingName: string): boolean {
  return getMappingFor(listingName)?.integration === 'jurnal'
}

const {
  isConnected,
  step,
  apiKey,
  apiKeyInput,
  companyName,
  lastConnected,
  isSaving,
  bexioListings,
  bexioAccounts,
  localSelections,
  localMappedCount,
  availableListings,
  isFullyMapped,
  confirmedMappings,
  connect,
  applyAccountToAll,
  setLocalSelection,
  confirmMapping,
  editMapping,
  disconnect,
  accountLabel,
} = useBexio()

// ── Step 1: Connect ────────────────────────────────────────────────────────
async function handleConnect() {
  if (!apiKeyInput.value.trim()) {
    toast.error('API key cannot be empty.')
    return
  }
  await connect(apiKeyInput.value)
  toast.success('Connected to bexio. Now map your listings.')
}

// ── Step 2: Mapping ────────────────────────────────────────────────────────
const regionFilter = ref<'all' | 'Switzerland' | 'Bali'>('all')
const applyToAllAccount = ref('')

const filteredListings = computed(() =>
  regionFilter.value === 'all'
    ? bexioListings
    : bexioListings.filter(l => l.region === regionFilter.value),
)

function handleApplyToAll() {
  if (!applyToAllAccount.value) return
  applyAccountToAll(applyToAllAccount.value, regionFilter.value === 'all' ? undefined : regionFilter.value)
}

function handleSaveMapping() {
  confirmMapping()
  toast.success('Listing mapping saved. bexio is now connected.')
}

// ── Step 3: Connected ──────────────────────────────────────────────────────
function handleDisconnect() {
  disconnect()
  toast.info('Disconnected from bexio.')
}

const progressPct = computed(() => Math.round((localMappedCount.value / availableListings.length) * 100))
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- ── Step indicator ────────────────────────────────────────────────── -->
    <div class="flex items-center gap-2 text-sm">
      <span
        class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
        :class="step === 'connect' ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-white'"
      >
        <Icon v-if="step !== 'connect'" name="i-lucide-check" class="h-3.5 w-3.5" />
        <span v-else>1</span>
      </span>
      <span :class="step === 'connect' ? 'font-medium' : 'text-muted-foreground'">Connect API</span>
      <Separator class="w-8" />
      <span
        class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
        :class="step === 'mapping' ? 'bg-primary text-primary-foreground' : step === 'connected' ? 'bg-green-500 text-white' : 'border text-muted-foreground'"
      >
        <Icon v-if="step === 'connected'" name="i-lucide-check" class="h-3.5 w-3.5" />
        <span v-else>2</span>
      </span>
      <span :class="step === 'mapping' ? 'font-medium' : 'text-muted-foreground'">Map listings</span>
      <Separator class="w-8" />
      <span
        class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
        :class="step === 'connected' ? 'bg-green-500 text-white' : 'border text-muted-foreground'"
      >
        <Icon v-if="step === 'connected'" name="i-lucide-check" class="h-3.5 w-3.5" />
        <span v-else>3</span>
      </span>
      <span :class="step === 'connected' ? 'font-medium text-green-600' : 'text-muted-foreground'">Connected</span>
    </div>

    <!-- ── Step 1: Connect ───────────────────────────────────────────────── -->
    <div v-if="step === 'connect'" class="rounded-lg border bg-card p-5">
      <p class="mb-1 text-sm font-medium">Connect bexio</p>
      <p class="mb-4 text-sm text-muted-foreground">
        Enter your bexio API key to sync financial data. Found in bexio → Settings → API.
      </p>
      <div class="flex flex-col gap-3">
        <Input
          v-model="apiKeyInput"
          type="password"
          placeholder="bexio API key…"
          class="font-mono"
          @keydown.enter="handleConnect"
        />
        <Button size="sm" :disabled="isSaving" class="self-start" @click="handleConnect">
          <Icon v-if="isSaving" name="i-lucide-loader-2" class="mr-2 h-3.5 w-3.5 animate-spin" />
          {{ isSaving ? 'Connecting…' : 'Connect bexio' }}
        </Button>
      </div>
    </div>

    <!-- ── Step 2: Map listings ──────────────────────────────────────────── -->
    <div v-else-if="step === 'mapping'" class="flex flex-col gap-4">
      <div class="rounded-lg border bg-card p-5">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div>
            <p class="text-sm font-medium">Map listings to bexio accounts</p>
            <p class="text-sm text-muted-foreground mt-0.5">
              Select which bexio revenue account each listing should post to when synced.
            </p>
          </div>
          <Badge :variant="isFullyMapped ? 'default' : 'secondary'" class="shrink-0 tabular-nums">
            {{ mappedCount }}/{{ availableListings.length }} mapped
          </Badge>
        </div>

        <!-- Progress bar -->
        <div class="mb-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            class="h-full rounded-full bg-primary transition-all duration-300"
            :style="{ width: `${progressPct}%` }"
          />
        </div>

        <!-- Apply to all + region filter -->
        <div class="flex flex-wrap items-end gap-3 mb-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-muted-foreground">Apply one account to all listings</label>
            <div class="flex gap-2">
              <Select v-model="applyToAllAccount">
                <SelectTrigger class="h-8 w-64 text-sm">
                  <SelectValue placeholder="Select account…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="acc in bexioAccounts" :key="acc.id" :value="acc.id">
                    {{ acc.code }} – {{ acc.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" class="h-8" :disabled="!applyToAllAccount" @click="handleApplyToAll">
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

        <!-- Mapping table -->
        <div class="rounded-md border overflow-hidden">
          <ScrollArea class="h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead class="w-24">Region</TableHead>
                  <TableHead class="w-72">bexio Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="listing in filteredListings"
                  :key="listing.name"
                  :class="isMappedToJurnal(listing.name) ? 'opacity-60' : localSelections[listing.name] ? '' : 'bg-amber-50/40 dark:bg-amber-900/10'"
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
                    <div v-if="isMappedToJurnal(listing.name)" class="flex items-center gap-1.5">
                      <Icon name="i-lucide-lock" class="h-3 w-3 text-muted-foreground" />
                      <span class="text-xs text-muted-foreground">Mapped to Jurnal</span>
                    </div>
                    <Select
                      v-else
                      :model-value="localSelections[listing.name] ?? ''"
                      @update:model-value="val => setLocalSelection(listing.name, val)"
                    >
                      <SelectTrigger class="h-7 w-full text-xs">
                        <SelectValue placeholder="Select account…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="acc in bexioAccounts" :key="acc.id" :value="acc.id">
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

      <div class="flex items-center justify-between">
        <p v-if="!isFullyMapped" class="text-sm text-muted-foreground">
          {{ availableListings.length - mappedCount }} listing{{ availableListings.length - mappedCount > 1 ? 's' : '' }} still need an account.
        </p>
        <p v-else class="text-sm text-green-600 font-medium flex items-center gap-1.5">
          <Icon name="i-lucide-circle-check" class="h-4 w-4" />
          All listings mapped — ready to save.
        </p>
        <Button :disabled="!isFullyMapped" @click="handleSaveMapping">
          Save mapping & finish
        </Button>
      </div>
    </div>

    <!-- ── Step 3: Connected ─────────────────────────────────────────────── -->
    <div v-else class="flex flex-col gap-4">
      <div class="rounded-lg border bg-card p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-green-500" />
              <p class="text-sm font-medium">Connected to bexio</p>
            </div>
            <p class="text-sm text-muted-foreground">{{ companyName }}</p>
            <p class="text-xs text-muted-foreground font-mono">{{ apiKey }}</p>
            <p v-if="lastConnected" class="text-xs text-muted-foreground">
              Connected since {{ lastConnected }}
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" @click="editMapping">
              <Icon name="i-lucide-pencil" class="mr-1.5 h-3.5 w-3.5" />
              Edit mapping
            </Button>
            <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="handleDisconnect">
              Disconnect
            </Button>
          </div>
        </div>
      </div>

      <!-- Mapping summary -->
      <div class="rounded-lg border bg-card p-5">
        <p class="text-sm font-medium mb-3">
          Listing mapping
          <Badge variant="secondary" class="ml-2 tabular-nums">{{ localMappedCount }}/{{ availableListings.length }}</Badge>
        </p>
        <div class="rounded-md border overflow-hidden">
          <ScrollArea class="h-56">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead class="w-24">Region</TableHead>
                  <TableHead>bexio Account</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="mapping in confirmedMappings" :key="mapping.name">
                  <TableCell class="text-sm max-w-xs truncate" :title="mapping.name">
                    {{ mapping.name }}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" class="text-xs font-normal">{{ mapping.region }}</Badge>
                  </TableCell>
                  <TableCell class="text-sm text-muted-foreground">
                    {{ accountLabel(mapping.accountId) }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>

  </div>
</template>
