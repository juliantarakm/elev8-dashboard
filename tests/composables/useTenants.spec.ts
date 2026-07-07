import { describe, expect, it } from 'vitest'
import { useTenants } from '~/composables/useTenants'

describe('useTenants', () => {
  it('seeds with mock tenants', () => {
    const { tenants } = useTenants()
    expect(tenants.value.length).toBe(10)
  })

  it('byId returns a single tenant', () => {
    const { byId } = useTenants()
    const t = byId('t-1')
    expect(t?.name).toBe('Bali Villas Co.')
  })

  it('statusCounts groups by status', () => {
    const { statusCounts } = useTenants()
    expect(statusCounts.value.active).toBeGreaterThan(0)
    expect(statusCounts.value.suspended).toBe(1)
    expect(statusCounts.value.churned).toBe(1)
    expect(statusCounts.value.switching).toBe(1)
  })

  it('suspend changes status', () => {
    const { tenants, suspend } = useTenants()
    const before = tenants.value.find(t => t.id === 't-3')!.status
    expect(before).toBe('active')
    suspend('t-3', 'non-payment')
    expect(tenants.value.find(t => t.id === 't-3')!.status).toBe('suspended')
  })
})