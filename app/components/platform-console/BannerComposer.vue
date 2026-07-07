<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Icon } from '#components'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Switch } from '~/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import type { BannerSeverity, BannerTargetFilter } from './data/banners'
import type { StaffRoleName } from './data/staff'
import { usePlatformBanners } from '~/composables/usePlatformBanners'
import { useStaffAuth } from '~/composables/useStaffAuth'
import { useTenants } from '~/composables/useTenants'

const emit = defineEmits<{ published: [] }>()

const step = ref(1)

const title = ref('')
const body = ref('')
const severity = ref<BannerSeverity>('info')
const ctaLabel = ref('')
const ctaUrl = ref('')
const dismissible = ref(true)
const targetFilter = ref<BannerTargetFilter>({ scope: 'all' })
const visibleRoles = ref<StaffRoleName[]>(['Admin', 'General Manager', 'Finance/HR'])
const publishNow = ref(true)
const autoExpire = ref(true)
const expireAt = ref('')
const previewTenantId = ref<string | null>(null)

const { can } = useStaffAuth()
const { createBanner, resolveRecipients } = usePlatformBanners()
const { byId: tenantById } = useTenants()

if (!can('compose_banner')) {
  throw createError({ statusCode: 403, statusMessage: 'Admin role required to compose banners' })
}

const titleOk = computed(() => title.value.length > 0 && title.value.length <= 60)
const bodyOk = computed(() => body.value.length > 0 && body.value.length <= 200)
const step1Valid = computed(() => titleOk.value && bodyOk.value)

const matchedIds = computed(() => {
  const mock = { id: 'preview', targetFilter: targetFilter.value } as any
  return resolveRecipients(mock)
})
const step2Valid = computed(() => matchedIds.value.length > 0)

const matchedTenants = computed(() => matchedIds.value
  .map(id => tenantById(id))
  .filter(Boolean) as any[])

watch(matchedTenants, (list) => {
  if (!previewTenantId.value && list.length) previewTenantId.value = list[0].id
})

const previewTenant = computed(() => previewTenantId.value ? tenantById(previewTenantId.value) : null)
const previewBanner = computed(() => ({
  id: 'preview',
  title: title.value,
  body: body.value,
  severity: severity.value,
  ctaLabel: ctaLabel.value || undefined,
  ctaUrl: ctaUrl.value || undefined,
  dismissible: dismissible.value,
  visibleRoles: visibleRoles.value,
} as any))

function publish() {
  const startAt = new Date().toISOString()
  const endAt = autoExpire.value && expireAt.value
    ? new Date(expireAt.value).toISOString()
    : undefined
  createBanner({
    title: title.value,
    body: body.value,
    severity: severity.value,
    ctaLabel: ctaLabel.value || undefined,
    ctaUrl: ctaUrl.value || undefined,
    targetScope: targetFilter.value.scope,
    targetFilter: targetFilter.value,
    visibleRoles: visibleRoles.value,
    dismissible: dismissible.value,
    dismissalScope: 'account',
    startAt,
    endAt,
    createdByStaffId: 'staff-1',
  })
  toast.success('Banner published')
  emit('published')
}

function next() {
  if (step.value === 1 && !step1Valid.value) return
  if (step.value === 2 && !step2Valid.value) return
  step.value++
}
function back() {
  if (step.value > 1) step.value--
}
</script>

<template>
  <div class="space-y-6 p-6 max-w-3xl mx-auto">
    <div class="flex items-center justify-center gap-2 text-sm">
      <span :class="step >= 1 ? 'font-semibold' : 'text-muted-foreground'">1. Compose</span>
      <span class="text-muted-foreground">→</span>
      <span :class="step >= 2 ? 'font-semibold' : 'text-muted-foreground'">2. Target</span>
      <span class="text-muted-foreground">→</span>
      <span :class="step >= 3 ? 'font-semibold' : 'text-muted-foreground'">3. Schedule</span>
      <span class="text-muted-foreground">→</span>
      <span :class="step >= 4 ? 'font-semibold' : 'text-muted-foreground'">4. Preview</span>
    </div>

    <div v-if="step === 1" class="space-y-4">
      <h3 class="text-lg font-semibold">Compose the message</h3>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label>Title</Label>
          <span class="text-xs" :class="titleOk ? 'text-muted-foreground' : 'text-destructive'">{{ title.length }} / 60</span>
        </div>
        <Input v-model="title" :maxlength="60" placeholder="Maintenance window — June 12, 02:00 UTC" />
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <Label>Body</Label>
          <span class="text-xs" :class="bodyOk ? 'text-muted-foreground' : 'text-destructive'">{{ body.length }} / 200</span>
        </div>
        <Textarea v-model="body" :maxlength="200" :rows="3" placeholder="Inbox and Reviews will be offline for ~30 min." />
      </div>
      <div class="space-y-2">
        <Label>Severity</Label>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="s in (['info','warning','critical'] as BannerSeverity[])" :key="s"
            type="button"
            class="rounded-md border p-3 text-left"
            :class="severity === s ? 'border-primary ring-2 ring-primary/20' : 'hover:bg-muted'"
            @click="severity = s">
            <div class="flex items-center gap-2">
              <Icon :name="s === 'critical' ? 'lucide:octagon-alert' : s === 'warning' ? 'lucide:triangle-alert' : 'lucide:info'"
                class="size-4"
                :class="s === 'critical' ? 'text-destructive' : s === 'warning' ? 'text-amber-600' : 'text-primary'" />
              <span class="text-sm font-medium capitalize">{{ s }}</span>
            </div>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ s === 'critical' ? 'Triggers duplicate email to matching users' : 'In-app only, no email' }}
            </p>
          </button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-2">
          <Label>CTA label (optional)</Label>
          <Input v-model="ctaLabel" placeholder="View status" />
        </div>
        <div class="space-y-2">
          <Label>CTA URL (optional)</Label>
          <Input v-model="ctaUrl" placeholder="https://status.elev8.io" />
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Switch :model-value="dismissible" @update:model-value="(v) => dismissible = v" />
        <Label>Dismissible</Label>
      </div>
    </div>

    <div v-if="step === 2" class="space-y-4">
      <h3 class="text-lg font-semibold">Who will see this banner</h3>
      <BannerTargetingControl v-model="targetFilter" v-model:visible-roles="visibleRoles" />
    </div>

    <div v-if="step === 3" class="space-y-4">
      <h3 class="text-lg font-semibold">When to publish</h3>
      <p class="text-sm text-muted-foreground">This prototype publishes immediately. Auto-expire is optional.</p>
      <div class="flex items-center gap-3">
        <Switch :model-value="autoExpire" @update:model-value="(v) => autoExpire = v" />
        <Label>Auto-expire</Label>
      </div>
      <div v-if="autoExpire" class="space-y-2">
        <Label>Expire at</Label>
        <Input v-model="expireAt" type="datetime-local" />
      </div>
    </div>

    <div v-if="step === 4" class="space-y-4">
      <h3 class="text-lg font-semibold">Preview</h3>
      <div v-if="matchedTenants.length > 1" class="flex items-center gap-2">
        <Label class="text-sm">Preview as:</Label>
        <select v-model="previewTenantId" class="rounded-md border bg-background px-2 py-1 text-sm">
          <option v-for="t in matchedTenants" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <BannerCard v-if="previewTenant" :banner="previewBanner" />
      <div class="rounded-md border bg-muted/30 p-3 text-sm">
        <p><strong>Visible to roles:</strong> {{ visibleRoles.join(', ') || '— none —' }}</p>
        <p><strong>Delivered to:</strong> {{ previewTenant?.name }}{{ matchedTenants.length > 1 ? ` + ${matchedTenants.length - 1} other${matchedTenants.length - 1 === 1 ? '' : 's'}` : '' }}</p>
      </div>
      <div v-if="severity === 'critical'" class="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        📧 An email will be sent to {{ matchedTenants.length * visibleRoles.length }} matching {{ matchedTenants.length * visibleRoles.length === 1 ? 'user' : 'users' }}.
      </div>
    </div>

    <div class="flex items-center justify-between border-t pt-4">
      <Button variant="outline" :disabled="step === 1" @click="back">← Back</Button>
      <Button v-if="step < 4" :disabled="(step === 1 && !step1Valid) || (step === 2 && !step2Valid)" @click="next">
        Next →
      </Button>
      <Button v-else @click="publish">
        Publish now
      </Button>
    </div>
  </div>
</template>