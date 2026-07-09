<script setup lang="ts">
import type { SmartLock } from '~/composables/useSmartLock'
import { useSmartLock } from '~/composables/useSmartLock'

interface Props {
  lock: SmartLock
  unitName: string
  unlocking: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  rename: [lockId: string, currentName: string]
  unpair: [lockId: string, name: string]
  'set-main': [lockId: string]
  swap: [lockId: string]
  unlock: [lockId: string]
}>()

const smartLock = useSmartLock()
const renameLockId = ref<string | null>(null)
const renameValue = ref('')

const provider = computed(() => {
  const device = smartLock.allDevices.value.find(d => d.deviceId === props.lock.providerDeviceId)
  if (!device) return null
  return { name: device.provider.charAt(0).toUpperCase() + device.provider.slice(1), model: device.model }
})

function startRename() {
  renameLockId.value = props.lock.id
  renameValue.value = props.lock.name
}

function commitRename() {
  if (!renameLockId.value || !renameValue.value.trim()) {
    renameLockId.value = null
    return
  }
  emit('rename', props.lock.id, renameValue.value.trim())
  renameLockId.value = null
}
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border p-3">
    <div
      class="flex size-9 shrink-0 items-center justify-center rounded-md border"
      :class="lock.online ? 'bg-green-500/10' : 'bg-muted'"
    >
      <Icon
        :name="lock.online ? 'lucide:lock' : 'lucide:lock-open'"
        class="size-4"
        :class="lock.online ? 'text-green-600' : 'text-muted-foreground'"
      />
    </div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <input
          v-if="renameLockId === lock.id"
          v-model="renameValue"
          class="text-sm font-medium bg-transparent border-b border-primary outline-none"
          @keydown.enter="commitRename"
          @keydown.esc="renameLockId = null"
          @blur="commitRename"
        >
        <p v-else class="truncate text-sm font-medium">
          {{ lock.name }}
        </p>
        <span
          v-if="provider"
          class="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
          :title="provider.model"
        >
          {{ provider.name }}
        </span>
        <Badge v-if="lock.isMain" variant="default" class="text-[9px] px-1 py-0">
          Main
        </Badge>
        <span
          v-if="!lock.isMain"
          class="cursor-pointer text-muted-foreground hover:text-foreground"
          title="Set as main"
          @click="emit('set-main', lock.id)"
        >
          <Icon name="lucide:star" class="size-3" />
        </span>
      </div>
      <div class="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span class="inline-flex items-center gap-0.5">
          <Icon name="lucide:battery" class="size-3" :class="lock.batteryLevel <= 20 ? 'text-amber-500' : 'text-muted-foreground'" />
          {{ lock.batteryLevel }}%
        </span>
        <span>·</span>
        <span>{{ lock.assignment === 'room' ? (unitName || 'Room') : 'Property' }}</span>
      </div>
    </div>
    <Button
      variant="ghost"
      size="sm"
      class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
      title="Rename"
      @click="startRename"
    >
      <Icon name="lucide:pencil" class="size-3.5" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
      title="Swap device"
      @click="emit('swap', lock.id)"
    >
      <Icon name="lucide:refresh-cw" class="size-3.5" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      class="h-7 w-7 p-0 text-muted-foreground hover:text-green-600"
      :title="lock.online ? 'Unlock' : 'Lock is offline'"
      :disabled="!lock.online || unlocking"
      @click="emit('unlock', lock.id)"
    >
      <Icon
        v-if="unlocking"
        name="lucide:loader-2"
        class="size-3.5 animate-spin"
      />
      <Icon v-else name="lucide:lock-keyhole" class="size-3.5" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      title="Unpair"
      @click="emit('unpair', lock.id, lock.name)"
    >
      <Icon name="lucide:trash-2" class="size-3.5" />
    </Button>
  </div>
</template>
