<script setup lang="ts">
import type { Journey, JourneyStep, StepType, ConditionType } from './data/journeys'
import draggable from 'vuedraggable'

const props = defineProps<{
  initialJourney: Journey | null
}>()

const emit = defineEmits<{
  save: [journey: Journey]
  back: []
}>()

function makeDefaultJourney(): Journey {
  return {
    id: `j-${Date.now()}`,
    name: 'New Journey',
    status: 'draft',
    triggerType: 'booking_confirmed',
    lastModified: new Date().toISOString().split('T')[0],
    properties: ['All Properties'],
    steps: [
      {
        id: `s-${Date.now()}`,
        type: 'trigger',
        name: 'Booking Confirmed',
        triggerType: 'booking_confirmed',
        alternativeTriggers: [],
        properties: ['All Properties'],
      },
    ],
  }
}

const localJourney = ref<Journey>(
  props.initialJourney ? JSON.parse(JSON.stringify(props.initialJourney)) : makeDefaultJourney()
)

const selectedStepId = ref<string | null>(localJourney.value.steps[0]?.id ?? null)
const isEditingName = ref(false)
const nameInputRef = ref<HTMLInputElement | null>(null)

const isActive = computed({
  get: () => localJourney.value.status === 'active',
  set: (val) => {
    localJourney.value = { ...localJourney.value, status: val ? 'active' : 'inactive' }
  },
})

const selectedStep = computed(
  () => localJourney.value.steps.find(s => s.id === selectedStepId.value) ?? null
)

function startEditName() {
  isEditingName.value = true
  nextTick(() => nameInputRef.value?.focus())
}

function commitName(e: Event) {
  const val = (e.target as HTMLInputElement).value.trim()
  if (val) localJourney.value = { ...localJourney.value, name: val }
  isEditingName.value = false
}

function handleStepUpdate(updated: JourneyStep) {
  localJourney.value = {
    ...localJourney.value,
    steps: localJourney.value.steps.map(s => (s.id === updated.id ? updated : s)),
  }
}

function deleteStep(id: string) {
  if (localJourney.value.steps.length <= 1) return
  const remaining = localJourney.value.steps.filter(s => s.id !== id)
  localJourney.value = { ...localJourney.value, steps: remaining }
  if (selectedStepId.value === id) {
    selectedStepId.value = remaining[0]?.id ?? null
  }
}

function makeStep(type: StepType, id: string): JourneyStep {
  if (type === 'wait') return { id, type: 'wait', name: 'Wait', waitType: 'time', duration: 1, unit: 'days', relativeTo: null, waitTrigger: '' }
  if (type === 'message') return { id, type: 'message', name: 'Send Message', messageMode: 'directive', channel: 'ota', templateText: '', directive: '', contextCheckEnabled: false, contextCheckInstruction: '', fallback: 'skip', fallbackText: '' }
  if (type === 'context_check') return { id, type: 'context_check', name: 'Context Check', condition: '', onFail: 'skip' }
  if (type === 'if_else') return { id, type: 'if_else', name: 'If/Else Branch', conditionType: 'guest_sentiment' as ConditionType, conditionDetails: '', trueBranchLabel: 'Condition met', falseBranchLabel: 'Condition not met' }
  if (type === 'hard_requirement') return { id, type: 'hard_requirement', name: 'Hard Requirement', conditionType: 'reservation_status' as ConditionType, conditionDetails: '' }
  if (type === 'create_note') return { id, type: 'create_note', name: 'Create Note', noteContent: '', visibleToAI: true }
  if (type === 'toggle_ai') return { id, type: 'toggle_ai', name: 'Toggle AI', enable: true }
  if (type === 'integration') return { id, type: 'integration', name: 'Integration Action', integrationName: '', payload: '' }
  if (type === 'end_journey') return { id, type: 'end_journey', name: 'End Journey' }
  return { id, type: 'action', name: 'Action', actionType: 'raise_action_item', details: '' }
}

function addStep(type: StepType, insertAfterIndex?: number) {
  const id = `s-${Date.now()}`
  const newStep = makeStep(type, id)
  const steps = [...localJourney.value.steps]
  if (insertAfterIndex !== undefined) {
    steps.splice(insertAfterIndex + 1, 0, newStep)
  } else {
    steps.push(newStep)
  }
  localJourney.value = { ...localJourney.value, steps }
  selectedStepId.value = id
}

function onDragEnd() {
  localJourney.value = { ...localJourney.value, steps: [...localJourney.value.steps] }
}

function handleSave() {
  emit('save', localJourney.value)
}

const addStepMenuOpen = ref(false)

const addStepOptions: { type: StepType; icon: string; label: string; group: string }[] = [
  { type: 'wait', icon: 'i-lucide-clock', label: 'Wait for Time', group: 'Flow' },
  { type: 'message', icon: 'i-lucide-message-square', label: 'Send Message', group: 'Flow' },
  { type: 'if_else', icon: 'i-lucide-git-fork', label: 'If/Else Branch', group: 'Logic' },
  { type: 'hard_requirement', icon: 'i-lucide-shield', label: 'Hard Requirement', group: 'Logic' },
  { type: 'context_check', icon: 'i-lucide-git-branch', label: 'Context Check', group: 'Logic' },
  { type: 'action', icon: 'i-lucide-bolt', label: 'Raise Action Item', group: 'Actions' },
  { type: 'create_note', icon: 'i-lucide-file-pen-line', label: 'Create Note', group: 'Actions' },
  { type: 'toggle_ai', icon: 'i-lucide-bot', label: 'Toggle AI', group: 'Actions' },
  { type: 'integration', icon: 'i-lucide-plug', label: 'Integration Action', group: 'Actions' },
  { type: 'end_journey', icon: 'i-lucide-flag', label: 'End Journey', group: 'Actions' },
]

const addStepGroups = computed(() => {
  const groups: Record<string, typeof addStepOptions> = {}
  for (const opt of addStepOptions) {
    if (!groups[opt.group]) groups[opt.group] = []
    groups[opt.group].push(opt)
  }
  return groups
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <header class="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-3">
      <Button variant="ghost" size="icon" aria-label="Back" @click="emit('back')">
        <Icon name="i-lucide-arrow-left" class="h-4 w-4" />
      </Button>

      <div class="flex-1 min-w-0" @click="startEditName">
        <input
          v-if="isEditingName"
          ref="nameInputRef"
          :value="localJourney.name"
          class="text-lg font-semibold bg-transparent border-b border-primary outline-none w-full"
          @blur="commitName"
          @keydown.enter="commitName"
        />
        <h1
          v-else
          class="cursor-pointer text-lg font-semibold truncate hover:text-primary transition-colors"
        >
          {{ localJourney.name }}
        </h1>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <div class="flex items-center gap-2">
          <Switch :checked="isActive" @update:checked="isActive = $event" />
          <span class="text-sm text-muted-foreground">{{ isActive ? 'Active' : 'Inactive' }}</span>
        </div>
        <Button @click="handleSave">Save Journey</Button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <div class="flex flex-1 flex-col overflow-y-auto p-4">
        <div class="mx-auto w-full max-w-xl">
          <draggable
            :list="localJourney.steps"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-40"
            animation="150"
            @end="onDragEnd"
          >
            <template #item="{ element: step, index }">
              <div>
                <JourneysJourneyStepCard
                  :step="step"
                  :active="selectedStepId === step.id"
                  @select="selectedStepId = step.id"
                  @delete="deleteStep(step.id)"
                />

                <!-- insert zone between steps -->
                <div v-if="index < localJourney.steps.length - 1" class="group/insert relative flex h-7 justify-center">
                  <div class="relative flex w-8 items-center justify-center">
                    <div class="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full bg-border/60" />
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <button
                          class="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background opacity-0 shadow-sm transition-all group-hover/insert:opacity-100 hover:!border-primary hover:!bg-primary hover:!text-primary-foreground"
                          aria-label="Insert step here"
                        >
                          <Icon name="i-lucide-plus" class="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" class="w-52">
                        <template v-for="(opts, group) in addStepGroups" :key="group">
                          <DropdownMenuLabel class="text-xs text-muted-foreground">{{ group }}</DropdownMenuLabel>
                          <DropdownMenuItem v-for="opt in opts" :key="opt.type" @click="addStep(opt.type, index)">
                            <Icon :name="opt.icon" class="mr-2 h-4 w-4" />
                            {{ opt.label }}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </template>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </template>
          </draggable>

          <!-- connecting line before Add Step button -->
          <div class="flex h-6 justify-center">
            <div class="w-[2px] rounded-full bg-border/60" />
          </div>

          <DropdownMenu v-model:open="addStepMenuOpen">
            <DropdownMenuTrigger as-child>
              <Button variant="outline" class="w-full border-dashed text-muted-foreground">
                <Icon name="i-lucide-plus" class="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-52">
              <template v-for="(opts, group) in addStepGroups" :key="group">
                <DropdownMenuLabel class="text-xs text-muted-foreground">{{ group }}</DropdownMenuLabel>
                <DropdownMenuItem v-for="opt in opts" :key="opt.type" @click="addStep(opt.type)">
                  <Icon :name="opt.icon" class="mr-2 h-4 w-4" />
                  {{ opt.label }}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </template>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div class="w-80 shrink-0 border-l overflow-y-auto p-4">
        <JourneysJourneyStepSidebar
          :step="selectedStep"
          :journey-name="localJourney.name"
          @update="handleStepUpdate"
        />
      </div>
    </div>
  </div>
</template>
