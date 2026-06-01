export type RuleConditionType
  = 'keywords' | 'ai_confidence' | 'time_of_day' | 'guest_language' | 'reservation_status'

export type RuleRouteTo
  = 'staff_pause' | 'specific_staff' | 'hostbuddy' | 'hostbuddy_notify'

export interface RoutingRule {
  id: string
  name: string
  active: boolean
  conditionType: RuleConditionType
  conditionValue: string
  routeTo: RuleRouteTo
  isDefault?: boolean
}

export const conditionTypeLabels: Record<RuleConditionType, string> = {
  keywords: 'Keywords in message',
  ai_confidence: 'AI confidence below threshold',
  time_of_day: 'Time of day',
  guest_language: 'Guest language',
  reservation_status: 'Reservation status',
}

export const routeToLabels: Record<RuleRouteTo, string> = {
  staff_pause: 'Staff inbox (pause AI)',
  specific_staff: 'Specific staff member',
  hostbuddy: 'HostBuddy (auto-reply)',
  hostbuddy_notify: 'HostBuddy + notify staff',
}

export function ruleConditionText(rule: RoutingRule): string {
  switch (rule.conditionType) {
    case 'keywords': return `If message contains: ${rule.conditionValue}`
    case 'ai_confidence': return `If HostBuddy confidence < ${rule.conditionValue}`
    case 'time_of_day': return `If time is ${rule.conditionValue}`
    case 'guest_language': return `If guest language is ${rule.conditionValue}`
    case 'reservation_status': return `If reservation status is ${rule.conditionValue}`
  }
}

const seedRules: RoutingRule[] = [
  { id: 'r1', name: 'Complaint Keywords → Staff', active: true, conditionType: 'keywords', conditionValue: 'complaint, refund, angry, emergency, manager, unhappy', routeTo: 'staff_pause' },
  { id: 'r2', name: 'Low AI Confidence → Review', active: true, conditionType: 'ai_confidence', conditionValue: '60%', routeTo: 'staff_pause' },
  { id: 'r3', name: 'After Hours → AI Only', active: true, conditionType: 'time_of_day', conditionValue: '22:00–07:00', routeTo: 'hostbuddy' },
  { id: 'r4', name: 'Default', active: true, conditionType: 'keywords', conditionValue: 'all other messages', routeTo: 'hostbuddy', isDefault: true },
]

export function useWhatsAppRules() {
  const rules = useState<RoutingRule[]>('whatsapp-rules', () => seedRules.map(r => ({ ...r })))

  function saveRule(rule: RoutingRule) {
    const i = rules.value.findIndex(r => r.id === rule.id)
    if (i === -1)
      rules.value = [...rules.value.slice(0, -1), rule, rules.value[rules.value.length - 1]!]
    else rules.value = rules.value.map(r => (r.id === rule.id ? rule : r))
  }

  function deleteRule(id: string) {
    rules.value = rules.value.filter(r => r.id !== id)
  }

  function toggleRule(id: string) {
    rules.value = rules.value.map(r => (r.id === id ? { ...r, active: !r.active } : r))
  }

  return { rules, saveRule, deleteRule, toggleRule }
}
