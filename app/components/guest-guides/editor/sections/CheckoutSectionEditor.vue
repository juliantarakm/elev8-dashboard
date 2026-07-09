<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { listings } from '~/components/listings/data/listings'

const props = defineProps<{ modelValue: Record<string, any> }>()
const emit = defineEmits<{ 'update:modelValue': [v: Record<string, any>] }>()

function update(patch: Record<string, any>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

const assignedListingIds = inject<Ref<string[]>>('assignedListingIds', ref([]))

const assignedListings = computed(() =>
  listings.value.filter(l => assignedListingIds.value.includes(l.id)),
)

const defaultTime = computed(() =>
  assignedListings.value.length === 1
    ? (assignedListings.value[0].resources?.basics?.checkOutTime ?? null)
    : null,
)
const defaultInstructions = computed(() =>
  assignedListings.value.length === 1
    ? (assignedListings.value[0].checkOutInstructions ?? null)
    : null,
)
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
      v-else-if="assignedListings.length === 1"
      class="space-y-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
    >
      <div>
        Default from listing "<strong>{{ assignedListings[0].name }}</strong>" — override below if needed.
      </div>
      <div v-if="defaultTime" class="font-mono text-foreground">
        Time: {{ defaultTime }}
      </div>
      <div v-if="defaultInstructions" class="text-foreground">
        Instructions: {{ defaultInstructions }}
      </div>
    </div>
    <div
      v-else
      class="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground"
    >
      Defaults vary across {{ assignedListings.length }} listings. Use per-listing overrides (coming soon).
    </div>

    <div>
      <Label>Check-out time</Label>
      <Input
        type="time"
        :model-value="modelValue.time ?? ''"
        placeholder="Leave blank to use listing default"
        @update:model-value="update({ time: $event })"
      />
    </div>
    <div>
      <Label>Instructions</Label>
      <Textarea
        :model-value="modelValue.instructions ?? ''"
        rows="4"
        placeholder="Leave blank to use listing default"
        @update:model-value="update({ instructions: $event })"
      />
    </div>
  </div>
</template>
