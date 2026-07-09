import { findLinkByToken, saveSubmission } from '../../../../utils/guest-guide-store'
import { generateId } from '~/utils/guest-guide-token'
import type { GuideSubmission } from '~/components/guest-guides/data/types'

interface SubmitIdBody {
  idType?: 'passport' | 'ktp' | 'driver_license'
  idNumber?: string
  idPhotoUrl?: string
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

  const body = await readBody<SubmitIdBody>(event)

  const submission: GuideSubmission = {
    id: generateId('gsub'),
    linkId: link.id,
    submittedAt: new Date().toISOString(),
    idType: body?.idType,
    idNumber: body?.idNumber,
    idPhotoUrl: body?.idPhotoUrl,
  }

  saveSubmission(submission)

  return { ok: true, submissionId: submission.id }
})