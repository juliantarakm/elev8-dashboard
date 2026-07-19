import type { WhatsAppTemplate } from '~/components/journeys/data/whatsapp-templates'
import { createEmptyTemplate, mapVariablesToPositional, mockTemplates, validateTemplate } from '~/components/journeys/data/whatsapp-templates'

const STORAGE_KEY = 'elev8-whatsapp-templates'

function loadFromStorage(): WhatsAppTemplate[] {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw)
        return JSON.parse(raw) as WhatsAppTemplate[]
    }
    catch { /* ignore */ }
  }
  return mockTemplates
}

function saveToStorage(templates: WhatsAppTemplate[]) {
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
    }
    catch { /* ignore */ }
  }
}

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{([^}]+)\}\}/g, (_match, key) => {
    return vars[key] ?? `{{${key}}}`
  })
}

export interface MetaSendPayload {
  messaging_product: 'whatsapp'
  recipient_type: 'individual'
  to: string
  type: 'template'
  template: {
    name: string
    language: { code: string }
    components: Record<string, any>[]
  }
}

/**
 * Build a Meta Cloud API send payload for an approved WhatsApp template.
 * Friendly variable keys (e.g. {{guest_name}}) are mapped to sequential positional
 * parameters {{1}}, {{2}}, etc. as required by Meta.
 */
export function buildMetaSendPayload(
  template: WhatsAppTemplate,
  to: string,
  vars: Record<string, string>,
): MetaSendPayload {
  const { normalizedBody, mapping } = mapVariablesToPositional(template.body)

  const components: Record<string, any>[] = []

  // Header
  if (template.header.type === 'text' && template.header.text) {
    components.push({ type: 'header', parameters: [{ type: 'text', text: template.header.text }] })
  }
  else if (template.header.type === 'image' && template.header.mediaUrl) {
    components.push({ type: 'header', parameters: [{ type: 'image', image: { link: template.header.mediaUrl } }] })
  }
  else if (template.header.type === 'video' && template.header.mediaUrl) {
    components.push({ type: 'header', parameters: [{ type: 'video', video: { link: template.header.mediaUrl } }] })
  }
  else if (template.header.type === 'document' && template.header.mediaUrl) {
    components.push({ type: 'header', parameters: [{ type: 'document', document: { link: template.header.mediaUrl, filename: template.header.mediaFilename ?? 'document.pdf' } }] })
  }

  // Body parameters in order of first appearance
  const positionalKeys = Object.keys(mapping).sort((a, b) => Number(a) - Number(b))
  const bodyParameters = positionalKeys.map((positional) => {
    const friendlyKey = mapping[positional]!
    return { type: 'text', text: vars[friendlyKey] ?? `{{${positional}}}` }
  })

  if (bodyParameters.length > 0 || normalizedBody.length > 0) {
    components.push({ type: 'body', parameters: bodyParameters })
  }

  // Buttons
  template.buttons.forEach((btn, index) => {
    if (btn.kind === 'quick_reply') {
      components.push({
        type: 'button',
        sub_type: 'quick_reply',
        index: String(index),
        parameters: [{ type: 'payload', payload: btn.text }],
      })
    }
  })

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language },
      components,
    },
  }
}

export function useWhatsAppTemplates() {
  const templates = useState<WhatsAppTemplate[]>('whatsapp-templates', () => loadFromStorage())

  watch(templates, (val) => {
    saveToStorage(val)
  }, { deep: true })

  const approvedTemplates = computed(() => templates.value.filter(t => t.status === 'approved'))
  const waTemplates = templates

  function getTemplateById(id: string): WhatsAppTemplate | undefined {
    return templates.value.find(t => t.id === id)
  }

  function createTemplate(overrides?: Partial<WhatsAppTemplate>): WhatsAppTemplate {
    const base = createEmptyTemplate()
    const template: WhatsAppTemplate = { ...base, ...overrides, id: base.id, createdAt: base.createdAt, lastModified: base.lastModified }
    templates.value = [template, ...templates.value]
    return template
  }

  function updateTemplate(id: string, updates: Partial<WhatsAppTemplate>) {
    templates.value = templates.value.map(t =>
      t.id === id
        ? { ...t, ...updates, lastModified: new Date().toISOString() }
        : t,
    )
  }

  function saveTemplate(template: WhatsAppTemplate) {
    const exists = templates.value.find(t => t.id === template.id)
    const now = new Date().toISOString()
    if (exists) {
      templates.value = templates.value.map(t =>
        t.id === template.id
          ? { ...template, lastModified: now }
          : t,
      )
    }
    else {
      templates.value = [{ ...template, createdAt: now, lastModified: now }, ...templates.value]
    }
  }

  function deleteTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  function duplicateTemplate(id: string): WhatsAppTemplate | undefined {
    const original = getTemplateById(id)
    if (!original)
      return undefined
    const now = new Date().toISOString()
    const copy: WhatsAppTemplate = {
      ...JSON.parse(JSON.stringify(original)),
      id: `wt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${original.name} (Copy)`,
      status: 'draft',
      statusReason: undefined,
      submittedAt: undefined,
      approvedAt: undefined,
      qualityRating: undefined,
      createdAt: now,
      lastModified: now,
    }
    templates.value = [copy, ...templates.value]
    return copy
  }

  async function submitTemplate(id: string): Promise<{ success: boolean, error?: string }> {
    const template = getTemplateById(id)
    if (!template)
      return { success: false, error: 'Template not found.' }

    const { valid, errors } = validateTemplate(template)
    if (!valid)
      return { success: false, error: errors[0]?.message ?? 'Validation failed.' }

    const now = new Date().toISOString()
    updateTemplate(id, { status: 'pending', submittedAt: now, statusReason: undefined })

    // Simulate Meta review delay
    await new Promise(resolve => setTimeout(resolve, 2500))

    const approved = Math.random() > 0.25
    if (approved) {
      updateTemplate(id, { status: 'approved', approvedAt: new Date().toISOString(), qualityRating: 'HIGH' })
      return { success: true }
    }
    else {
      const reasons = [
        'Category mismatch: submitted as Utility but contains promotional language.',
        'Body contains variable at the beginning or end of a sentence.',
        'Button URL does not meet HTTPS requirement.',
        'Template content is too similar to an existing rejected template.',
      ]
      updateTemplate(id, { status: 'rejected', statusReason: reasons[Math.floor(Math.random() * reasons.length)] })
      return { success: false, error: reasons[0] }
    }
  }

  function resetToMock() {
    templates.value = mockTemplates
  }

  return {
    templates,
    waTemplates,
    approvedTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    submitTemplate,
    resetToMock,
  }
}
