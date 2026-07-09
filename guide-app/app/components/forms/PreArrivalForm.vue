<script setup lang="ts">
const props = defineProps<{
  token: string
  fields?: string[]
}>()

const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl

const arrivalTime = ref('')
const guests = ref<number | null>(null)
const mobile = ref('')
const requests = ref('')

const submitting = ref(false)
const error = ref('')
const success = ref(false)

const visibleFields = computed(() => props.fields ?? ['arrival_time', 'guests', 'mobile', 'requests'])

async function handleSubmit() {
  if (!props.token) return
  submitting.value = true
  error.value = ''
  try {
    await $fetch(`${apiBase}/api/guest-guides/by-token/${props.token}/submit`, {
      method: 'POST',
      body: {
        arrivalTime: arrivalTime.value || undefined,
        guests: guests.value ?? undefined,
        mobile: mobile.value || undefined,
        requests: requests.value || undefined,
      },
    })
    success.value = true
  } catch (err: any) {
    error.value = err?.message ?? 'Submission failed'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div v-if="visibleFields.includes('arrival_time')">
      <label class="mb-1 block text-sm font-medium">Estimated arrival time</label>
      <input
        v-model="arrivalTime"
        type="time"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>

    <div v-if="visibleFields.includes('guests')">
      <label class="mb-1 block text-sm font-medium">Number of guests</label>
      <input
        v-model.number="guests"
        type="number"
        min="1"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>

    <div v-if="visibleFields.includes('mobile')">
      <label class="mb-1 block text-sm font-medium">Mobile (with country code)</label>
      <input
        v-model="mobile"
        type="tel"
        placeholder="+49 123 456 7890"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>

    <div v-if="visibleFields.includes('requests')">
      <label class="mb-1 block text-sm font-medium">Special requests</label>
      <textarea
        v-model="requests"
        rows="3"
        placeholder="Late check-in, dietary needs, etc."
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>

    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>

    <div v-if="success" class="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
      Thanks! We've received your details.
    </div>

    <button
      v-if="!success"
      type="submit"
      :disabled="submitting"
      class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
    >
      <Icon v-if="submitting" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
      {{ submitting ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>