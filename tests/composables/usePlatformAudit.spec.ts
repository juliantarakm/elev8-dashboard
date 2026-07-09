import { describe, expect, it } from 'vitest'
import { usePlatformAudit } from '~/composables/usePlatformAudit'

describe('usePlatformAudit', () => {
  it('appends an entry and assigns id + timestamp', () => {
    const { log, auditLog } = usePlatformAudit()
    const initial = auditLog.value.length
    const entry = log('view_billing', 'tenant', 't-1', { foo: 'bar' })
    expect(auditLog.value.length).toBe(initial + 1)
    expect(entry.id).toMatch(/^audit-/)
    expect(entry.action).toBe('view_billing')
    expect(entry.actorStaffId).toBeTruthy()
    expect(entry.metadata).toEqual({ foo: 'bar' })
  })

  it('byTenant filters to tenant id', () => {
    const { log, byTenant } = usePlatformAudit()
    log('view_billing', 'tenant', 't-A')
    log('view_billing', 'tenant', 't-B')
    const result = byTenant('t-A')
    expect(result.every(e => e.targetId === 't-A')).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })
})