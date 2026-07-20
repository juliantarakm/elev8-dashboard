import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultTenantBranding } from '~/components/settings/data/branding'
import handler from '~/server/api/tenant-branding/index.put'
import { getTenantBranding, resetTenantBranding } from '~/server/utils/tenant-branding-store'

async function invoke(body: unknown) {
  const ParsedBodySymbol = Symbol.for('h3ParsedBody')
  const req: any = { headers: {} }
  req[ParsedBodySymbol] = body
  return handler({ node: { req, res: {} }, context: {} } as any)
}

describe('PUT /api/tenant-branding', () => {
  beforeEach(() => resetTenantBranding())

  it('stores and returns a valid branding payload', async () => {
    const branding = createDefaultTenantBranding()
    branding.guestGuideColors.primary = '#123456'
    branding.updatedAt = '2026-07-18T10:00:00.000Z'

    await expect(invoke(branding)).resolves.toEqual(branding)
    expect(getTenantBranding()).toEqual(branding)
  })

  it('rejects invalid branding without changing the store', async () => {
    await expect(invoke({ guestGuideColors: { primary: 'yellow' } })).rejects.toMatchObject({ statusCode: 400 })
    expect(getTenantBranding()).toEqual(createDefaultTenantBranding())
  })
})