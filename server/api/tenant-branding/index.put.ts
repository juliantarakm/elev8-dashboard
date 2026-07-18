import { createError, defineEventHandler, readBody } from 'h3'
import { isTenantBranding } from '../../../app/components/settings/data/branding'
import { setTenantBranding } from '../../utils/tenant-branding-store'

export default defineEventHandler(async (event) => {
  const body = await readBody<unknown>(event)
  if (!isTenantBranding(body)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid branding payload' })
  }
  return setTenantBranding(body)
})