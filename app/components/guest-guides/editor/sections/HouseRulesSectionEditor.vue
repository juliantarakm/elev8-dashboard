<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Icon } from '#components'
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const rules = computed({
  get: () => (props.modelValue.rules ?? []) as string[],
  set: (v: string[]) => update({ rules: v }),
})

function add() {
  rules.value = [...rules.value, '']
}

function remove(idx: number) {
  rules.value = rules.value.filter((_, i) => i !== idx)
}

const assignedListingIds = inject<Ref<string[]>>('assignedListingIds', ref([]))

const assignedListings = computed(() =>
  listings.value.filter(l => assignedListingIds.value.includes(l.id)),
)

const singleListing = computed(() =>
  assignedListings.value.length === 1 ? assignedListings.value[0] : null,
)

const defaultRules = computed<string[]>(() => {
  const houseRules = singleListing.value?.resources?.basics?.houseRules
  if (!houseRules) return []
  return houseRules.split('\n').map(r => r.trim()).filter(Boolean)
})
</script>

<template>
  <div class="space-y-3">
    <div
      v-if="assignedListings.length === 0"
      class="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
    >
      Assign this guide to a listing first to see default values.
    </div>
    <div
      v-else-if="assignedListings.length === 1 && defaultRules.length > 0"
      class="space-y-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
    >
      <div>
        Default from listing "<strong>{{ singleListing?.name }}</strong>" — override below if needed.
      </div>
      <div class="text-foreground">
        {{ defaultRules.length }} rule{{ defaultRules.length === 1 ? '' : 's' }}: {{ defaultRules.join(' · ') }}
      </div>
    </div>
    <div
      v-else-if="assignedListings.length > 1"
      class="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
    >
      Defaults vary across {{ assignedListings.length }} listings. Use per-listing overrides (coming soon).
    </div>

    <div class="space-y-2">
      <div v-for="(_rule, idx) in rules" :key="idx" class="flex gap-2">
        <Input v-model="rules[idx]" placeholder="e.g. No smoking indoors" />
        <Button variant="ghost" size="sm" @click="remove(idx)">
          <Icon name="lucide:trash-2" class="size-4" />
        </Button>
      </div>
      <Button variant="outline" size="sm" @click="add">
        + Add rule
      </Button>
    </div>
  </div>
</template>
