import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Token required' })

  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, statusMessage: 'No file' })

  const file = formData.find(f => f.name === 'photo')
  if (!file) throw createError({ statusCode: 400, statusMessage: 'photo field required' })

  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'File too large (max 5MB)' })
  }

  const dir = join(process.cwd(), 'public', 'uploads', 'guest-id')
  await mkdir(dir, { recursive: true })
  const ext = file.filename?.split('.').pop()?.toLowerCase() ?? 'jpg'
  const safeExt = /^(jpg|jpeg|png|webp|gif)$/.test(ext) ? ext : 'jpg'
  const filename = `${token}-${Date.now()}.${safeExt}`
  await writeFile(join(dir, filename), file.data)

  return {
    url: `/uploads/guest-id/${filename}`,
  }
})
