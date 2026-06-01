<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

const { connection, isConnected, connect, disconnect } = useWhatsApp()

const disconnectOpen = ref(false)

function handleConnect() {
  // Simulates the Meta Embedded Signup popup flow.
  toast.info('Opening Meta Embedded Signup…')
  setTimeout(() => {
    connect()
    toast.success('WhatsApp Business connected.')
  }, 800)
}

function handleDisconnect() {
  disconnect()
  disconnectOpen.value = false
  toast.info('WhatsApp Business disconnected.')
}

function handleTestSend() {
  toast.success('Test message sent to your number.')
}
</script>

<template>
  <div class="rounded-lg border bg-card p-5">
    <div class="mb-4 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-md bg-green-50 dark:bg-green-950">
          <Icon name="i-lucide-message-circle" class="h-5 w-5 text-green-600" />
        </div>
        <p class="text-sm font-semibold">
          WhatsApp Business
        </p>
      </div>
      <span
        class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
        :class="isConnected ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="isConnected ? 'bg-green-500' : 'bg-red-500'" />
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </span>
    </div>

    <!-- Disconnected state -->
    <template v-if="!isConnected">
      <p class="mb-4 text-sm text-muted-foreground leading-relaxed">
        Connect your WhatsApp Business number to send and receive guest messages directly through Elev8.
      </p>
      <Button class="gap-2" @click="handleConnect">
        Connect WhatsApp
        <Icon name="i-lucide-arrow-right" class="h-4 w-4" />
      </Button>
      <div class="mt-4 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        <Icon name="i-lucide-info" class="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>You'll need a WhatsApp Business Account. Meta will charge you directly for conversations.</span>
      </div>
    </template>

    <!-- Connected state -->
    <template v-else>
      <dl class="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
        <dt class="text-muted-foreground">
          Phone Number
        </dt>
        <dd class="font-medium">
          {{ connection.phoneNumber }}
        </dd>
        <dt class="text-muted-foreground">
          Business Name
        </dt>
        <dd class="font-medium">
          {{ connection.businessName }}
        </dd>
        <dt class="text-muted-foreground">
          Connected
        </dt>
        <dd class="font-medium">
          {{ connection.connectedAt }}
        </dd>
        <dt class="text-muted-foreground">
          Status
        </dt>
        <dd class="flex items-center gap-1.5 font-medium">
          <span class="h-1.5 w-1.5 rounded-full bg-green-500" />
          Active
        </dd>
      </dl>
      <div class="mt-5 flex gap-2">
        <Button variant="outline" size="sm" @click="disconnectOpen = true">
          Disconnect
        </Button>
        <Button variant="outline" size="sm" @click="handleTestSend">
          Test Send
        </Button>
      </div>
    </template>

    <!-- Disconnect confirmation -->
    <Dialog v-model:open="disconnectOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disconnect WhatsApp?</DialogTitle>
          <DialogDescription>This will:</DialogDescription>
        </DialogHeader>
        <ul class="space-y-1.5 text-sm text-muted-foreground">
          <li class="flex gap-2">
            <span>•</span> Stop all automated WhatsApp messages
          </li>
          <li class="flex gap-2">
            <span>•</span> Remove your connection credentials
          </li>
          <li class="flex gap-2">
            <span>•</span> Existing conversation history remains
          </li>
        </ul>
        <DialogFooter>
          <Button variant="outline" @click="disconnectOpen = false">
            Cancel
          </Button>
          <Button variant="destructive" @click="handleDisconnect">
            Yes, Disconnect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
