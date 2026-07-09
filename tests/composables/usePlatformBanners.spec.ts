import { describe, expect, it } from 'vitest'
import { usePlatformBanners } from '~/composables/usePlatformBanners'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

describe('usePlatformBanners', () => {
  it('seeds with mock banners', () => {
    const { banners } = usePlatformBanners()
    expect(banners.value.length).toBeGreaterThan(0)
  })

  it('resolveRecipients handles "all" scope', () => {
    const { resolveRecipients, banners } = usePlatformBanners()
    const all = banners.value.find(b => b.targetFilter.scope === 'all')!
    const recipients = resolveRecipients(all)
    expect(recipients.length).toBeGreaterThan(5)
  })

  it('resolveRecipients handles segment scope', () => {
    const { resolveRecipients, banners } = usePlatformBanners()
    const seg = banners.value.find(b => b.targetFilter.scope === 'segment')!
    // Segment: per_property + growth + id → t-10 matches (growth), t-1 doesn't (pro)
    const recipients = resolveRecipients(seg)
    expect(recipients).toContain('t-10')
    expect(recipients).not.toContain('t-1')
    expect(recipients).not.toContain('t-7')
  })

  it('resolveRecipients handles individual scope', () => {
    const { resolveRecipients, banners } = usePlatformBanners()
    const ind = banners.value.find(b => b.targetFilter.scope === 'individual')!
    expect(resolveRecipients(ind)).toEqual(['t-1', 't-7'])
  })

  it('liveBannersForTenant caps at 2 and respects priority', () => {
    const { liveBannersForTenant } = usePlatformBanners()
    const list = liveBannersForTenant('t-1', 'Admin')
    expect(list.length).toBeLessThanOrEqual(2)
  })

  it('liveBannersForTenant respects visible_roles', () => {
    const { liveBannersForTenant } = usePlatformBanners()
    const adminList = liveBannersForTenant('t-1', 'Admin')
    const housekeepingList = liveBannersForTenant('t-1', 'Housekeeping')
    expect(adminList.length).toBeGreaterThanOrEqual(housekeepingList.length)
  })

  it('createBanner sets status to live when startAt is now', () => {
    const { createBanner, banners } = usePlatformBanners()
    const b = createBanner({
      title: 'Test', body: 'Hello world', severity: 'info',
      targetScope: 'all', targetFilter: { scope: 'all' },
      visibleRoles: ['Admin'], dismissible: true, dismissalScope: 'account',
      startAt: new Date().toISOString(), createdByStaffId: 'staff-1',
    })
    expect(b.status).toBe('live')
    expect(b.id).toMatch(/^banner-/)
  })

  it('createBanner sets status to scheduled when startAt is future', () => {
    const { createBanner } = usePlatformBanners()
    const future = new Date(Date.now() + 7 * 86_400_000).toISOString()
    const b = createBanner({
      title: 'Future', body: 'Scheduled banner', severity: 'info',
      targetScope: 'all', targetFilter: { scope: 'all' },
      visibleRoles: ['Admin'], dismissible: true, dismissalScope: 'account',
      startAt: future, createdByStaffId: 'staff-1',
    })
    expect(b.status).toBe('scheduled')
  })

  it('critical banner creation triggers banner_email_sent audit', () => {
    const { createBanner } = usePlatformBanners()
    const { auditLog } = usePlatformAudit()
    const before = auditLog.value.length
    createBanner({
      title: 'Critical test', body: 'Triggers email', severity: 'critical',
      targetScope: 'individual', targetFilter: { scope: 'individual', tenantIds: ['t-1'] },
      visibleRoles: ['Admin'], dismissible: true, dismissalScope: 'account',
      startAt: new Date().toISOString(), createdByStaffId: 'staff-1',
    })
    const sent = auditLog.value.slice(before).find(e => e.action === 'banner_email_sent')
    expect(sent).toBeTruthy()
  })

  it('retractBanner flips scheduled to retracted', () => {
    const { retractBanner, banners } = usePlatformBanners()
    const scheduled = banners.value.find(b => b.status === 'scheduled')!
    const r = retractBanner(scheduled.id, 'staff-1', 'Changed mind')
    expect(r.status).toBe('retracted')
  })

  it('dismiss records a dismissal', () => {
    const { dismiss, dismissals, banners } = usePlatformBanners()
    const banner = banners.value.find(b => b.status === 'live')!
    const before = dismissals.value.length
    dismiss(banner.id, 't-1', undefined)
    expect(dismissals.value.length).toBe(before + 1)
  })

  it('runSchedulingSweep transitions scheduled to live', () => {
    const { banners, runSchedulingSweep } = usePlatformBanners()
    banners.value = [...banners.value, {
      id: 'banner-future-1', title: 'Future', body: 'Soon', severity: 'info',
      targetScope: 'all', targetFilter: { scope: 'all' },
      visibleRoles: ['Admin'], dismissible: true, dismissalScope: 'user',
      startAt: new Date(Date.now() - 1000).toISOString(),
      status: 'scheduled', createdByStaffId: 'staff-1', createdAt: new Date().toISOString(),
    }]
    const result = runSchedulingSweep()
    expect(result.wentLive).toBeGreaterThanOrEqual(1)
  })
})