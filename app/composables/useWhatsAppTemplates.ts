export interface WATemplate {
  id: string
  name: string
  body: string
}

export const waTemplates: WATemplate[] = [
  { id: 'booking_confirmation', name: 'booking_confirmation', body: 'Hi {{guest_name}}, your stay at {{property_name}} is confirmed for {{check_in_date}}. We look forward to welcoming you!' },
  { id: 'checkin_instructions', name: 'checkin_instructions', body: 'Hi {{guest_name}}, your check-in at {{property_name}} is tomorrow at 15:00. Here\'s your guide: https://guide.elev8-suite.com/abc123' },
  { id: 'upsell_early_checkin', name: 'upsell_early_checkin', body: 'Hi {{guest_name}}, want to start your stay early? Add early check-in (from 11:00) for {{price}}. Reply YES to confirm.' },
  { id: 'review_request', name: 'review_request', body: 'Hi {{guest_name}}, thank you for staying at {{property_name}}! We\'d love a quick review: {{review_link}}' },
]

export function renderTemplate(body: string, vars: Record<string, string> = {}): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`)
}
