<script setup lang="ts">
import type { KeyBox, PhysicalKey } from './data/keys'
import { computed } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'
import { getKeyDisplayName, keyTypeIcons, keyTypeLabels } from './data/keys'

const { open, keyBox } = defineProps<{
  open: boolean
  keyBox: KeyBox | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { getKeysInBox } = useKeyManagement()

const keys = computed<PhysicalKey[]>(() => keyBox ? getKeysInBox(keyBox.id) : [])
const listingName = computed(() =>
  keyBox ? listings.value.find(l => l.id === keyBox.listingId)?.name ?? keyBox.listingId : '',
)
</script>

<template>
  <Dialog :open="open" @update:open="(v: boolean) => emit('update:open', v)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ keyBox?.name }}</DialogTitle>
        <DialogDescription>
          {{ listingName }} · {{ keys.length }} {{ keys.length === 1 ? 'key' : 'keys' }} stored here
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <div
          v-for="keyItem in keys"
          :key="keyItem.id"
          class="flex items-center justify-between rounded-lg border p-3"
        >
          <div class="flex items-center gap-2">
            <Icon :name="keyTypeIcons[keyItem.type]" class="size-4 text-muted-foreground" />
            <div>
              <p class="text-sm font-medium">
                {{ getKeyDisplayName(keyItem) }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ keyTypeLabels[keyItem.type] }}
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            Available
          </Badge>
        </div>
        <p v-if="!keys.length" class="py-6 text-center text-sm text-muted-foreground">
          No keys stored in this key box.
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
