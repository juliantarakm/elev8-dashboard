import { computed } from 'vue'
import type {
  PlatformBanner, BannerSeverity, BannerStatus, BannerTargetFilter, BannerDismissal, DismissalScope,
} from '~/components/platform-console/data/banners'
import { mockBanners } from '~/components/platform-console/data/banners'
import type { StaffRoleName } from '~/components/platform-console/data/staff'
import { useTenants } from '~/composables/useTenants'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

export interface CreateBannerInput {
  title: string
  body: string
  severity: BannerSeverity
  ctaLabel?: string
  ctaUrl?: string
  targetScope: 'all' | 'segment' | 'individual'
  targetFilter: BannerTargetFilter
  visibleRoles: StaffRoleName[]
  dismissible: boolean
  dismissalScope: DismissalScope
  startAt: string
  endAt?: string
  createdByStaffId: string
}

const SEVERITY_RANK: Record<BannerSeverity, number> = { critical: 1, warning: 2, info: 3 }

function genId() {
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function usePlatformBanners() {
  const banners = useState<PlatformBanner[]>('platform-banners', () => JSON.parse(JSON.stringify(mockBanners)))
  const dismissals = useState<BannerDismissal[]>('banner-dismissals', () => [])
  const { tenants } = useTenants()
  const { log } = usePlatformAudit()

  function resolveRecipients(banner: PlatformBanner): string[] {
    const eligible = tenants.value.filter(t => !t.isInternal)
    if (banner.targetFilter.scope === 'all') {
      return eligible.map(t => t.id)
    }
    if (banner.targetFilter.scope === 'segment') {
      const f = banner.targetFilter
      return eligible.filter(t => {
        if (f.planTypes && !f.planTypes.includes(t.plan)) return false
        if (f.tiers && !f.tiers.includes(t.packageTier)) return false
        if (f.regions && !f.regions.includes(t.region)) return false
        if (f.hasChannelManager !== undefined && t.hasChannelManager !== f.hasChannelManager) return false
        return true
      }).map(t => t.id)
    }
    const allowed = new Set(eligible.map(t => t.id))
    return banner.targetFilter.tenantIds.filter(id => allowed.has(id))
  }

  function isDismissed(bannerId: string, tenantId: string): boolean {
    return dismissals.value.some(d => d.bannerId === bannerId && d.tenantId === tenantId)
  }

  function liveBannersForTenant(tenantId: string, userRole: StaffRoleName): PlatformBanner[] {
    const now = Date.now()
    return banners.value
      .filter((b) => {
        if (b.status !== 'live') return false
        if (new Date(b.startAt).getTime() > now) return false
        if (b.endAt && new Date(b.endAt).getTime() < now) return false
        if (!resolveRecipients(b).includes(tenantId)) return false
        if (!b.visibleRoles.includes(userRole)) return false
        if (isDismissed(b.id, tenantId)) return false
        return true
      })
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.startAt.localeCompare(a.startAt))
      .slice(0, 2)
  }

  function fireEmailTrigger(banner: PlatformBanner): void {
    const recipients = resolveRecipients(banner)
    for (const tenantId of recipients) {
      log('banner_email_sent', 'banner', banner.id, {
        tenantId,
        title: banner.title,
        recipientCount: banner.visibleRoles.length,
      })
    }
  }

  function createBanner(input: CreateBannerInput): PlatformBanner {
    const isLive = new Date(input.startAt).getTime() <= Date.now()
    const banner: PlatformBanner = {
      id: genId(),
      ...input,
      status: isLive ? 'live' : 'scheduled',
      createdAt: new Date().toISOString(),
    }
    banners.value = [...banners.value, banner]
    log(isLive ? 'banner_live' : 'banner_scheduled', 'banner', banner.id, {
      severity: banner.severity,
      recipientCount: resolveRecipients(banner).length,
    })
    if (banner.severity === 'critical' && isLive) {
      fireEmailTrigger(banner)
    }
    return banner
  }

  function updateBanner(id: string, patch: Partial<PlatformBanner>): PlatformBanner {
    const existing = banners.value.find(b => b.id === id)
    if (!existing) throw new Error('Banner not found')
    const updated = { ...existing, ...patch }
    banners.value = banners.value.map(b => b.id === id ? updated : b)
    return updated
  }

  function retractBanner(id: string, staffId: string, reason: string): PlatformBanner {
    const existing = banners.value.find(b => b.id === id)
    if (!existing) throw new Error('Banner not found')
    const updated: PlatformBanner = {
      ...existing,
      status: 'retracted',
      retractedAt: new Date().toISOString(),
      retractedByStaffId: staffId,
      retractionReason: reason,
    }
    banners.value = banners.value.map(b => b.id === id ? updated : b)
    log(
      existing.status === 'scheduled' ? 'banner_retracted_before_live' : 'banner_retracted',
      'banner', id, { reason, wasLive: existing.status === 'live' },
    )
    return updated
  }

  function duplicateBanner(id: string): PlatformBanner {
    const existing = banners.value.find(b => b.id === id)
    if (!existing) throw new Error('Banner not found')
    return createBanner({
      title: `${existing.title} (copy)`,
      body: existing.body,
      severity: existing.severity,
      ctaLabel: existing.ctaLabel,
      ctaUrl: existing.ctaUrl,
      targetScope: existing.targetScope,
      targetFilter: existing.targetFilter,
      visibleRoles: existing.visibleRoles,
      dismissible: existing.dismissible,
      dismissalScope: existing.dismissalScope,
      startAt: new Date().toISOString(),
      createdByStaffId: 'staff-1',
    })
  }

  function dismiss(bannerId: string, tenantId: string, _userId?: string): void {
    dismissals.value = [...dismissals.value, {
      bannerId, tenantId,
      dismissedAt: new Date().toISOString(),
    }]
  }

  function runSchedulingSweep(): { wentLive: number; expired: number } {
    const now = Date.now()
    let wentLive = 0
    let expired = 0
    banners.value = banners.value.map((b) => {
      if (b.status === 'scheduled' && new Date(b.startAt).getTime() <= now) {
        wentLive++
        log('banner_live', 'banner', b.id, { severity: b.severity, recipientCount: resolveRecipients(b).length })
        if (b.severity === 'critical') fireEmailTrigger(b)
        return { ...b, status: 'live' as BannerStatus }
      }
      if (b.status === 'live' && b.endAt && new Date(b.endAt).getTime() < now) {
        expired++
        log('banner_expired', 'banner', b.id, {})
        return { ...b, status: 'expired' as BannerStatus }
      }
      return b
    })
    return { wentLive, expired }
  }

  return {
    banners, dismissals,
    resolveRecipients, liveBannersForTenant,
    createBanner, updateBanner, retractBanner, duplicateBanner,
    dismiss, runSchedulingSweep,
  }
}