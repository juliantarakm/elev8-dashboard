import { describe, expect, it } from 'vitest'
import { alertDisplayLabels, alertIcons, alertRouteMap, getDescription } from '~/components/notifications/data/alerts'

describe('key not returned alert', () => {
  it('has display metadata', () => {
    expect(alertDisplayLabels.KEY_NOT_RETURNED).toBe('Key - Not Returned')
    expect(alertIcons.KEY_NOT_RETURNED).toBe('i-lucide-key-round')
    expect(alertRouteMap.KEY_NOT_RETURNED).toBe('/key-management')
  })

  it('builds a description from context', () => {
    const description = getDescription('KEY_NOT_RETURNED', {
      key_label: 'Main Door #1',
      listing_name: 'Villa Luwa',
      staff_name: 'Made Surya',
      overdue_hours: 6,
    })
    expect(description).toContain('Main Door #1')
    expect(description).toContain('Villa Luwa')
    expect(description).toContain('Made Surya')
    expect(description).toContain('6h')
  })
})
