<script setup lang="ts">
defineProps<{
  data: {
    ssid?: string
    password?: string
    networkNotes?: string
    showPassword?: boolean
  }
}>()

const { translate } = useAutoTranslate()
const showPw = ref(false)

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // noop
  }
}
</script>

<template>
  <section class="rounded-xl border bg-card p-6">
    <div class="mb-3 flex items-center gap-3">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="lucide:wifi" class="size-5" />
      </div>
      <h2 class="text-xl font-semibold">
        {{ translate('Wi-Fi') }}
      </h2>
    </div>

    <div class="space-y-3">
      <div class="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
        <div>
          <div class="text-xs text-muted-foreground">
            {{ translate('Network') }}
          </div>
          <div class="font-mono text-sm font-medium">
            {{ data.ssid ?? '—' }}
          </div>
        </div>
        <button
          type="button"
          class="ml-2 rounded-md p-1.5 hover:bg-muted"
          :aria-label="translate('Copy network name')"
          @click="copy(data.ssid ?? '')"
        >
          <Icon name="lucide:copy" class="size-4" />
        </button>
      </div>

      <div class="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
        <div class="min-w-0 flex-1">
          <div class="text-xs text-muted-foreground">
            {{ translate('Password') }}
          </div>
          <div class="truncate font-mono text-sm font-medium">
            {{ showPw ? (data.password ?? '—') : '••••••••' }}
          </div>
        </div>
        <div class="ml-2 flex items-center gap-1">
          <button
            type="button"
            class="rounded-md p-1.5 hover:bg-muted"
            :aria-label="translate('Toggle password visibility')"
            @click="showPw = !showPw"
          >
            <Icon :name="showPw ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
          </button>
          <button
            type="button"
            class="rounded-md p-1.5 hover:bg-muted"
            :aria-label="translate('Copy password')"
            @click="copy(data.password ?? '')"
          >
            <Icon name="lucide:copy" class="size-4" />
          </button>
        </div>
      </div>

      <p v-if="data.networkNotes" class="text-xs text-muted-foreground">
        {{ translate(data.networkNotes) }}
      </p>
    </div>
  </section>
</template>