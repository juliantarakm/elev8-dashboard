<script setup lang="ts">
import type {
  BookingChannel,
  ConditionCombinator,
  ConditionRule,
  ConditionType,
} from './data/journeys'
import {
  bookingChannelMeta,
  conditionMeta,
  makeConditionRule,
  primaryConditionTypes,
} from './data/journeys'

const props = defineProps<{
  open: boolean
  modelValue: ConditionRule[]
  combinator?: ConditionCombinator
  title?: string
  description?: string
  saveLabel?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [rules: ConditionRule[], combinator: ConditionCombinator]
}>()

const localRules = ref<ConditionRule[]>([])
const localCombinator = ref<ConditionCombinator>('and')

watch(() => props.open, (open) => {
  if (open) {
    localRules.value = props.modelValue.length
      ? JSON.parse(JSON.stringify(props.modelValue))
      : [makeConditionRule('custom_criteria')]
    localCombinator.value = props.combinator ?? 'and'
  }
})

const allChannels: BookingChannel[] = [
  'airbnb', 'vrbo', 'booking', 'expedia', 'tripadvisor', 'agoda', 'tripcom',
  'hometogo', 'flipkey', 'hotels', 'despegar', 'google', 'marriott', 'whimstay',
  'direct', 'email',
]

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const reservationStatuses = ['Future', 'Past', 'Current', 'Inquiry', 'Cancelled']

const rangeTypes: ConditionType[] = ['days_until_checkin', 'reservation_duration', 'guest_count', 'pet_count', 'child_count', 'infant_count']

const toggleTypes: ConditionType[] = ['booking_channel', 'reservation_status', 'weekday', 'sentiment']

function isRange(type: ConditionType) {
  return rangeTypes.includes(type)
}

function isToggle(type: ConditionType) {
  return toggleTypes.includes(type)
}

function isBoolean(type: ConditionType) {
  return type === 'guest_no_response'
}

function isGapNight(type: ConditionType) {
  return type === 'gap_night_exists'
}

function isTimeOfDay(type: ConditionType) {
  return type === 'time_of_day'
}

function rangeLabels(type: ConditionType) {
  const map: Record<string, { min: string, max: string }> = {
    days_until_checkin: { min: 'Minimum Days', max: 'Maximum Days' },
    reservation_duration: { min: 'Minimum Days', max: 'Maximum Days' },
    guest_count: { min: 'Minimum Guests', max: 'Maximum Guests' },
    pet_count: { min: 'Minimum Pets', max: 'Maximum Pets' },
    child_count: { min: 'Minimum Children', max: 'Maximum Children' },
    infant_count: { min: 'Minimum Infants', max: 'Maximum Infants' },
  }
  return map[type] ?? { min: 'Minimum', max: 'Maximum' }
}

function patchRule(id: string, fields: Partial<ConditionRule>) {
  localRules.value = localRules.value.map(r => (r.id === id ? { ...r, ...fields } : r))
}

function changeType(id: string, type: ConditionType) {
  const fresh = makeConditionRule(type)
  localRules.value = localRules.value.map(r => (r.id === id ? { ...fresh, id: r.id } : r))
}

function toggleChannel(id: string, c: BookingChannel) {
  const rule = localRules.value.find(r => r.id === id)
  if (!rule)
    return
  const current = [...(rule.channels ?? [])]
  const idx = current.indexOf(c)
  if (idx === -1)
    current.push(c)
  else current.splice(idx, 1)
  patchRule(id, { channels: current })
}

function toggleStatus(id: string, s: string) {
  const rule = localRules.value.find(r => r.id === id)
  if (!rule)
    return
  const current = rule.textValue ? rule.textValue.split(',').filter(Boolean) : []
  const idx = current.indexOf(s)
  if (idx === -1)
    current.push(s)
  else current.splice(idx, 1)
  patchRule(id, { textValue: current.join(',') })
}

function isStatusSelected(rule: ConditionRule, s: string) {
  return rule.textValue ? rule.textValue.split(',').includes(s) : false
}

function toggleWeekday(id: string, d: string) {
  const rule = localRules.value.find(r => r.id === id)
  if (!rule)
    return
  const current = rule.textValue ? rule.textValue.split(',').filter(Boolean) : []
  const idx = current.indexOf(d)
  if (idx === -1)
    current.push(d)
  else current.splice(idx, 1)
  patchRule(id, { textValue: current.join(',') })
}

function isWeekdaySelected(rule: ConditionRule, d: string) {
  return rule.textValue ? rule.textValue.split(',').includes(d) : false
}

function toggleSentiment(id: string, s: 'positive' | 'neutral' | 'negative') {
  const rule = localRules.value.find(r => r.id === id)
  if (!rule)
    return
  const current = [...(rule.targetSentiments ?? [])]
  const idx = current.indexOf(s)
  if (idx === -1)
    current.push(s)
  else current.splice(idx, 1)
  patchRule(id, { targetSentiments: current })
}

function addRule() {
  localRules.value = [...localRules.value, makeConditionRule('custom_criteria')]
}

function removeRule(id: string) {
  localRules.value = localRules.value.filter(r => r.id !== id)
}

function handleSave() {
  emit('save', localRules.value, localCombinator.value)
  emit('update:open', false)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ title ?? 'Configure Conditions' }}</DialogTitle>
        <DialogDescription v-if="description">
          {{ description }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-1 max-h-[65vh] overflow-y-auto pr-1">
        <div
          v-for="(rule, i) in localRules"
          :key="rule.id"
          class="rounded-lg border bg-card p-3"
        >
          <!-- combinator + remove -->
          <div class="mb-2 flex items-center gap-2">
            <span class="text-xs font-medium text-muted-foreground">Condition {{ i + 1 }}</span>
            <button
              v-if="localRules.length > 1"
              class="ml-auto text-xs font-semibold rounded px-2 py-0.5 border transition-colors"
              :class="localCombinator === 'and' ? 'bg-primary text-primary-foreground border-primary' : 'text-muted-foreground hover:bg-muted'"
              @click="localCombinator = localCombinator === 'and' ? 'or' : 'and'"
            >
              {{ localCombinator.toUpperCase() }}
            </button>
            <Button
              v-if="localRules.length > 1"
              variant="ghost"
              size="icon"
              class="h-6 w-6 text-muted-foreground hover:text-destructive"
              aria-label="Remove condition"
              @click="removeRule(rule.id)"
            >
              <Icon name="i-lucide-x" class="h-3.5 w-3.5" />
            </Button>
          </div>

          <!-- type select -->
          <Select :model-value="rule.type" @update:model-value="changeType(rule.id, $event as ConditionType)">
            <SelectTrigger class="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Conditions</SelectLabel>
                <SelectItem v-for="t in primaryConditionTypes" :key="t" :value="t">
                  {{ conditionMeta[t] }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <!-- 1. Custom Criteria — Free text -->
          <div v-if="rule.type === 'custom_criteria'" class="mt-2">
            <Textarea
              :model-value="rule.textValue ?? ''"
              class="min-h-20 text-sm"
              placeholder="Describe any custom criteria or condition (e.g. guest provided signed rental agreement). AI analyzes the conversation to check if criteria is satisfied."
              @update:model-value="patchRule(rule.id, { textValue: $event as string })"
            />
          </div>

          <!-- 2. Guest has not responded — No extra fields -->
          <div v-else-if="isBoolean(rule.type)" class="mt-2 text-xs text-muted-foreground">
            No extra fields. Checks if the guest has not replied to the last message sent in this journey.
          </div>

          <!-- 3. Reservation status — Multiple select toggle buttons -->
          <div v-else-if="rule.type === 'reservation_status'" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="s in reservationStatuses"
              :key="s"
              class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="isStatusSelected(rule, s) ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              @click="toggleStatus(rule.id, s)"
            >
              {{ s }}
            </button>
          </div>

          <!-- 4. Booking channel — Toggle buttons (16 platforms) -->
          <div v-else-if="rule.type === 'booking_channel'" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="c in allChannels"
              :key="c"
              class="rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
              :class="rule.channels?.includes(c) ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              @click="toggleChannel(rule.id, c)"
            >
              {{ bookingChannelMeta[c] }}
            </button>
          </div>

          <!-- 5. Weekday — Multiple select toggle buttons -->
          <div v-else-if="rule.type === 'weekday'" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="d in weekdays"
              :key="d"
              class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
              :class="isWeekdaySelected(rule, d) ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              @click="toggleWeekday(rule.id, d)"
            >
              {{ d }}
            </button>
          </div>

          <!-- 6. Time of day — Time range picker -->
          <div v-else-if="isTimeOfDay(rule.type)" class="mt-2 flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground shrink-0 w-12">From</Label>
              <Input
                type="time"
                :model-value="rule.timeFrom ?? '09:00'"
                class="h-9 flex-1 text-sm"
                @update:model-value="patchRule(rule.id, { timeFrom: $event as string })"
              />
            </div>
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground shrink-0 w-12">To</Label>
              <Input
                type="time"
                :model-value="rule.timeTo ?? '17:00'"
                class="h-9 flex-1 text-sm"
                @update:model-value="patchRule(rule.id, { timeTo: $event as string })"
              />
            </div>
          </div>

          <!-- 7-12. Number range (Min/Max) — days_until_checkin, reservation_duration, guest_count, pet_count, child_count, infant_count -->
          <div v-else-if="isRange(rule.type)" class="mt-2 flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground shrink-0 w-28">{{ rangeLabels(rule.type).min }}</Label>
              <Input
                type="number"
                :model-value="rule.minValue ?? 0"
                min="0"
                class="h-9 w-24 text-sm"
                @update:model-value="patchRule(rule.id, { minValue: Number($event) })"
              />
            </div>
            <div class="flex items-center gap-2">
              <Label class="text-xs text-muted-foreground shrink-0 w-28">{{ rangeLabels(rule.type).max }}</Label>
              <Input
                type="number"
                :model-value="rule.maxValue ?? ''"
                min="0"
                placeholder="∞"
                class="h-9 w-24 text-sm"
                @update:model-value="patchRule(rule.id, { maxValue: Number($event) || undefined })"
              />
            </div>
          </div>

          <!-- 13. Sentiment — Toggle buttons -->
          <div v-else-if="rule.type === 'sentiment'" class="mt-2">
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="s in (['positive', 'neutral', 'negative'] as const)"
                :key="s"
                class="rounded-lg border py-2 text-sm font-medium transition-colors" :class="[
                  rule.targetSentiments?.includes(s)
                    ? s === 'positive' ? 'bg-green-500 border-green-500 text-white'
                      : s === 'neutral' ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-red-500 border-red-500 text-white'
                    : 'border-input text-muted-foreground hover:bg-muted',
                ]"
                @click="toggleSentiment(rule.id, s)"
              >
                {{ s.charAt(0).toUpperCase() + s.slice(1) }}
              </button>
            </div>
          </div>

          <!-- 14. Gap night exists — Multi-field -->
          <div v-else-if="isGapNight(rule.type)" class="mt-2 flex flex-col gap-3">
            <div class="flex flex-col gap-2">
              <Label class="text-xs text-muted-foreground">Gap night location</Label>
              <div class="flex flex-wrap gap-2">
                <button
                  class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                  :class="rule.gapLocation === 'before_checkin' ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
                  @click="patchRule(rule.id, { gapLocation: 'before_checkin' })"
                >
                  Before Check-in
                </button>
                <button
                  class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
                  :class="rule.gapLocation === 'after_checkout' ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
                  @click="patchRule(rule.id, { gapLocation: 'after_checkout' })"
                >
                  After Check-out
                </button>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <Label class="text-xs text-muted-foreground">Gap Night Range</Label>
              <div class="flex items-center gap-2">
                <Label class="text-xs text-muted-foreground shrink-0 w-16">Min Nights</Label>
                <Input
                  type="number"
                  :model-value="rule.minValue ?? 1"
                  min="1"
                  class="h-9 w-20 text-sm"
                  @update:model-value="patchRule(rule.id, { minValue: Number($event) })"
                />
              </div>
              <div class="flex items-center gap-2">
                <Label class="text-xs text-muted-foreground shrink-0 w-16">Max Nights</Label>
                <Input
                  type="number"
                  :model-value="rule.maxValue ?? ''"
                  min="1"
                  placeholder="No limit"
                  class="h-9 w-20 text-sm"
                  @update:model-value="patchRule(rule.id, { maxValue: Number($event) || undefined })"
                />
              </div>
            </div>
          </div>

          <!-- Fallback for any other types -->
          <div v-else class="mt-2">
            <Textarea
              :model-value="rule.textValue ?? ''"
              class="min-h-16 text-sm"
              placeholder="Describe the condition…"
              @update:model-value="patchRule(rule.id, { textValue: $event as string })"
            />
          </div>
        </div>

        <Button variant="outline" class="border-dashed" @click="addRule">
          <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
          Add Another Condition
        </Button>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Back to Conditions
        </Button>
        <Button @click="handleSave">
          {{ saveLabel ?? 'Save' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
