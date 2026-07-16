<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
  description?: string
  actionLabel?: string
  details?: Array<{ label: string, value: string }>
}>()

const emit = defineEmits<{
  approve: []
  reject: []
}>()

// Local state machine — mapped onto ai-elements Confirmation's expected
// shape (state + approval). Keeps the ai-elements primitives happy without
// pulling in the AI SDK's ToolUIPart types (we're mock-only in v1).
type State =
  | 'approval-requested'
  | 'approval-responded'
  | 'output-denied'

const state = ref<State>('approval-requested')

// approval mimics AI SDK's ToolUIPartApproval — must always include id.
// When approval-requested, approved is undefined (no decision yet).
// When responded, approved is set per the user's choice.
const approval = computed(() => ({
  id: 'confirmation-1',
  approved: state.value === 'approval-responded' ? true
    : state.value === 'output-denied' ? false
    : undefined,
} as { id: string, approved?: boolean }))

function approve() {
  state.value = 'approval-responded'
  emit('approve')
}

function reject() {
  state.value = 'output-denied'
  emit('reject')
}
</script>

<template>
  <Confirmation
    :state="state"
    :approval="approval"
    class="ml-2 mt-1 max-w-[90%]"
    data-testid="elev-ai-confirmation"
  >
    <ConfirmationRequest>
      <div class="flex items-start gap-2">
        <Icon name="lucide:shield-alert" class="size-4 text-amber-600 mt-0.5 shrink-0" />
        <div class="flex-1 min-w-0">
          <ConfirmationTitle class="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {{ title }}
          </ConfirmationTitle>
          <p v-if="description" class="text-xs text-muted-foreground mt-1">
            {{ description }}
          </p>
        </div>
      </div>

      <dl v-if="details && details.length" class="text-xs space-y-0.5 pl-6 mt-2">
        <div v-for="d in details" :key="d.label" class="flex gap-2">
          <dt class="text-muted-foreground">{{ d.label }}:</dt>
          <dd class="font-mono">{{ d.value }}</dd>
        </div>
      </dl>

      <ConfirmationActions class="flex gap-2 pl-6 mt-2">
        <ConfirmationAction type="button" @click="approve">
          <Icon name="lucide:check" class="size-3 mr-1" />
          {{ actionLabel ?? 'Approve' }}
        </ConfirmationAction>
        <ConfirmationAction type="button" variant="outline" @click="reject">
          <Icon name="lucide:x" class="size-3 mr-1" />
          Reject
        </ConfirmationAction>
      </ConfirmationActions>
    </ConfirmationRequest>

    <ConfirmationAccepted>
      <div class="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
        <Icon name="lucide:check-circle-2" class="size-4 text-green-600 shrink-0" />
        <span>{{ actionLabel ?? 'Action' }} approved. (Mock — no real write performed in v1.)</span>
      </div>
    </ConfirmationAccepted>

    <ConfirmationRejected>
      <div class="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon name="lucide:x-circle" class="size-4 text-zinc-600 shrink-0" />
        <span>Rejected. The action was not performed.</span>
      </div>
    </ConfirmationRejected>
  </Confirmation>
</template>