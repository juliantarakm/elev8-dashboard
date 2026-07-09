import { findLinkByToken, saveSubmission } from '../../../../utils/guest-guide-store'
import { generateId } from '~/utils/guest-guide-token'
import type { GuideSubmission } from '~/components/guest-guides/data/types'

interface SubmitBody {
  arrivalTime?: string
  guests?: number
  mobile?: string
  idType?: 'passport' | 'ktp' | 'driver_license'
  idNumber?: string
  idPhotoUrl?: string
  requests?: string
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token required' })
  }

  const link = findLinkByToken(token)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Guide not found' })
  }

  if (link.status === 'revoked') {
    throw createError({ statusCode: 410, statusMessage: 'This guide is no longer available' })
  }

  if (new Date(link.expiresAt) < new Date()) {
    throw createError({ statusCode: 410, statusMessage: 'This guide has expired' })
  }

  const body = await readBody<SubmitBody>(event)

  const submission: GuideSubmission = {
    id: generateId('gsub'),
    linkId: link.id,
    submittedAt: new Date().toISOString(),
    arrivalTime: body?.arrivalTime,
    guests: body?.guests,
    mobile: body?.mobile,
    idType: body?.idType,
    idNumber: body?.idNumber,
    idPhotoUrl: body?.idPhotoUrl,
    requests: body?.requests,
  }

  saveSubmission(submission)

  return { ok: true, submissionId: submission.id }
})