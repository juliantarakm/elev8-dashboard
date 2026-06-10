<script setup lang="ts">
import type { CleaningJob, CleaningJobInput, CleaningJobPriority, CleaningJobRecurrence, CleaningJobSource, CleaningJobStatus } from '~/components/cleaning/data/cleaning-jobs'
import { cleanerOptions, cleaningJobPriorityLabels, cleaningJobSourceLabels, cleaningJobStatusLabels } from '~/components/cleaning/data/cleaning-jobs'
import { listings } from '~/components/listings/data/listings'

const props = withDefaults(defineProps<{
  modelValue?: Partial<CleaningJob> | null
  defaultListingId?: string | null
  defaultListingName?: string | null
}>(), {
  modelValue: null,
  defaultListingId: null,
  defaultListingName: null,
})

const emit = defineEmits<{
  save: [job: CleaningJobInput]
  cancel: []
}>()

const form = reactive<CleaningJobInput>({
  listingId: props.modelValue?.listingId ?? props.defaultListingId ?? '',
  listingName: props.modelValue?.listingName ?? props.defaultListingName ?? '',
  scheduledAt: props.modelValue?.scheduledAt ?? '',
  cleanerId: props.modelValue?.cleanerId ?? null,
  cleanerName: props.modelValue?.cleanerName ?? null,
  teamName: props.modelValue?.teamName ?? 'Housekeeping',
  status: (props.modelValue?.status ?? 'scheduled') as CleaningJobStatus,
  priority: (props.modelValue?.priority ?? 'normal') as CleaningJobPriority,
  durationMinutes: props.modelValue?.durationMinutes ?? 120,
  notes: props.modelValue?.notes ?? '',
  source: (props.modelValue?.source ?? 'manual') as CleaningJobSource,
  reservationId: props.modelValue?.reservationId ?? null,
  recurrence: props.modelValue?.recurrence ?? null,
})

const recurrenceEnabled = ref(Boolean(props.modelValue?.recurrence?.enabled))
const recurrenceFrequency = ref<CleaningJobRecurrence['frequency']>(props.modelValue?.recurrence?.frequency ?? 'weekly')
const recurrenceInterval = ref(props.modelValue?.recurrence?.interval ?? 1)

watch(() => form.listingId, (listingId) => {
  if (!listingId)
    return
  const listing = listings.value.find(item => item.id === listingId)
  if (listing) {
    form.listingName = listing.name
  }
}, { immediate: true })

watch(() => props.modelValue, (next) => {
  if (!next)
    return
  form.listingId = next.listingId ?? props.defaultListingId ?? ''
  form.listingName = next.listingName ?? props.defaultListingName ?? ''
  form.scheduledAt = next.scheduledAt ?? ''
  form.cleanerId = next.cleanerId ?? null
  form.cleanerName = next.cleanerName ?? null
  form.teamName = next.teamName ?? 'Housekeeping'
  form.status = (next.status ?? 'scheduled') as CleaningJobStatus
  form.priority = (next.priority ?? 'normal') as CleaningJobPriority
  form.durationMinutes = next.durationMinutes ?? 120
  form.notes = next.notes ?? ''
  form.source = (next.source ?? 'manual') as CleaningJobSource
  form.reservationId = next.reservationId ?? null
  recurrenceEnabled.value = Boolean(next.recurrence?.enabled)
  recurrenceFrequency.value = next.recurrence?.frequency ?? 'weekly'
  recurrenceInterval.value = next.recurrence?.interval ?? 1
}, { immediate: true })

const recurrenceModel = computed<CleaningJobRecurrence | null>(() => recurrenceEnabled.value
  ? {
      enabled: true,
      frequency: recurrenceFrequency.value,
      interval: recurrenceInterval.value,
    }
  : null)

function handleCleanerChange(value: string) {
  if (value === '__unassigned__') {
    form.cleanerId = null
    form.cleanerName = null
    form.teamName = 'Housekeeping'
    return
  }
  const cleaner = cleanerOptions.find(option => option.id === value)
  form.cleanerId = cleaner?.id ?? null
  form.cleanerName = cleaner?.name ?? null
  form.teamName = cleaner?.role ?? form.teamName
}

function submit() {
  emit('save', {
    ...form,
    recurrence: recurrenceModel.value,
  })
}
</script>

<template>
  <div class="grid gap-4">
    <div class="grid gap-1.5">
      <Label>Listing</Label>
      <Select v-model="form.listingId">
        <SelectTrigger>
          <SelectValue placeholder="Choose a listing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="listing in listings" :key="listing.id" :value="listing.id">
            {{ listing.name }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Input v-model="form.listingName" placeholder="Listing name" class="mt-2" />
    </div>

    <div class="grid gap-1.5 md:grid-cols-2">
      <div class="grid gap-1.5">
        <Label>Date & time</Label>
        <Input v-model="form.scheduledAt" type="datetime-local" />
      </div>
      <div class="grid gap-1.5">
        <Label>Duration (minutes)</Label>
        <Input v-model.number="form.durationMinutes" type="number" min="30" step="15" />
      </div>
    </div>

    <div class="grid gap-1.5 md:grid-cols-2">
      <div class="grid gap-1.5">
        <Label>Cleaner</Label>
        <Select :model-value="form.cleanerId ?? '__unassigned__'" @update:model-value="value => handleCleanerChange(String(value ?? '__unassigned__'))">
          <SelectTrigger>
            <SelectValue placeholder="Assign cleaner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unassigned__">
              Unassigned
            </SelectItem>
            <SelectItem v-for="cleaner in cleanerOptions" :key="cleaner.id" :value="cleaner.id">
              {{ cleaner.name }} · {{ cleaner.role }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label>Team</Label>
        <Input :model-value="form.teamName ?? ''" placeholder="Housekeeping" @update:model-value="value => { form.teamName = typeof value === 'string' ? value : '' }" />
      </div>
    </div>

    <div class="grid gap-1.5 md:grid-cols-3">
      <div class="grid gap-1.5">
        <Label>Status</Label>
        <Select :model-value="form.status" @update:model-value="value => { form.status = value as CleaningJobStatus }">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="([value, label]) in Object.entries(cleaningJobStatusLabels)" :key="value" :value="value">
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label>Priority</Label>
        <Select :model-value="form.priority" @update:model-value="value => { form.priority = value as CleaningJobPriority }">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="([value, label]) in Object.entries(cleaningJobPriorityLabels)" :key="value" :value="value">
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label>Source</Label>
        <Select :model-value="form.source" @update:model-value="value => { form.source = value as CleaningJobSource }">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem v-for="([value, label]) in Object.entries(cleaningJobSourceLabels)" :key="value" :value="value">
              {{ label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div class="grid gap-1.5">
      <Label>Notes</Label>
      <Textarea v-model="form.notes" rows="4" placeholder="Add special instructions or cleaning notes..." />
    </div>

    <div class="rounded-lg border bg-muted/30 p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-medium">
            Recurrence
          </p>
          <p class="text-xs text-muted-foreground">
            Repeat this cleaning on a weekly or monthly cadence.
          </p>
        </div>
        <Switch v-model:checked="recurrenceEnabled" />
      </div>
      <div v-if="recurrenceEnabled" class="mt-4 grid gap-3 md:grid-cols-2">
        <div class="grid gap-1.5">
          <Label>Frequency</Label>
          <Select :model-value="recurrenceFrequency" @update:model-value="value => { recurrenceFrequency = value as CleaningJobRecurrence['frequency'] }">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">
                Weekly
              </SelectItem>
              <SelectItem value="monthly">
                Monthly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1.5">
          <Label>Interval</Label>
          <Input v-model.number="recurrenceInterval" type="number" min="1" step="1" />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 pt-2">
      <Button variant="outline" @click="emit('cancel')">
        Cancel
      </Button>
      <Button @click="submit">
        Save Cleaning Job
      </Button>
    </div>
  </div>
</template>
