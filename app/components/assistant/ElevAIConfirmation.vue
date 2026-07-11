<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  description?: string
  // What action will be performed
  actionLabel?: string
  // Optional details about the proposed action
  details?: Array<{ label: string, value: string }>
}>()

const emit = defineEmits<{
  approve: []
  reject: []
}>()

const state = ref<'pending' | 'approved' | 'rejected'>('pending')

function approve() {
  state.value = 'approved'
  emit('approve')
}

function reject() {
  state.value = 'rejected'
  emit('reject')
}
</script>

<template>
  <Alert
    v-if="state === 'pending'"
    class="ml-2 mt-1 max-w-[90%] flex flex-col gap-2 border-amber-500/30 bg-amber-500/5"
    data-testid="elev-ai-confirmation"
  >
    <div class="flex items-start gap-2">
      <Icon name="lucide:shield-alert" class="size-4 text-amber-600 mt-0.5 shrink-0" />
      <div class="flex-1 min-w-0">
        <AlertTitle class="text-xs font-semibold text-amber-700 dark:text-amber-400">
          {{ title }}
        </AlertTitle>
        <AlertDescription v-if="description" class="text-xs text-muted-foreground mt-1">
          {{ description }}
        </AlertDescription>
      </div>
    </div>
    <dl v-if="details && details.length" class="text-xs space-y-0.5 pl-6">
      <div v-for="d in details" :key="d.label" class="flex gap-2">
        <dt class="text-muted-foreground">{{ d.label }}:</dt>
        <dd class="font-mono">{{ d.value }}</dd>
      </div>
    </dl>
    <div class="flex gap-2 pl-6">
      <Button size="sm" variant="default" class="h-7 text-xs" @click="approve">
        <Icon name="lucide:check" class="size-3 mr-1" />
        {{ actionLabel ?? 'Approve' }}
      </Button>
      <Button size="sm" variant="outline" class="h-7 text-xs" @click="reject">
        <Icon name="lucide:x" class="size-3 mr-1" />
        Reject
      </Button>
    </div>
  </Alert>

  <Alert
    v-else-if="state === 'approved'"
    class="ml-2 mt-1 max-w-[90%] flex items-center gap-2 border-green-500/30 bg-green-500/5"
    data-testid="elev-ai-confirmation-approved"
  >
    <Icon name="lucide:check-circle-2" class="size-4 text-green-600 shrink-0" />
    <AlertDescription class="text-xs text-green-700 dark:text-green-400">
      {{ actionLabel ?? 'Action' }} approved. (Mock — no real write performed in v1.)
    </AlertDescription>
  </Alert>

  <Alert
    v-else
    class="ml-2 mt-1 max-w-[90%] flex items-center gap-2 border-zinc-500/30 bg-zinc-500/5"
    data-testid="elev-ai-confirmation-rejected"
  >
    <Icon name="lucide:x-circle" class="size-4 text-zinc-600 shrink-0" />
    <AlertDescription class="text-xs text-muted-foreground">
      Rejected. The action was not performed.
    </AlertDescription>
  </Alert>
</template>