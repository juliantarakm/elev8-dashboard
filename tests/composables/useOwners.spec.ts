import { describe, expect, it } from 'vitest'
import { useOwners } from '~/composables/useOwners'
import { mockOwners, mockOwnerPropertyMappings } from '~/components/owners/data/owners'
import { mockCommissionRules } from '~/components/owners/data/commission-rules'
import { buildOwnerPermissionTemplate } from '~/components/owners/data/owner-permissions'

describe('useOwners', () => {
  describe('seed data', () => {
    it('seeds with the three fixture owners', () => {
      const { owners } = useOwners()
      const seededIds = owners.value.map(o => o.id).sort()
      expect(seededIds).toEqual(mockOwners.map(o => o.id).sort())
      expect(owners.value).toHaveLength(mockOwners.length)
    })

    it('seeds with the four fixture mappings', () => {
      const { mappings } = useOwners()
      const seededIds = mappings.value.map(m => m.id).sort()
      expect(seededIds).toEqual(mockOwnerPropertyMappings.map(m => m.id).sort())
    })

    it('seeds with the four fixture commission rules', () => {
      const { commissionRules } = useOwners()
      const seededIds = commissionRules.value.map(r => r.id).sort()
      expect(seededIds).toEqual(mockCommissionRules.map(r => r.id).sort())
    })

    it('does not mutate the imported seed fixtures', () => {
      useOwners()
      expect(mockOwners).toHaveLength(3)
      expect(mockOwnerPropertyMappings).toHaveLength(4)
    })
  })

  describe('createOwner — duplicate email guard', () => {
    it('rejects a new owner whose email matches an existing seed (case-insensitive)', () => {
      const { createOwner } = useOwners()
      // Seed has 'wayan.sari@example.com' — uppercase must collide.
      const result = createOwner({
        owner: {
          name: 'Wayan Sari Clone',
          email: 'WAYAN.SARI@Example.com',
          phone: '+6281234567999',
          language: 'id',
          statementCurrency: 'IDR',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('financial_summary', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/email/i)
    })

    it('rejects an email that collides only after lowercasing', () => {
      const { createOwner } = useOwners()
      const result = createOwner({
        owner: {
          name: 'Another Clone',
          email: 'Kadek.Deviani@Example.com',
          phone: '+6281234567998',
          language: 'id',
          statementCurrency: 'IDR',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('financial_summary', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      expect(result.success).toBe(false)
    })

    it('creates an owner with brand-new email and assigns the generated id', () => {
      const { createOwner, owners } = useOwners()
      const result = createOwner({
        owner: {
          name: 'Made Wirawan',
          email: 'made.wirawan@example.com',
          phone: '+6281234567100',
          language: 'en',
          statementCurrency: 'USD',
          annualOwnerUseNightCap: 7,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('full_transparency', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      expect(result.success).toBe(true)
      expect(result.ownerId).toBeTruthy()
      const created = owners.value.find(o => o.id === result.ownerId)!
      expect(created.name).toBe('Made Wirawan')
      expect(created.email).toBe('made.wirawan@example.com')
      expect(created.status).toBe('draft')
      expect(created.createdAt).toBeTruthy()
      expect(created.updatedAt).toBeTruthy()
    })

    it('uses replacement mutation (a new owners array) rather than mutating in place', () => {
      const { createOwner, owners } = useOwners()
      const originalArray = owners.value
      const result = createOwner({
        owner: {
          name: 'Ni Luh',
          email: 'ni.luh@example.com',
          phone: '+6281234567200',
          language: 'id',
          statementCurrency: 'IDR',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('financial_summary', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      expect(result.success).toBe(true)
      // Vue reacts to ref identity changes; a true spread replacement would
      // reassign .value. Mutating in place would leave the reference intact.
      expect(owners.value).not.toBe(originalArray)
      expect(owners.value.length).toBe(4)
    })

    it('persists the mappings, commission rules, and permissions that come along with the owner', () => {
      const { createOwner, mappings, commissionRules } = useOwners()
      const result = createOwner({
        owner: {
          name: 'Bagus Putra',
          email: 'bagus.putra@example.com',
          phone: '+6281234567300',
          language: 'en',
          statementCurrency: 'SGD',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [
          {
            listingId: 'lst-5',
            ownershipPercentage: 60,
            commissionRuleId: 'cr-new',
            effectiveFrom: '2026-08-01',
          },
        ],
        commissionRules: [
          {
            type: 'flat',
            rate: 18,
            listingId: 'lst-5',
            name: 'Standard 18% management',
            effectiveFrom: '2026-08-01',
          },
        ],
        permissions: buildOwnerPermissionTemplate('full_transparency', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      expect(result.success).toBe(true)
      const ownerMappings = mappings.value.filter(m => m.ownerId === result.ownerId)
      expect(ownerMappings).toHaveLength(1)
      expect(ownerMappings[0].listingId).toBe('lst-5')
      expect(ownerMappings[0].ownershipPercentage).toBe(60)
      const ownerRules = commissionRules.value.filter(r => r.ownerId === result.ownerId)
      expect(ownerRules).toHaveLength(1)
      expect(ownerRules[0].type).toBe('flat')
    })
  })

  describe('addMapping — ownership guard', () => {
    it('rejects a mapping whose ownership would exceed 100%', () => {
      const { addMapping } = useOwners()
      // lst-3 already has 50% (own-2) + 50% (own-3) = 100%.
      const result = addMapping({
        ownerId: 'own-1',
        listingId: 'lst-3',
        ownershipPercentage: 1,
        commissionRuleId: 'cr-1',
        effectiveFrom: '2026-08-01',
      })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/ownership/i)
    })

    it('rejects a 30% mapping when remaining allocation is 0%', () => {
      const { addMapping } = useOwners()
      // lst-1 already has 100% (own-1). Same listingId with a different ownerId is rejected.
      const result = addMapping({
        ownerId: 'own-2',
        listingId: 'lst-1',
        ownershipPercentage: 30,
        commissionRuleId: 'cr-2',
        effectiveFrom: '2026-08-01',
      })
      expect(result.success).toBe(false)
    })

    it('accepts a mapping that fills the remaining allocation to exactly 100%', () => {
      const { addMapping, mappings } = useOwners()
      // lst-7 starts free. Two owners take it to exactly 100%.
      const first = addMapping({
        ownerId: 'own-2',
        listingId: 'lst-7',
        ownershipPercentage: 60,
        commissionRuleId: 'cr-3',
        effectiveFrom: '2026-08-01',
      })
      expect(first.success).toBe(true)
      const second = addMapping({
        ownerId: 'own-3',
        listingId: 'lst-7',
        ownershipPercentage: 40,
        commissionRuleId: 'cr-4',
        effectiveFrom: '2026-08-01',
      })
      expect(second.success).toBe(true)
      const nowAllocated = mappings.value
        .filter(m => m.listingId === 'lst-7')
        .reduce((sum, m) => sum + m.ownershipPercentage, 0)
      expect(nowAllocated).toBe(100)
    })

    it('rejects a 21% add when only 20% is left (cumulative 101%)', () => {
      const { addMapping } = useOwners()
      const first = addMapping({
        ownerId: 'own-1',
        listingId: 'lst-9',
        ownershipPercentage: 80,
        commissionRuleId: 'cr-1',
        effectiveFrom: '2026-08-01',
      })
      expect(first.success).toBe(true)
      const second = addMapping({
        ownerId: 'own-2',
        listingId: 'lst-9',
        ownershipPercentage: 21,
        commissionRuleId: 'cr-2',
        effectiveFrom: '2026-08-01',
      })
      expect(second.success).toBe(false)
    })

    it('updates an existing mapping via updateMapping without double-counting the old allocation', () => {
      const { addMapping, updateMapping, mappings } = useOwners()
      const added = addMapping({
        ownerId: 'own-1',
        listingId: 'lst-11',
        ownershipPercentage: 50,
        commissionRuleId: 'cr-1',
        effectiveFrom: '2026-08-01',
      })
      expect(added.success).toBe(true)
      // Increase to 70% — should still be valid because previous allocation is excluded.
      const updated = updateMapping(added.mappingId!, { ownershipPercentage: 70 })
      expect(updated.success).toBe(true)
      const m = mappings.value.find(item => item.id === added.mappingId)!
      expect(m.ownershipPercentage).toBe(70)
    })

    it('removeMapping deletes the mapping', () => {
      const { removeMapping, mappings } = useOwners()
      const before = mappings.value.length
      const result = removeMapping('opm-1')
      expect(result.success).toBe(true)
      expect(mappings.value.length).toBe(before - 1)
      expect(mappings.value.some(m => m.id === 'opm-1')).toBe(false)
    })
  })

  describe('validateOwnership (helper)', () => {
    it('returns valid: false with allocated=100 when total is already at cap', () => {
      const { validateOwnership } = useOwners()
      const check = validateOwnership({
        ownerId: 'own-1',
        listingId: 'lst-1',
        ownershipPercentage: 1,
        commissionRuleId: 'cr-1',
        effectiveFrom: '2026-08-01',
      })
      expect(check.valid).toBe(false)
      expect(check.allocated).toBe(100)
    })

    it('returns valid: true with allocated=0 for an unmapped listing', () => {
      const { validateOwnership } = useOwners()
      const check = validateOwnership({
        ownerId: 'own-1',
        listingId: 'lst-2',
        ownershipPercentage: 50,
        commissionRuleId: 'cr-1',
        effectiveFrom: '2026-08-01',
      })
      expect(check.valid).toBe(true)
      expect(check.allocated).toBe(0)
    })

    it('excludes the mapping being edited from allocated total', () => {
      const { validateOwnership } = useOwners()
      // opm-2 is 50% of lst-3 owned by own-2. The OTHER mapping (opm-4) is 50%.
      // If we leave opm-2 in the sum we get 100 + 1 = 101 > 100 (would be invalid).
      // Excluding opm-2, only opm-4 = 50% counts → 50 + 1 = 51 ≤ 100 (valid).
      const check = validateOwnership(
        {
          ownerId: 'own-2',
          listingId: 'lst-3',
          ownershipPercentage: 1,
          commissionRuleId: 'cr-2',
          effectiveFrom: '2026-08-01',
        },
        'opm-2',
      )
      expect(check.valid).toBe(true)
      expect(check.allocated).toBe(50)
    })
  })

  describe('status transitions', () => {
    it('inviteOwner moves a draft owner to invited and stamps invitedAt', () => {
      const { createOwner, inviteOwner, owners } = useOwners()
      const created = createOwner({
        owner: {
          name: 'Test Draft',
          email: 'draft.owner@example.com',
          phone: '+6281234567400',
          language: 'id',
          statementCurrency: 'IDR',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('financial_summary', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      expect(created.success).toBe(true)
      expect(owners.value.find(o => o.id === created.ownerId)!.status).toBe('draft')

      const invited = inviteOwner(created.ownerId!)
      expect(invited.success).toBe(true)
      const after = owners.value.find(o => o.id === created.ownerId)!
      expect(after.status).toBe('invited')
      expect(after.invitedAt).toBeTruthy()
    })

    it('createOwner with inviteNow:true seeds invited status directly', () => {
      const { createOwner, owners } = useOwners()
      const created = createOwner({
        owner: {
          name: 'Auto Invited',
          email: 'auto.invited@example.com',
          phone: '+6281234567401',
          language: 'id',
          statementCurrency: 'IDR',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('financial_summary', 'placeholder', new Date().toISOString()),
        inviteNow: true,
      })
      expect(created.success).toBe(true)
      const after = owners.value.find(o => o.id === created.ownerId)!
      expect(after.status).toBe('invited')
      expect(after.invitedAt).toBeTruthy()
    })

    it('activateOwner moves invited → active and stamps activatedAt', () => {
      const { activateOwner, owners } = useOwners()
      // Seed has 'own-3' as invited.
      const result = activateOwner('own-3')
      expect(result.success).toBe(true)
      const after = owners.value.find(o => o.id === 'own-3')!
      expect(after.status).toBe('active')
      expect(after.activatedAt).toBeTruthy()
    })

    it('deactivateOwner moves active → inactive', () => {
      const { deactivateOwner, owners } = useOwners()
      // Seed has 'own-1' as active.
      const result = deactivateOwner('own-1')
      expect(result.success).toBe(true)
      expect(owners.value.find(o => o.id === 'own-1')!.status).toBe('inactive')
    })

    it('reactivateOwner moves inactive → active (re-stamps activatedAt)', () => {
      const { deactivateOwner, reactivateOwner, owners } = useOwners()
      deactivateOwner('own-1')
      const result = reactivateOwner('own-1')
      expect(result.success).toBe(true)
      const afterReactivate = owners.value.find(o => o.id === 'own-1')!
      expect(afterReactivate.status).toBe('active')
      expect(afterReactivate.activatedAt).toBeTruthy()
    })

    it('refuses to activate an owner that is not invited (e.g. draft → active is forbidden)', () => {
      const { createOwner, activateOwner } = useOwners()
      const created = createOwner({
        owner: {
          name: 'No Invite Yet',
          email: 'no.invite@example.com',
          phone: '+6281234567402',
          language: 'id',
          statementCurrency: 'IDR',
          annualOwnerUseNightCap: undefined,
        },
        mappings: [],
        commissionRules: [],
        permissions: buildOwnerPermissionTemplate('financial_summary', 'placeholder', new Date().toISOString()),
        inviteNow: false,
      })
      const result = activateOwner(created.ownerId!)
      expect(result.success).toBe(false)
    })
  })

  describe('filteredOwners', () => {
    it('returns every owner when no filters are set', () => {
      const { filteredOwners } = useOwners()
      expect(filteredOwners.value).toHaveLength(mockOwners.length)
    })

    it('search filter matches name or email case-insensitively', () => {
      const { filteredOwners, search } = useOwners()
      search.value = 'WAYAN'
      const hits = filteredOwners.value.map(o => o.id)
      expect(hits).toContain('own-1')
      expect(hits).not.toContain('own-2')

      search.value = 'PUTU.ANTARA@EXAMPLE.COM'
      expect(filteredOwners.value.map(o => o.id)).toEqual(['own-2'])

      search.value = 'kadek'
      expect(filteredOwners.value.map(o => o.id)).toEqual(['own-3'])
    })

    it('status filter narrows by exact status', () => {
      const { filteredOwners, statusFilter } = useOwners()
      statusFilter.value = 'active'
      expect(filteredOwners.value.map(o => o.id).sort()).toEqual(['own-1', 'own-2'])
      statusFilter.value = 'invited'
      expect(filteredOwners.value.map(o => o.id)).toEqual(['own-3'])
      statusFilter.value = 'inactive'
      expect(filteredOwners.value).toHaveLength(0)
    })

    it('property filter returns owners who have a mapping for the listing', () => {
      const { filteredOwners, propertyFilter } = useOwners()
      // Seed has mappings for lst-1, lst-3, lst-8.
      propertyFilter.value = 'lst-3'
      expect(filteredOwners.value.map(o => o.id).sort()).toEqual(['own-2', 'own-3'])
      propertyFilter.value = 'lst-1'
      expect(filteredOwners.value.map(o => o.id)).toEqual(['own-1'])
      propertyFilter.value = 'lst-9'
      expect(filteredOwners.value).toHaveLength(0)
    })

    it('combines search + status + property filters (AND logic)', () => {
      const { filteredOwners, search, statusFilter, propertyFilter } = useOwners()
      search.value = 'putu'
      statusFilter.value = 'active'
      propertyFilter.value = 'lst-3'
      expect(filteredOwners.value.map(o => o.id)).toEqual(['own-2'])

      // Changing property should remove the match.
      propertyFilter.value = 'lst-9'
      expect(filteredOwners.value).toHaveLength(0)
    })
  })
})
