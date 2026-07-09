<script setup lang="ts">
const props = defineProps<{
  data: {
    ssid?: string
    password?: string
    networkNotes?: string
    showPassword?: boolean
  }
  listing?: {
    wifiSsid?: string
    wifiPassword?: string
  }
  token?: string
}>()

const ssid = computed(() => props.data?.ssid ?? props.listing?.wifiSsid ?? null)
const password = computed(() => props.data?.password ?? props.listing?.wifiPassword ?? null)
const networkNotes = computed(() => props.data?.networkNotes ?? null)
const hasWifi = computed(() => Boolean(ssid.value && password.value))

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

    <div v-if="hasWifi" class="space-y-3">
      <div class="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2">
        <div>
          <div class="text-xs text-muted-foreground">
            {{ translate('Network') }}
          </div>
          <div class="font-mono text-sm font-medium">
            {{ ssid }}
          </div>
        </div>
        <button
          type="button"
          class="ml-2 rounded-md p-1.5 hover:bg-muted"
          :aria-label="translate('Copy network name')"
          @click="copy(ssid ?? '')"
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
            {{ showPw ? password : '••••••••' }}
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
            @click="copy(password ?? '')"
          >
            <Icon name="lucide:copy" class="size-4" />
          </button>
        </div>
      </div>

      <p v-if="networkNotes" class="text-xs text-muted-foreground">
        {{ translate(networkNotes) }}
      </p>
    </div>
    <p v-else class="text-sm text-muted-foreground">
      {{ translate('Wi-Fi info coming soon.') }}
    </p>
  </section>
</template>