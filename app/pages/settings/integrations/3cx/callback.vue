<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'

const threeCX = useThreeCX()
const status = ref<'pending' | 'success' | 'error'>('pending')
const errorMessage = ref('')

onMounted(async () => {
  if (!import.meta.client)
    return

  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const fqdn = sessionStorage.getItem('threecx-oauth-pending') ?? ''

  if (!code || !fqdn) {
    status.value = 'error'
    errorMessage.value = 'Missing authorization code or PBX FQDN. Please try connecting again.'
    return
  }

  const result = await threeCX.completeOAuthCallback(code, fqdn)
  sessionStorage.removeItem('threecx-oauth-pending')

  if (result.success) {
    status.value = 'success'
    toast.success(`Connected to ${fqdn}.`)
    setTimeout(() => {
      window.location.href = '/settings/integrations'
    }, 800)
  }
  else {
    status.value = 'error'
    errorMessage.value = result.error
  }
})
</script>

<template>
  <SettingsLayout>
    <div class="flex min-h-[60vh] items-center justify-center">
      <div class="rounded-lg border bg-card p-8 text-center max-w-md w-full">
        <div v-if="status === 'pending'" class="space-y-4">
          <Icon name="lucide:loader-circle" class="size-10 mx-auto animate-spin text-muted-foreground" />
          <h2 class="text-lg font-semibold">Completing 3CX connection…</h2>
          <p class="text-sm text-muted-foreground">Validating your authorization and registering webhooks.</p>
        </div>

        <div v-else-if="status === 'success'" class="space-y-4">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Icon name="lucide:check" class="size-6 text-green-600" />
          </div>
          <h2 class="text-lg font-semibold">Connected</h2>
          <p class="text-sm text-muted-foreground">Redirecting to integrations…</p>
        </div>

        <div v-else class="space-y-4">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <Icon name="lucide:alert-circle" class="size-6 text-destructive" />
          </div>
          <h2 class="text-lg font-semibold">Connection failed</h2>
          <p class="text-sm text-muted-foreground">{{ errorMessage }}</p>
          <NuxtLink to="/settings/integrations" class="inline-block">
            <Button variant="outline" size="sm">Back to integrations</Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </SettingsLayout>
</template>
