import { beforeEach, describe, expect, it } from 'vitest'
import type {
  OwnerDashboardField,
  OwnerPermissionConfig,
  OwnerStatementField,
} from '~/components/owners/data/owner-permissions'
import { mockOwnerPermissions } from '~/components/owners/data/owner-permissions'
import {
  normalizePermissionsSeed,
  permissionTemplates,
  useOwnerPermissions,
} from '~/composables/useOwnerPermissions'

// Capture the initial template state once on module import. Some tests
// mutate `permissionTemplates` in place to prove the snapshot invariant
// (applyTemplate must not be live-linked). We restore the templates before
// each test so test ordering cannot break the others.
const initialPermissionTemplates = structuredClone(
  permissionTemplates,
) as typeof permissionTemplates

beforeEach(() => {
  // Restore every field on every template to its initial value.
  for (let i = 0; i < permissionTemplates.length; i++) {
    const target = permissionTemplates[i]
    const source = initialPermissionTemplates[i]
    for (const field of Object.keys(target.dashboard) as OwnerDashboardField[]) {
      target.dashboard[field] = source.dashboard[field]
    }
    for (const field of Object.keys(target.statement) as OwnerStatementField[]) {
      target.statement[field] = source.statement[field]
    }
  }
})

// Snapshot semantics for permission templates — these tests prove that what we
// store on each owner's config is a copy of the template, not a reference to it.
describe('useOwnerPermissions — permission templates', () => {
  describe('built-in templates', () => {
    it('exposes both full_transparency and financial_summary', () => {
      const ids = permissionTemplates.map(t => t.id).sort()
      expect(ids).toEqual(['financial_summary', 'full_transparency'])
    })

    it('full_transparency enables every dashboard field', () => {
      const template = permissionTemplates.find(t => t.id === 'full_transparency')!
      for (const value of Object.values(template.dashboard)) {
        expect(value).toBe(true)
      }
    })

    it('full_transparency enables every statement field', () => {
      const template = permissionTemplates.find(t => t.id === 'full_transparency')!
      for (const value of Object.values(template.statement)) {
        expect(value).toBe(true)
      }
    })

    it('financial_summary enables ONLY net revenue, occupancy, ADR (dashboard) and commission summary, net payout (statement)', () => {
      const template = permissionTemplates.find(t => t.id === 'financial_summary')!

      // ON — the brief says these five fields are visible.
      expect(template.dashboard.netRevenue).toBe(true)
      expect(template.dashboard.occupancy).toBe(true)
      expect(template.dashboard.adr).toBe(true)
      expect(template.statement.commissionDetails).toBe(true)
      expect(template.statement.netPayout).toBe(true)

      // OFF — every other field is hidden.
      const otherDashboard: OwnerDashboardField[] = [
        'grossRevenue',
        'bookingSources',
        'upcomingReservations',
        'guestRatings',
      ]
      for (const field of otherDashboard) {
        expect(template.dashboard[field], `dashboard.${field}`).toBe(false)
      }
      const otherStatement: OwnerStatementField[] = [
        'revenueLines',
        'expenseDetails',
        'taxesAndFees',
        'adjustments',
      ]
      for (const field of otherStatement) {
        expect(template.statement[field], `statement.${field}`).toBe(false)
      }
    })
  })

  describe('init — normalization through canonical templates', () => {
    it('honors the composable\'s strict full_transparency for own-1 immediately on useState creation', () => {
      // No applyTemplate — we read straight from the useState initializer.
      const { findPermission } = useOwnerPermissions()
      const stored = findPermission('own-1')!
      expect(stored.templateId).toBe('full_transparency')
      // Every dashboard field must be true.
      for (const field of Object.keys(stored.dashboard) as OwnerDashboardField[]) {
        expect(stored.dashboard[field], `dashboard.${field}`).toBe(true)
      }
      // Every statement field must be true.
      for (const field of Object.keys(stored.statement) as OwnerStatementField[]) {
        expect(stored.statement[field], `statement.${field}`).toBe(true)
      }
    })

    it('honors the composable\'s strict financial_summary for own-2 and own-3 immediately (NOT the looser data-layer seed)', () => {
      // No applyTemplate — the seeded strict financial_summary must be
      // visible the moment useOwnerPermissions runs.
      const { findPermission } = useOwnerPermissions()
      const onDashboard: OwnerDashboardField[] = ['netRevenue', 'occupancy', 'adr']
      const onStatement: OwnerStatementField[] = ['commissionDetails', 'netPayout']

      for (const ownerId of ['own-2', 'own-3']) {
        const stored = findPermission(ownerId)!
        expect(stored.templateId).toBe('financial_summary')

        // Expected ON — exactly these five fields.
        for (const field of onDashboard) {
          expect(stored.dashboard[field], `${ownerId}.dashboard.${field}`).toBe(true)
        }
        for (const field of onStatement) {
          expect(stored.statement[field], `${ownerId}.statement.${field}`).toBe(true)
        }

        // Expected OFF — every other dashboard / statement field is hidden.
        const offDashboard: OwnerDashboardField[] = [
          'grossRevenue',
          'bookingSources',
          'upcomingReservations',
          'guestRatings',
        ]
        for (const field of offDashboard) {
          expect(
            stored.dashboard[field],
            `${ownerId}.dashboard.${field} must be false (strict financial_summary)`,
          ).toBe(false)
        }
        const offStatement: OwnerStatementField[] = [
          'revenueLines',
          'expenseDetails',
          'taxesAndFees',
          'adjustments',
        ]
        for (const field of offStatement) {
          expect(
            stored.statement[field],
            `${ownerId}.statement.${field} must be false (strict financial_summary)`,
          ).toBe(false)
        }
      }
    })

    it('does NOT inherit the looser financial_summary dashboard from mockOwnerPermissions', () => {
      // The data-layer seed (mockOwnerPermissions) has financial_summary rows
      // with extras like grossRevenue / upcomingReservations set to true. The
      // composable initializer MUST replace those with the strict canonical
      // definition, not just clone them. Pin the two specifically-loosest
      // dashboard fields and assert they are now false.
      const mockOwn2 = mockOwnerPermissions.find(p => p.ownerId === 'own-2')!
      expect(mockOwn2.dashboard.grossRevenue).toBe(true) // data-layer source is loose
      expect(mockOwn2.dashboard.upcomingReservations).toBe(true)

      const { findPermission } = useOwnerPermissions()
      const stored = findPermission('own-2')!
      expect(stored.dashboard.grossRevenue).toBe(false)
      expect(stored.dashboard.upcomingReservations).toBe(false)
    })
  })

  describe('normalizePermissionsSeed (canonical normalizer)', () => {
    it('preserves custom configs through normalization (templateId === "custom" passes through, deep-cloned)', () => {
      const customConfig: OwnerPermissionConfig = {
        ownerId: 'own-custom-test',
        templateId: 'custom',
        dashboard: {
          grossRevenue: false,
          netRevenue: true,
          occupancy: false,
          adr: true,
          bookingSources: false,
          upcomingReservations: true,
          guestRatings: false,
        },
        statement: {
          revenueLines: false,
          expenseDetails: false,
          commissionDetails: true,
          taxesAndFees: false,
          adjustments: true,
          netPayout: true,
        },
        updatedAt: '2026-06-01T00:00:00.000Z',
      }
      const seeds = [customConfig]
      const normalized = normalizePermissionsSeed(seeds)

      expect(normalized[0].templateId).toBe('custom')
      expect(normalized[0].ownerId).toBe('own-custom-test')
      // Same field values — passed through.
      for (const field of Object.keys(customConfig.dashboard) as OwnerDashboardField[]) {
        expect(normalized[0].dashboard[field]).toBe(customConfig.dashboard[field])
      }
      for (const field of Object.keys(customConfig.statement) as OwnerStatementField[]) {
        expect(normalized[0].statement[field]).toBe(customConfig.statement[field])
      }
      // Deep clone — different references at every level.
      expect(Object.is(normalized[0], customConfig)).toBe(false)
      expect(Object.is(normalized[0].dashboard, customConfig.dashboard)).toBe(false)
      expect(Object.is(normalized[0].statement, customConfig.statement)).toBe(false)
    })

    it('replaces built-in template ids with the canonical field maps (loose seed → strict composable)', () => {
      // Construct a deliberately loose financial_summary that differs from
      // the canonical template. The normalizer must NOT preserve that.
      const looseConfig: OwnerPermissionConfig = {
        ownerId: 'own-loose',
        templateId: 'financial_summary',
        dashboard: {
          grossRevenue: true, // loose: this should be ON
          netRevenue: true,
          occupancy: true,
          adr: true,
          bookingSources: false,
          upcomingReservations: true, // loose: this should be ON
          guestRatings: true, // loose: this should be ON
        },
        statement: {
          revenueLines: false,
          expenseDetails: false,
          commissionDetails: true,
          taxesAndFees: true, // loose: this should be ON
          adjustments: false,
          netPayout: true,
        },
        updatedAt: '2026-01-01T00:00:00.000Z',
      }
      const normalized = normalizePermissionsSeed([looseConfig])
      // Looseness must be discarded; canonical strict fields must take over.
      expect(normalized[0].dashboard.grossRevenue).toBe(false)
      expect(normalized[0].dashboard.upcomingReservations).toBe(false)
      expect(normalized[0].dashboard.guestRatings).toBe(false)
      expect(normalized[0].statement.taxesAndFees).toBe(false)
      // The five canonical-ON fields must still be ON.
      expect(normalized[0].dashboard.netRevenue).toBe(true)
      expect(normalized[0].dashboard.occupancy).toBe(true)
      expect(normalized[0].dashboard.adr).toBe(true)
      expect(normalized[0].statement.commissionDetails).toBe(true)
      expect(normalized[0].statement.netPayout).toBe(true)
      // updatedAt preserved as supplied.
      expect(normalized[0].updatedAt).toBe('2026-01-01T00:00:00.000Z')
    })

    it('does not mutate the input seeds array or its items', () => {
      // The normalizer must deep-clone custom configs and replace built-in
      // entries — not edit the seed in place.
      const customConfig: OwnerPermissionConfig = {
        ownerId: 'own-x',
        templateId: 'custom',
        dashboard: {
          grossRevenue: false,
          netRevenue: true,
          occupancy: false,
          adr: true,
          bookingSources: false,
          upcomingReservations: true,
          guestRatings: false,
        },
        statement: {
          revenueLines: false,
          expenseDetails: false,
          commissionDetails: true,
          taxesAndFees: false,
          adjustments: false,
          netPayout: true,
        },
        updatedAt: '2026-06-01T00:00:00.000Z',
      }
      const seeds: OwnerPermissionConfig[] = [customConfig]
      const originalRef = seeds[0]
      const originalDashboardGrossRevenue = seeds[0].dashboard.grossRevenue
      normalizePermissionsSeed(seeds)
      expect(seeds[0]).toBe(originalRef)
      expect(seeds[0].dashboard.grossRevenue).toBe(originalDashboardGrossRevenue)
    })
  })

  describe('applyTemplate — snapshot semantics', () => {
    it('writes a snapshot config for the owner that mirrors the chosen template', () => {
      const { applyTemplate, findPermission } = useOwnerPermissions()
      const stored = applyTemplate('own-1', 'full_transparency')
      expect(stored.ownerId).toBe('own-1')
      expect(stored.templateId).toBe('full_transparency')
      expect(stored.dashboard.netRevenue).toBe(true)
      expect(stored.dashboard.guestRatings).toBe(true)
      expect(stored.statement.netPayout).toBe(true)
      expect(stored.updatedAt).toBeTruthy()

      const fromLookup = findPermission('own-1')!
      expect(fromLookup.dashboard).toEqual(stored.dashboard)
      expect(fromLookup.statement).toEqual(stored.statement)
    })

    it('applies financial_summary with the expected field set on the stored config', () => {
      const { applyTemplate, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'financial_summary')
      const stored = findPermission('own-1')!
      expect(stored.templateId).toBe('financial_summary')
      // ON
      expect(stored.dashboard.netRevenue).toBe(true)
      expect(stored.dashboard.occupancy).toBe(true)
      expect(stored.dashboard.adr).toBe(true)
      expect(stored.statement.commissionDetails).toBe(true)
      expect(stored.statement.netPayout).toBe(true)
      // OFF
      expect(stored.dashboard.grossRevenue).toBe(false)
      expect(stored.dashboard.bookingSources).toBe(false)
      expect(stored.dashboard.upcomingReservations).toBe(false)
      expect(stored.dashboard.guestRatings).toBe(false)
      expect(stored.statement.revenueLines).toBe(false)
      expect(stored.statement.expenseDetails).toBe(false)
      expect(stored.statement.taxesAndFees).toBe(false)
      expect(stored.statement.adjustments).toBe(false)
    })

    it('replaces any existing config for the owner (no duplicate rows)', () => {
      const { applyTemplate, configs } = useOwnerPermissions()
      // own-1 starts on full_transparency in the seed.
      expect(configs.value.filter(c => c.ownerId === 'own-1')).toHaveLength(1)
      applyTemplate('own-1', 'financial_summary')
      expect(configs.value.filter(c => c.ownerId === 'own-1')).toHaveLength(1)
      expect(configs.value.find(c => c.ownerId === 'own-1')!.templateId).toBe(
        'financial_summary',
      )
    })

    it('returns a copied config — mutating the returned object does NOT mutate storage', () => {
      const { applyTemplate, configs } = useOwnerPermissions()
      const returned = applyTemplate('own-1', 'full_transparency')
      const before = configs.value.find(c => c.ownerId === 'own-1')!
      // Mutate the freshly returned snapshot in place.
      ;(returned.dashboard as Record<string, boolean>).grossRevenue = false
      ;(returned.statement as Record<string, boolean>).netPayout = false
      const after = configs.value.find(c => c.ownerId === 'own-1')!
      expect(after.dashboard.grossRevenue).toBe(before.dashboard.grossRevenue)
      expect(after.dashboard.grossRevenue).toBe(true)
      expect(after.statement.netPayout).toBe(true)
    })

    it('mutating permissionTemplates AFTER applyTemplate does NOT retroactively change stored configs', () => {
      const { applyTemplate, findPermission } = useOwnerPermissions()
      // Apply the same template to two owners.
      applyTemplate('own-1', 'full_transparency')
      applyTemplate('own-2', 'full_transparency')
      expect(findPermission('own-1')!.dashboard.grossRevenue).toBe(true)
      expect(findPermission('own-2')!.statement.netPayout).toBe(true)

      // Now mutate the source template in place — this is exactly the kind
      // of edit the brief warns about.
      const ft = permissionTemplates.find(t => t.id === 'full_transparency')!
      ft.dashboard.grossRevenue = false
      ft.dashboard.adr = false
      ft.statement.netPayout = false

      const own1 = findPermission('own-1')!
      const own2 = findPermission('own-2')!
      // Stored configs must NOT have moved.
      expect(own1.dashboard.grossRevenue).toBe(true)
      expect(own1.dashboard.adr).toBe(true)
      expect(own2.statement.netPayout).toBe(true)
    })

    it('does not mutate the seed mock (mockOwnerPermissions is untouched after use + apply)', () => {
      // Run a useOwnerPermissions consumer + apply through every template id.
      useOwnerPermissions()
      const { applyTemplate } = useOwnerPermissions()
      applyTemplate('own-1', 'financial_summary')

      // The seed for own-1 must still be 'full_transparency' — applying a
      // template mutates storage, not the original seed.
      const seeded = mockOwnerPermissions.find(p => p.ownerId === 'own-1')
      expect(seeded?.templateId).toBe('full_transparency')
      expect(seeded?.dashboard.grossRevenue).toBe(true)
    })

    it('throws when an unknown templateId is requested', () => {
      const { applyTemplate } = useOwnerPermissions()
      expect(() => applyTemplate('own-1', 'custom' as never)).toThrow()
    })

    it('seeds configs from mockOwnerPermissions when useState is empty', () => {
      const { configs } = useOwnerPermissions()
      expect(configs.value).toHaveLength(mockOwnerPermissions.length)
      const seededIds = configs.value.map(c => c.ownerId).sort()
      const mockIds = mockOwnerPermissions.map(p => p.ownerId).sort()
      expect(seededIds).toEqual(mockIds)
    })
  })

  describe('structuredClone — snapshot independence for applyTemplate', () => {
    it('stores dashboard/statement records whose references are independent from the source template', () => {
      const { applyTemplate, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const stored = findPermission('own-1')!
      const template = permissionTemplates.find(t => t.id === 'full_transparency')!
      // structuredClone yields a new object — the stored records MUST NOT
      // alias the template records.
      expect(Object.is(stored.dashboard, template.dashboard)).toBe(false)
      expect(Object.is(stored.statement, template.statement)).toBe(false)
      // Equal by value though.
      expect(stored.dashboard).toEqual(template.dashboard)
      expect(stored.statement).toEqual(template.statement)
    })

    it('mutating the stored config\'s nested records does NOT mutate the source template', () => {
      const { applyTemplate, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const stored = findPermission('own-1')!
      const template = permissionTemplates.find(t => t.id === 'full_transparency')!

      const beforeGross = template.dashboard.grossRevenue
      const beforeNetPayout = template.statement.netPayout
      // Mutate the STORED config's nested records directly.
      stored.dashboard.grossRevenue = false
      stored.statement.netPayout = false

      // The source template must NOT have moved.
      expect(template.dashboard.grossRevenue).toBe(beforeGross)
      expect(template.dashboard.grossRevenue).toBe(true)
      expect(template.statement.netPayout).toBe(beforeNetPayout)
      expect(template.statement.netPayout).toBe(true)
    })

    it('mutating the source template\'s records does NOT mutate the stored config', () => {
      // The reverse direction: edit the source template (the same way a
      // future maintainer might), confirm storage stays put.
      const { applyTemplate, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const template = permissionTemplates.find(t => t.id === 'full_transparency')!
      const beforeStored = findPermission('own-1')!

      template.dashboard.adr = false
      template.dashboard.occupancy = false
      template.statement.netPayout = false

      const afterStored = findPermission('own-1')!
      expect(afterStored.dashboard.adr).toBe(true)
      expect(afterStored.dashboard.occupancy).toBe(true)
      expect(afterStored.statement.netPayout).toBe(true)
      // Same reference (Vue reactivity on object identity isn't expected to
      // fire here since the array reference is what changed).
      expect(afterStored).toBe(beforeStored)
    })
  })

  describe('canViewDashboardField / canViewStatementField', () => {
    it('returns true for every dashboard field after applying full_transparency', () => {
      const { applyTemplate, canViewDashboardField } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const fields: OwnerDashboardField[] = [
        'grossRevenue',
        'netRevenue',
        'occupancy',
        'adr',
        'bookingSources',
        'upcomingReservations',
        'guestRatings',
      ]
      for (const field of fields) {
        expect(canViewDashboardField('own-1', field), field).toBe(true)
      }
    })

    it('returns true for every statement field after applying full_transparency', () => {
      const { applyTemplate, canViewStatementField } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const fields: OwnerStatementField[] = [
        'revenueLines',
        'expenseDetails',
        'commissionDetails',
        'taxesAndFees',
        'adjustments',
        'netPayout',
      ]
      for (const field of fields) {
        expect(canViewStatementField('own-1', field), field).toBe(true)
      }
    })

    it('returns the right ON/OFF set after applying financial_summary', () => {
      const { applyTemplate, canViewDashboardField, canViewStatementField } = useOwnerPermissions()
      applyTemplate('own-1', 'financial_summary')

      // ON — these five fields are exactly what financial_summary exposes.
      expect(canViewDashboardField('own-1', 'netRevenue')).toBe(true)
      expect(canViewDashboardField('own-1', 'occupancy')).toBe(true)
      expect(canViewDashboardField('own-1', 'adr')).toBe(true)
      expect(canViewStatementField('own-1', 'commissionDetails')).toBe(true)
      expect(canViewStatementField('own-1', 'netPayout')).toBe(true)

      // OFF — every other field must hide.
      expect(canViewDashboardField('own-1', 'grossRevenue')).toBe(false)
      expect(canViewDashboardField('own-1', 'bookingSources')).toBe(false)
      expect(canViewDashboardField('own-1', 'upcomingReservations')).toBe(false)
      expect(canViewDashboardField('own-1', 'guestRatings')).toBe(false)
      expect(canViewStatementField('own-1', 'revenueLines')).toBe(false)
      expect(canViewStatementField('own-1', 'expenseDetails')).toBe(false)
      expect(canViewStatementField('own-1', 'taxesAndFees')).toBe(false)
      expect(canViewStatementField('own-1', 'adjustments')).toBe(false)
    })

    it('returns false for any field when no config exists for the owner', () => {
      const { canViewDashboardField, canViewStatementField } = useOwnerPermissions()
      expect(canViewDashboardField('own-unknown', 'netRevenue')).toBe(false)
      expect(canViewStatementField('own-unknown', 'netPayout')).toBe(false)
    })
  })

  describe('custom field updates — copy nested records', () => {
    it('flipping a single dashboard field only affects the target owner (snapshot isolation)', () => {
      const { applyTemplate, updateDashboardField, configs } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      applyTemplate('own-2', 'full_transparency')
      const result = updateDashboardField('own-1', 'guestRatings', false)
      expect(result.success).toBe(true)

      const own1 = configs.value.find(c => c.ownerId === 'own-1')!
      const own2 = configs.value.find(c => c.ownerId === 'own-2')!
      expect(own1.dashboard.guestRatings).toBe(false)
      // Other owner must be untouched.
      expect(own2.dashboard.guestRatings).toBe(true)
      // Other fields on own-1 must NOT have flipped — proving we replaced the
      // dashboard reference only for the targeted owner.
      expect(own1.dashboard.netRevenue).toBe(true)
      expect(own2.dashboard.netRevenue).toBe(true)
    })

    it('flipping a single statement field only affects the target owner', () => {
      const { applyTemplate, updateStatementField, configs } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      applyTemplate('own-2', 'full_transparency')
      const result = updateStatementField('own-2', 'taxesAndFees', false)
      expect(result.success).toBe(true)

      const own1 = configs.value.find(c => c.ownerId === 'own-1')!
      const own2 = configs.value.find(c => c.ownerId === 'own-2')!
      expect(own2.statement.taxesAndFees).toBe(false)
      expect(own1.statement.taxesAndFees).toBe(true)
      // Other statement fields on own-2 must NOT have flipped.
      expect(own2.statement.netPayout).toBe(true)
    })

    it('any custom field flip marks the owner as templateId=custom', () => {
      const { applyTemplate, updateDashboardField, updateStatementField, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      expect(findPermission('own-1')!.templateId).toBe('full_transparency')

      updateDashboardField('own-1', 'guestRatings', false)
      expect(findPermission('own-1')!.templateId).toBe('custom')

      applyTemplate('own-2', 'financial_summary')
      updateStatementField('own-2', 'netPayout', true)
      expect(findPermission('own-2')!.templateId).toBe('custom')
    })

    it('copies nested records on updatePermissions — mutating the patch after the call does NOT leak into storage', () => {
      const { applyTemplate, updatePermissions, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')

      const draft = { dashboard: { guestRatings: false } as Partial<Record<OwnerDashboardField, boolean>> }
      updatePermissions('own-1', draft)
      // Mutate the OUTSIDE patch object after the call. Storage must be
      // unaffected because the patch should have been copied into storage.
      ;(draft.dashboard as Record<string, boolean>).guestRatings = true

      const stored = findPermission('own-1')!
      expect(stored.dashboard.guestRatings).toBe(false)
    })

    it('updatePermissions preserves existing fields when the patch only covers a subset', () => {
      const { applyTemplate, updatePermissions, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      updatePermissions('own-1', {
        dashboard: { guestRatings: false },
      })
      const stored = findPermission('own-1')!
      // Patched field flipped.
      expect(stored.dashboard.guestRatings).toBe(false)
      // Unrelated fields preserved.
      expect(stored.dashboard.netRevenue).toBe(true)
      expect(stored.dashboard.adr).toBe(true)
      // Statement section untouched.
      expect(stored.statement.netPayout).toBe(true)
      // Diverged from a built-in template — explicitly marked custom.
      expect(stored.templateId).toBe('custom')
    })

    it('refuses to update an owner with no permission config', () => {
      const { updateDashboardField, updateStatementField, updatePermissions } = useOwnerPermissions()
      expect(updateDashboardField('own-missing', 'netRevenue', true).success).toBe(false)
      expect(updateStatementField('own-missing', 'netPayout', true).success).toBe(false)
      expect(updatePermissions('own-missing', { dashboard: { netRevenue: true } }).success).toBe(false)
    })

    it('updates updatedAt on every custom patch', () => {
      const { applyTemplate, updateDashboardField, findPermission } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const before = findPermission('own-1')!.updatedAt
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      return wait(5).then(() => {
        updateDashboardField('own-1', 'guestRatings', false)
        const after = findPermission('own-1')!.updatedAt
        expect(after).not.toBe(before)
      })
    })
  })

  describe('spread / replacement mutations', () => {
    it('applyTemplate replaces the configs array (no in-place mutation)', () => {
      const { configs, applyTemplate } = useOwnerPermissions()
      const before = configs.value
      applyTemplate('own-1', 'financial_summary')
      // Vue reacts to ref identity changes; a real spread replacement would
      // reassign .value.
      expect(configs.value).not.toBe(before)
    })

    it('updateDashboardField replaces the configs array (no in-place mutation)', () => {
      const { configs, applyTemplate, updateDashboardField } = useOwnerPermissions()
      applyTemplate('own-1', 'full_transparency')
      const before = configs.value
      updateDashboardField('own-1', 'guestRatings', false)
      expect(configs.value).not.toBe(before)
    })
  })
})
