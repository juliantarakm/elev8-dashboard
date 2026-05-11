<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const apiKeyInput = ref('')
const isSaving = ref(false)

async function handleConnect() {
  if (!apiKeyInput.value.trim()) {
    toast.error('API key cannot be empty.')
    return
  }
  isSaving.value = true
  await new Promise(r => setTimeout(r, 1200))
  isSaving.value = false
  toast.success('Connected to bexio.')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="rounded-lg border bg-card p-5">
      <p class="mb-1 text-sm font-medium">Connect bexio</p>
      <p class="mb-4 text-sm text-muted-foreground">
        Enter your bexio API key to sync financial data. Found in bexio → Settings → API.
      </p>
      <div class="flex flex-col gap-3">
        <Input
          v-model="apiKeyInput"
          type="password"
          placeholder="bexio API key…"
          class="font-mono"
          @keydown.enter="handleConnect"
        />
        <Button size="sm" :disabled="isSaving" class="self-start" @click="handleConnect">
          <Icon v-if="isSaving" name="i-lucide-loader-2" class="mr-2 h-3.5 w-3.5 animate-spin" />
          {{ isSaving ? 'Connecting…' : 'Connect bexio' }}
        </Button>
      </div>
    </div>
  </div>
</template>
