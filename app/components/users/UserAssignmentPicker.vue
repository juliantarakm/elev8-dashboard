<!-- app/components/users/UserAssignmentPicker.vue -->
<script setup lang="ts">
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { ScrollArea } from '~/components/ui/scroll-area'
import { listings } from '~/components/listings/data/listings'

interface Props {
  modelValue: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const open = ref(false)
const search = ref('')

const selected = computed(() => new Set(props.modelValue))

const filteredProperties = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return listings.value
  return listings.value.filter((p) =>
    p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q),
  )
})

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  emit('update:modelValue', Array.from(next))
}

function clearAll() {
  emit('update:modelValue', [])
  search.value = ''
}

function removeOne(id: string) {
  emit('update:modelValue', props.modelValue.filter(x => x !== id))
}

const selectedProperties = computed(() =>
  listings.value.filter(p => selected.value.has(p.id)),
)
</script>

<template>
  <div class="space-y-2">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button variant="outline" class="w-full justify-start font-normal">
          <Icon name="lucide:building" class="mr-2 size-4 text-muted-foreground" />
          <span v-if="modelValue.length === 0" class="text-muted-foreground">
            Select listings...
          </span>
          <span v-else class="text-sm">
            {{ modelValue.length }} listing{{ modelValue.length === 1 ? '' : 's' }} selected
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-80 p-0" align="start">
        <div class="border-b p-2">
          <Input
            v-model="search"
            placeholder="Search listings..."
            class="h-8"
          />
        </div>
        <ScrollArea class="h-64">
          <div class="p-1">
            <div
              v-for="p in filteredProperties"
              :key="p.id"
              class="flex items-center gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-muted"
              @click="toggle(p.id)"
            >
              <div
                class="flex size-4 items-center justify-center rounded-[4px] border"
                :class="selected.has(p.id)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input'"
              >
                <Icon v-if="selected.has(p.id)" name="lucide:check" class="size-3" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm truncate">
                  {{ p.name }}
                </div>
                <div class="text-xs text-muted-foreground truncate">
                  {{ p.location }}
                </div>
              </div>
            </div>
            <div v-if="filteredProperties.length === 0" class="p-4 text-center text-sm text-muted-foreground">
              No listings match "{{ search }}"
            </div>
          </div>
        </ScrollArea>
        <div class="border-t p-2 flex justify-between">
          <span class="text-xs text-muted-foreground self-center">
            {{ modelValue.length }} selected
          </span>
          <Button variant="ghost" size="sm" :disabled="modelValue.length === 0" @click="clearAll">
            Clear all
          </Button>
        </div>
      </PopoverContent>
    </Popover>

    <div v-if="selectedProperties.length > 0" class="flex flex-wrap gap-1">
      <Badge
        v-for="p in selectedProperties.slice(0, 4)"
        :key="p.id"
        variant="secondary"
        class="gap-1"
      >
        {{ p.name }}
        <button
          type="button"
          class="ml-1 rounded-full hover:bg-muted-foreground/20"
          @click.stop="removeOne(p.id)"
        >
          <Icon name="lucide:x" class="size-3" />
        </button>
      </Badge>
      <Badge v-if="selectedProperties.length > 4" variant="outline">
        +{{ selectedProperties.length - 4 }} more
      </Badge>
    </div>
  </div>
</template>