<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Icon } from '#components'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '~/components/ui/alert-dialog'
import type { BannerStatus, BannerSeverity } from '~/components/platform-console/data/banners'
import { SEVERITY_LABEL, BANNER_STATUS_LABEL } from '~/components/platform-console/data/banners'
import { usePlatformBanners } from '~/composables/usePlatformBanners'
import { useStaffAuth } from '~/composables/useStaffAuth'

definePageMeta({ layout: 'platform-console' })

const { banners, resolveRecipients, retractBanner, duplicateBanner } = usePlatformBanners()
const { can } = useStaffAuth()
const router = useRouter()

const search = ref('')
const statusFilter = ref<BannerStatus | ''>('')
const severityFilter = ref<BannerSeverity | ''>('')
const selected = ref<typeof banners.value[number] | null>(null)
const sheetOpen = ref(false)
const retractConfirm = ref<{ id: string; title: string; wasLive: boolean } | null>(null)
const retractReason = ref('')

const filtered = computed(() => banners.value.filter((b) => {
  if (statusFilter.value && b.status !== statusFilter.value) return false
  if (severityFilter.value && b.severity !== severityFilter.value) return false
  if (search.value && !b.title.toLowerCase().includes(search.value.toLowerCase())) return false
  return true
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

const liveCount = computed(() => banners.value.filter(b => b.status === 'live').length)
const scheduledCount = computed(() => banners.value.filter(b => b.status === 'scheduled').length)
const sentThisMonth = computed(() => banners.value.filter((b) => {
  if (!['live', 'expired', 'retracted'].includes(b.status)) return false
  const monthAgo = Date.now() - 30 * 86_400_000
  return new Date(b.createdAt).getTime() > monthAgo
}).length)

const severityIcon = (s: BannerSeverity) => s === 'critical' ? 'lucide:octagon-alert' : s === 'warning' ? 'lucide:triangle-alert' : 'lucide:info'
const severityTone = (s: BannerSeverity) => s === 'critical' ? 'text-destructive' : s === 'warning' ? 'text-amber-600' : 'text-primary'

function statusVariant(s: BannerStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'live') return 'default'
  if (s === 'scheduled') return 'secondary'
  return 'outline'
}

function targetingSummary(b: typeof banners.value[number]): string {
  if (b.targetFilter.scope === 'all') return 'All tenants'
  if (b.targetFilter.scope === 'individual') return `${b.targetFilter.tenantIds.length} specific tenant${b.targetFilter.tenantIds.length === 1 ? '' : 's'}`
  const f = b.targetFilter
  const parts: string[] = []
  if (f.tiers?.length) parts.push(f.tiers.join(', '))
  if (f.regions?.length) parts.push(f.regions.join(', '))
  return `Segment: ${parts.join(' · ') || 'any'}`
}

function view(b: typeof banners.value[number]) {
  selected.value = b
  sheetOpen.value = true
}
function retract(b: typeof banners.value[number]) {
  retractConfirm.value = { id: b.id, title: b.title, wasLive: b.status === 'live' }
  retractReason.value = ''
}
function doRetract() {
  if (!retractConfirm.value) return
  try {
    retractBanner(retractConfirm.value.id, 'staff-1', retractReason.value || 'No reason provided')
    toast.success('Banner retracted.')
  } catch (e: any) {
    toast.error(e.message ?? 'Failed')
  } finally {
    retractConfirm.value = null
  }
}
function dup(b: typeof banners.value[number]) {
  duplicateBanner(b.id)
  toast.success('Banner duplicated.')
}
</script>

<template>
  <div class="space-y-4 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Broadcasts</h2>
        <p class="text-sm text-muted-foreground">In-app banners delivered to tenant dashboards</p>
      </div>
      <PlatformConsoleRoleGate action="compose_banner">
        <Button @click="router.push('/platform-console/broadcasts/new')">
          <Icon name="lucide:plus" class="mr-1.5 size-4" />
          New banner
        </Button>
      </PlatformConsoleRoleGate>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Live now</div><div class="text-2xl font-semibold">{{ liveCount }}</div></CardContent></Card>
      <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Scheduled</div><div class="text-2xl font-semibold">{{ scheduledCount }}</div></CardContent></Card>
      <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Sent (last 30d)</div><div class="text-2xl font-semibold">{{ sentThisMonth }}</div></CardContent></Card>
    </div>

    <div class="flex items-center gap-2">
      <Input v-model="search" placeholder="Search by title…" class="w-64" />
      <select v-model="statusFilter" class="rounded-md border bg-background px-3 py-1.5 text-sm">
        <option value="">All statuses</option>
        <option v-for="s in (['scheduled','live','expired','retracted'] as BannerStatus[])" :key="s" :value="s">{{ BANNER_STATUS_LABEL[s] }}</option>
      </select>
      <select v-model="severityFilter" class="rounded-md border bg-background px-3 py-1.5 text-sm">
        <option value="">All severities</option>
        <option v-for="s in (['info','warning','critical'] as BannerSeverity[])" :key="s" :value="s">{{ SEVERITY_LABEL[s] }}</option>
      </select>
    </div>

    <Card v-if="!filtered.length">
      <CardContent class="p-12 text-center">
        <Icon name="lucide:megaphone" class="size-8 mx-auto text-muted-foreground" />
        <p class="mt-3 text-sm text-muted-foreground">No banners yet.</p>
        <Button class="mt-4" @click="router.push('/platform-console/broadcasts/new')">Create your first banner</Button>
      </CardContent>
    </Card>
    <Card v-else>
      <CardContent class="p-0">
        <div class="divide-y">
          <div v-for="b in filtered" :key="b.id" class="flex items-center gap-4 p-4 hover:bg-muted/50">
            <Icon :name="severityIcon(b.severity)" class="size-4 flex-shrink-0" :class="severityTone(b.severity)" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{{ b.title }}</div>
              <div class="text-xs text-muted-foreground">
                {{ targetingSummary(b) }} · {{ resolveRecipients(b).length }} recipients ·
                {{ b.startAt.slice(0, 10) }}<template v-if="b.endAt"> → {{ b.endAt.slice(0, 10) }}</template>
              </div>
            </div>
            <Badge :variant="statusVariant(b.status)" :class="b.status === 'live' && 'animate-pulse'">
              {{ BANNER_STATUS_LABEL[b.status] }}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="ghost" size="icon"><Icon name="lucide:more-horizontal" class="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem @click="view(b)">
                  <Icon name="lucide:eye" class="mr-2 size-4" />View
                </DropdownMenuItem>
                <DropdownMenuItem @click="dup(b)">
                  <Icon name="lucide:copy" class="mr-2 size-4" />Duplicate
                </DropdownMenuItem>
                <PlatformConsoleRoleGate action="retract_banner">
                  <DropdownMenuItem v-if="['live','scheduled'].includes(b.status)" @click="retract(b)" class="text-destructive">
                    <Icon name="lucide:ban" class="mr-2 size-4" />Retract
                  </DropdownMenuItem>
                </PlatformConsoleRoleGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>

    <Sheet v-model:open="sheetOpen">
      <SheetContent v-if="selected" class="w-[520px]">
        <SheetHeader>
          <SheetTitle>Banner detail</SheetTitle>
        </SheetHeader>
        <div class="space-y-3 p-4 text-sm">
          <PlatformConsoleBannerCard :banner="selected" />
          <div class="flex justify-between"><span class="text-muted-foreground">Status</span><Badge>{{ BANNER_STATUS_LABEL[selected.status] }}</Badge></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Severity</span><span class="font-medium">{{ SEVERITY_LABEL[selected.severity] }}</span></div>
          <div class="flex justify-between"><span class="text-muted-foreground">Recipients</span>{{ resolveRecipients(selected).length }} tenants</div>
          <div class="flex justify-between"><span class="text-muted-foreground">Visible roles</span>{{ selected.visibleRoles.join(', ') }}</div>
          <div class="flex justify-between"><span class="text-muted-foreground">Created</span>{{ selected.createdAt.slice(0, 10) }}</div>
        </div>
      </SheetContent>
    </Sheet>

    <AlertDialog :open="!!retractConfirm" @update:open="(v: boolean) => v ? null : retractConfirm = null">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retract "{{ retractConfirm?.title }}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {{ retractConfirm?.wasLive
              ? 'Live banner will be removed from all tenant dashboards immediately.'
              : 'This banner has not gone live yet — no tenant will see it after retraction.' }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="px-6 pb-2">
          <Label class="text-xs">Reason (optional)</Label>
          <Input v-model="retractReason" placeholder="Why are you retracting this?" class="mt-1" />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction @click="doRetract">Retract</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>