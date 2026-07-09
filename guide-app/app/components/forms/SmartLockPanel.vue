<script setup lang="ts">
const props = defineProps<{
  token: string
}>()

const { logLockView } = usePublicGuestGuide()

// TODO: integrate with useSmartLock via API.
// Phase 1 shows a placeholder code; Phase 5 wires the real provider.
const DEMO_CODE = '482915'

const copied = ref(false)

onMounted(() => {
  if (props.token) {
    logLockView(props.token).catch(() => {
      // best-effort — endpoint may not exist yet
    })
  }
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(DEMO_CODE)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // noop
  }
}
</script>

<template>
  <div class="rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-6">
    <div class="mb-2 flex items-center gap-2">
      <Icon name="lucide:key-round" class="size-5 text-primary" />
      <h3 class="text-base font-semibold">
        Your door code
      </h3>
    </div>
    <p class="mb-4 text-xs text-muted-foreground">
      This code is active from 24 hours before check-in until check-out.
    </p>

    <div class="flex items-center gap-3">
      <code
        data-testid="smart-lock-code"
        class="flex-1 rounded-md bg-background px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.4em]"
      >
        {{ DEMO_CODE }}
      </code>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        @click="copyCode"
      >
        <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="size-4" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>

    <p class="mt-3 text-xs text-muted-foreground">
      Real provider integration arrives in Phase 5. This is a placeholder.
    </p>
  </div>
</template>