<script setup lang="ts">
import type {
  JourneyStep, TriggerStep, WaitStep, MessageStep, ContextCheckStep, ActionStep,
  IfElseStep, HardRequirementStep, CreateNoteStep, ToggleAIStep, IntegrationStep,
  TriggerType,
} from './data/journeys'
import { conditionMeta, triggerMeta } from './data/journeys'

const props = defineProps<{
  step: JourneyStep | null
  journeyName: string
}>()

const emit = defineEmits<{
  update: [step: JourneyStep]
}>()

function patch(fields: Partial<JourneyStep>) {
  if (!props.step) return
  emit('update', { ...props.step, ...fields } as JourneyStep)
}

const triggerStep = computed(() => props.step?.type === 'trigger' ? props.step as TriggerStep : null)
const waitStep = computed(() => props.step?.type === 'wait' ? props.step as WaitStep : null)
const messageStep = computed(() => props.step?.type === 'message' ? props.step as MessageStep : null)
const contextStep = computed(() => props.step?.type === 'context_check' ? props.step as ContextCheckStep : null)
const actionStep = computed(() => props.step?.type === 'action' ? props.step as ActionStep : null)
const ifElseStep = computed(() => props.step?.type === 'if_else' ? props.step as IfElseStep : null)
const hardReqStep = computed(() => props.step?.type === 'hard_requirement' ? props.step as HardRequirementStep : null)
const noteStep = computed(() => props.step?.type === 'create_note' ? props.step as CreateNoteStep : null)
const toggleAIStep = computed(() => props.step?.type === 'toggle_ai' ? props.step as ToggleAIStep : null)
const integrationStep = computed(() => props.step?.type === 'integration' ? props.step as IntegrationStep : null)
const isEndJourney = computed(() => props.step?.type === 'end_journey')

const conditionTypes = Object.entries(conditionMeta).map(([value, label]) => ({ value, label }))

const allTriggerOptions = Object.entries(triggerMeta).map(([value, meta]) => ({ value: value as TriggerType, label: meta.label, category: meta.category }))
const eventTriggers = computed(() => allTriggerOptions.filter(t => t.category === 'event'))
const calendarTriggers = computed(() => allTriggerOptions.filter(t => t.category === 'calendar'))

const altTriggers = computed(() => (triggerStep.value?.alternativeTriggers ?? []) as TriggerType[])

function addAltTrigger(type: TriggerType) {
  if (!triggerStep.value) return
  const current = triggerStep.value.alternativeTriggers ?? []
  if (current.includes(type)) return
  patch({ alternativeTriggers: [...current, type] } as any)
}

function removeAltTrigger(index: number) {
  if (!triggerStep.value) return
  const current = [...(triggerStep.value.alternativeTriggers ?? [])]
  current.splice(index, 1)
  patch({ alternativeTriggers: current } as any)
}

function getTriggerLabel(type: TriggerType) {
  return triggerMeta[type]?.label ?? type
}

const availableAltTriggers = computed(() => {
  if (!triggerStep.value) return allTriggerOptions
  const used = new Set([triggerStep.value.triggerType, ...(triggerStep.value.alternativeTriggers ?? [])])
  return allTriggerOptions.filter(t => !used.has(t.value))
})

const showAltTriggerPicker = ref(false)
</script>

<template>
  <div class="flex flex-col h-full">
    <div v-if="!step" class="flex flex-1 items-center justify-center">
      <div class="text-center text-muted-foreground">
        <Icon name="i-lucide-mouse-pointer-click" class="mx-auto mb-2 h-8 w-8 opacity-40" />
        <p class="text-sm">Select a step to configure it</p>
      </div>
    </div>

    <template v-else>
      <div class="mb-4 border-b pb-4">
        <Label class="text-xs text-muted-foreground">Step Name</Label>
        <Input
          :model-value="step.name"
          class="mt-1"
          @update:model-value="patch({ name: $event as string })"
        />
      </div>

      <!-- Trigger -->
      <div v-if="triggerStep" class="flex flex-col gap-4">
        <div>
          <Label>Triggers</Label>
          <p class="mt-0.5 text-xs text-muted-foreground">Journey fires when ANY of these events occur.</p>

          <!-- Primary trigger -->
          <div class="mt-2 flex flex-col gap-1.5">
            <div class="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
              <Icon name="i-lucide-zap" class="h-3.5 w-3.5 shrink-0 text-purple-500" />
              <Select :model-value="triggerStep.triggerType" @update:model-value="patch({ triggerType: $event } as any)">
                <SelectTrigger class="h-auto border-0 p-0 shadow-none focus:ring-0 flex-1 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Event-based</SelectLabel>
                    <SelectItem v-for="t in eventTriggers" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Calendar-based</SelectLabel>
                    <SelectItem v-for="t in calendarTriggers" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Badge variant="secondary" class="text-[10px] shrink-0">Primary</Badge>
            </div>

            <!-- Alternative triggers -->
            <template v-for="(alt, i) in altTriggers" :key="i">
              <div class="flex items-center gap-1.5">
                <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                  <span class="text-[9px] font-semibold text-muted-foreground">OR</span>
                </div>
                <div class="flex flex-1 items-center gap-2 rounded-md border bg-card px-3 py-2">
                  <Icon name="i-lucide-zap" class="h-3.5 w-3.5 shrink-0 text-purple-400" />
                  <Select :model-value="alt" @update:model-value="(v) => { const arr = [...altTriggers]; arr[i] = v as TriggerType; patch({ alternativeTriggers: arr } as any) }">
                    <SelectTrigger class="h-auto border-0 p-0 shadow-none focus:ring-0 flex-1 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Event-based</SelectLabel>
                        <SelectItem v-for="t in eventTriggers" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>Calendar-based</SelectLabel>
                        <SelectItem v-for="t in calendarTriggers" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" class="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive" aria-label="Remove trigger" @click="removeAltTrigger(i)">
                    <Icon name="i-lucide-x" class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </template>

            <!-- Add alternative trigger -->
            <div class="flex items-center gap-1.5">
              <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                <span class="text-[9px] font-semibold text-muted-foreground">OR</span>
              </div>
              <DropdownMenu v-model:open="showAltTriggerPicker">
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="outline"
                    class="flex-1 justify-start gap-2 border-dashed text-xs text-muted-foreground h-8"
                    :disabled="availableAltTriggers.length === 0"
                  >
                    <Icon name="i-lucide-plus" class="h-3.5 w-3.5" />
                    Add alternative trigger
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-56">
                  <DropdownMenuLabel class="text-xs text-muted-foreground">Event-based</DropdownMenuLabel>
                  <DropdownMenuItem
                    v-for="t in availableAltTriggers.filter(x => x.category === 'event')"
                    :key="t.value"
                    @click="addAltTrigger(t.value)"
                  >{{ t.label }}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel class="text-xs text-muted-foreground">Calendar-based</DropdownMenuLabel>
                  <DropdownMenuItem
                    v-for="t in availableAltTriggers.filter(x => x.category === 'calendar')"
                    :key="t.value"
                    @click="addAltTrigger(t.value)"
                  >{{ t.label }}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div>
          <Label>Properties</Label>
          <p class="mt-1 text-sm text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">All Properties</p>
        </div>
      </div>

      <!-- Wait -->
      <div v-else-if="waitStep" class="flex flex-col gap-4">
        <div>
          <Label>Wait Type</Label>
          <Select :model-value="waitStep.waitType" @update:model-value="patch({ waitType: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time">Wait for Time</SelectItem>
              <SelectItem value="trigger">Wait for Trigger</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <template v-if="waitStep.waitType === 'time'">
          <div class="flex gap-2">
            <div class="flex-1">
              <Label>Duration</Label>
              <Input
                type="number"
                :model-value="waitStep.duration"
                min="1"
                class="mt-1"
                @update:model-value="patch({ duration: Number($event) } as any)"
              />
            </div>
            <div class="w-32">
              <Label>Unit</Label>
              <Select :model-value="waitStep.unit" @update:model-value="patch({ unit: $event } as any)">
                <SelectTrigger class="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Relative To</Label>
            <Select :model-value="waitStep.relativeTo ?? 'none'" @update:model-value="patch({ relativeTo: $event === 'none' ? null : $event } as any)">
              <SelectTrigger class="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Fixed (no reference)</SelectItem>
                <SelectItem value="checkin">Check-in</SelectItem>
                <SelectItem value="checkout">Check-out</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </template>
        <template v-else>
          <div>
            <Label>Wait for Event</Label>
            <Input
              :model-value="waitStep.waitTrigger"
              class="mt-1"
              placeholder="e.g. Guest replies, Sentiment changes…"
              @update:model-value="patch({ waitTrigger: $event as string } as any)"
            />
          </div>
        </template>
      </div>

      <!-- Message -->
      <div v-else-if="messageStep" class="flex flex-col gap-4">
        <div>
          <Label>Message Mode</Label>
          <div class="mt-1 flex rounded-md border overflow-hidden">
            <button
              :class="['flex-1 px-3 py-1.5 text-sm transition-colors', messageStep.messageMode === 'directive' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted']"
              @click="patch({ messageMode: 'directive' } as any)"
            >AI Directive</button>
            <button
              :class="['flex-1 px-3 py-1.5 text-sm transition-colors border-l', messageStep.messageMode === 'template' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted']"
              @click="patch({ messageMode: 'template' } as any)"
            >Template</button>
          </div>
        </div>
        <div>
          <Label>Channel</Label>
          <Select :model-value="messageStep.channel" @update:model-value="patch({ channel: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ota">OTA Inbox</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="messageStep.channel === 'whatsapp'" class="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
            <Icon name="i-lucide-triangle-alert" class="h-3 w-3" />
            Requires WhatsApp Business API
          </p>
        </div>
        <div v-if="messageStep.messageMode === 'directive'">
          <div class="flex items-center gap-2 mb-1">
            <Label>Smart Directive</Label>
            <span class="text-xs font-medium px-1.5 py-0.5 rounded" :style="{ backgroundColor: '#C8A84B22', color: '#C8A84B' }">HostBuddy AI</span>
          </div>
          <Textarea
            :model-value="messageStep.directive"
            class="min-h-24 text-sm"
            placeholder="Describe what HostBuddy should say…"
            @update:model-value="patch({ directive: $event as string } as any)"
          />
        </div>
        <div v-else>
          <Label>Message Template</Label>
          <Textarea
            :model-value="messageStep.templateText"
            class="mt-1 min-h-24 text-sm"
            placeholder="Write the static message text…"
            @update:model-value="patch({ templateText: $event as string } as any)"
          />
        </div>
        <div class="flex flex-col gap-2 rounded-md border bg-muted/30 p-3">
          <div class="flex items-center justify-between">
            <Label class="cursor-pointer text-sm" for="ctx-check-toggle">AI Context Check</Label>
            <Switch
              :key="`ctx-${step.id}-${messageStep.contextCheckEnabled}`"
              id="ctx-check-toggle"
              :checked="messageStep.contextCheckEnabled"
              @update:checked="patch({ contextCheckEnabled: $event } as any)"
            />
          </div>
          <p class="text-xs text-muted-foreground">AI reads conversation history before sending to decide if the message is still relevant.</p>
          <Textarea
            v-if="messageStep.contextCheckEnabled"
            :model-value="messageStep.contextCheckInstruction"
            class="text-xs min-h-16"
            placeholder="e.g. Do not send if the guest has already been welcomed."
            @update:model-value="patch({ contextCheckInstruction: $event as string } as any)"
          />
        </div>
        <div>
          <Label>If HostBuddy is Off</Label>
          <Select :model-value="messageStep.fallback" @update:model-value="patch({ fallback: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Skip this step</SelectItem>
              <SelectItem value="static">Send static template</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="messageStep.fallback === 'static'">
          <Label>Fallback Message</Label>
          <Textarea
            :model-value="messageStep.fallbackText"
            class="mt-1 min-h-16 text-sm"
            placeholder="Static fallback text…"
            @update:model-value="patch({ fallbackText: $event as string } as any)"
          />
        </div>
      </div>

      <!-- Context Check (legacy) -->
      <div v-else-if="contextStep" class="flex flex-col gap-4">
        <div class="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Context Check is now built into Message steps. This step type is kept for compatibility.
        </div>
        <div>
          <Label>Condition</Label>
          <Textarea
            :model-value="contextStep.condition"
            class="mt-1 min-h-24 text-sm"
            placeholder="Describe the condition to check…"
            @update:model-value="patch({ condition: $event as string } as any)"
          />
        </div>
        <div>
          <Label>If Check Fails</Label>
          <Select :model-value="contextStep.onFail" @update:model-value="patch({ onFail: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="skip">Skip step</SelectItem>
              <SelectItem value="stop">Stop Journey</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Action -->
      <div v-else-if="actionStep" class="flex flex-col gap-4">
        <div>
          <Label>Action Type</Label>
          <Select :model-value="actionStep.actionType" @update:model-value="patch({ actionType: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raise_action_item">Raise Action Item</SelectItem>
              <SelectItem value="create_task">Create Task</SelectItem>
              <SelectItem value="flag_reservation">Flag Reservation</SelectItem>
              <SelectItem value="staff_alert">Staff Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Details</Label>
          <Textarea
            :model-value="actionStep.details"
            class="mt-1 min-h-20 text-sm"
            placeholder="Describe the action details…"
            @update:model-value="patch({ details: $event as string } as any)"
          />
        </div>
      </div>

      <!-- If/Else -->
      <div v-else-if="ifElseStep" class="flex flex-col gap-4">
        <div>
          <Label>Condition Type</Label>
          <Select :model-value="ifElseStep.conditionType" @update:model-value="patch({ conditionType: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in conditionTypes" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Condition Details</Label>
          <Textarea
            :model-value="ifElseStep.conditionDetails"
            class="mt-1 min-h-20 text-sm"
            placeholder="Describe the condition…"
            @update:model-value="patch({ conditionDetails: $event as string } as any)"
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <Label class="text-xs text-green-600">True Branch</Label>
            <Input
              :model-value="ifElseStep.trueBranchLabel"
              class="mt-1 text-sm"
              placeholder="Condition met"
              @update:model-value="patch({ trueBranchLabel: $event as string } as any)"
            />
          </div>
          <div>
            <Label class="text-xs text-red-500">False Branch</Label>
            <Input
              :model-value="ifElseStep.falseBranchLabel"
              class="mt-1 text-sm"
              placeholder="Condition not met"
              @update:model-value="patch({ falseBranchLabel: $event as string } as any)"
            />
          </div>
        </div>
      </div>

      <!-- Hard Requirement -->
      <div v-else-if="hardReqStep" class="flex flex-col gap-4">
        <p class="text-xs text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
          A gate that stops the Journey for guests who do not meet the condition.
        </p>
        <div>
          <Label>Condition Type</Label>
          <Select :model-value="hardReqStep.conditionType" @update:model-value="patch({ conditionType: $event } as any)">
            <SelectTrigger class="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in conditionTypes" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Requirement</Label>
          <Textarea
            :model-value="hardReqStep.conditionDetails"
            class="mt-1 min-h-20 text-sm"
            placeholder="e.g. Only if guest sentiment is Positive or Neutral."
            @update:model-value="patch({ conditionDetails: $event as string } as any)"
          />
        </div>
      </div>

      <!-- Create Note -->
      <div v-else-if="noteStep" class="flex flex-col gap-4">
        <div>
          <Label>Note Content</Label>
          <Textarea
            :model-value="noteStep.noteContent"
            class="mt-1 min-h-24 text-sm"
            placeholder="Internal note to add to the reservation…"
            @update:model-value="patch({ noteContent: $event as string } as any)"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <Label class="cursor-pointer" for="ai-visible-toggle">Visible to AI</Label>
            <p class="text-xs text-muted-foreground mt-0.5">Allow HostBuddy to read this note for future context.</p>
          </div>
          <Switch
            :key="`note-${step.id}-${noteStep.visibleToAI}`"
            id="ai-visible-toggle"
            :checked="noteStep.visibleToAI"
            @update:checked="patch({ visibleToAI: $event } as any)"
          />
        </div>
      </div>

      <!-- Toggle AI -->
      <div v-else-if="toggleAIStep" class="flex flex-col gap-4">
        <p class="text-xs text-muted-foreground rounded-md border bg-muted/40 px-3 py-2">
          Automatically turns HostBuddy AI responses on or off for this guest or property.
        </p>
        <div class="flex items-center justify-between">
          <Label class="cursor-pointer" for="toggle-ai-enable">Enable AI Responses</Label>
          <Switch
            :key="`toggleai-${step.id}-${toggleAIStep.enable}`"
            id="toggle-ai-enable"
            :checked="toggleAIStep.enable"
            @update:checked="patch({ enable: $event } as any)"
          />
        </div>
        <p class="text-xs text-muted-foreground">
          Currently set to: <strong>{{ toggleAIStep.enable ? 'Enable' : 'Disable' }}</strong> AI for this guest.
        </p>
      </div>

      <!-- Integration -->
      <div v-else-if="integrationStep" class="flex flex-col gap-4">
        <div>
          <Label>Integration</Label>
          <Input
            :model-value="integrationStep.integrationName"
            class="mt-1"
            placeholder="e.g. Turno, Minut, Custom API…"
            @update:model-value="patch({ integrationName: $event as string } as any)"
          />
        </div>
        <div>
          <Label>Payload / Action</Label>
          <Textarea
            :model-value="integrationStep.payload"
            class="mt-1 min-h-20 text-sm"
            placeholder="Describe the outbound action or payload…"
            @update:model-value="patch({ payload: $event as string } as any)"
          />
        </div>
      </div>

      <!-- End Journey -->
      <div v-else-if="isEndJourney" class="flex flex-col gap-3">
        <div class="flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-3">
          <Icon name="i-lucide-flag" class="h-5 w-5 shrink-0 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">
            This step formally terminates the Journey for the current guest. No further steps will execute after this point.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
