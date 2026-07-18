<script setup lang="ts">
import type { KeyBox } from './data/keys'
import { computed, ref } from 'vue'
import { listings } from '~/components/listings/data/listings'
import { useKeyManagement } from '~/composables/useKeyManagement'

const { keyBox } = defineProps<{
  keyBox: KeyBox
}>()

const emit = defineEmits<{
  edit: [keyBox: KeyBox]
  remove: [keyBox: KeyBox]
  viewKeys: [keyBox: KeyBox]
}>()

const { getKeysInBox } = useKeyManagement()

const showPin = ref(false)

const storedKeys = computed(() => getKeysInBox(keyBox.id))
const listingName = computed(() =>
  listings.value.find(l => l.id === keyBox.listingId)?.name ?? keyBox.listingId,
)
const maskedPin = computed(() => '•'.repeat(keyBox.pin.length))
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <CardTitle class="text-base">
            {{ keyBox.name }}
          </CardTitle>
          <CardDescription class="line-clamp-1">
            {{ listingName }}
          </CardDescription>
        </div>
        <Badge variant="secondary">
          {{ storedKeys.length }} {{ storedKeys.length === 1 ? 'key' : 'keys' }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="space-y-2 text-sm">
      <div class="flex items-start gap-2">
        <Icon name="lucide:map-pin" class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>{{ keyBox.location }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Icon name="lucide:lock" class="size-4 shrink-0 text-muted-foreground" />
        <span class="font-mono">{{ showPin ? keyBox.pin : maskedPin }}</span>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click="showPin = !showPin">
          <Icon :name="showPin ? 'lucide:eye-off' : 'lucide:eye'" class="size-3.5" />
        </Button>
      </div>
      <p v-if="keyBox.notes" class="text-muted-foreground">
        {{ keyBox.notes }}
      </p>
    </CardContent>
    <CardFooter class="gap-2">
      <Button variant="outline" size="sm" class="gap-1.5" @click="emit('viewKeys', keyBox)">
        <Icon name="lucide:key-round" class="size-3.5" /> View keys
      </Button>
      <Button variant="outline" size="sm" class="gap-1.5" @click="emit('edit', keyBox)">
        <Icon name="lucide:pencil" class="size-3.5" /> Edit
      </Button>
      <Button variant="ghost" size="sm" class="gap-1.5 text-destructive hover:text-destructive" @click="emit('remove', keyBox)">
        <Icon name="lucide:trash-2" class="size-3.5" /> Remove
      </Button>
    </CardFooter>
  </Card>
</template>
