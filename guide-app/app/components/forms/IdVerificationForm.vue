<script setup lang="ts">
const props = defineProps<{
  token: string
}>()

const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl

const idType = ref<'passport' | 'ktp' | 'driver_license'>('passport')
const idNumber = ref('')
const idPhotoFile = ref<File | null>(null)
const idPhotoPreview = ref<string | null>(null)

const submitting = ref(false)
const error = ref('')
const success = ref(false)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  idPhotoFile.value = file
  idPhotoPreview.value = file ? URL.createObjectURL(file) : null
}

async function handleSubmit() {
  if (!props.token) return
  if (!idNumber.value) {
    error.value = 'Please enter your ID number.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    // Phase 1: skip photo upload — Phase 5 adds the upload pipeline.
    await $fetch(`${apiBase}/api/guest-guides/by-token/${props.token}/submit-id`, {
      method: 'POST',
      body: {
        idType: idType.value,
        idNumber: idNumber.value,
        idPhotoUrl: undefined,
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
    <div>
      <label class="mb-1 block text-sm font-medium">ID type</label>
      <select
        v-model="idType"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="passport">
          Passport
        </option>
        <option value="ktp">
          KTP (Indonesian ID)
        </option>
        <option value="driver_license">
          Driver's License
        </option>
      </select>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium">ID number</label>
      <input
        v-model="idNumber"
        type="text"
        placeholder="Enter ID number"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium">ID photo (optional)</label>
      <input
        type="file"
        accept="image/*"
        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
        @change="onFileChange"
      />
      <img
        v-if="idPhotoPreview"
        :src="idPhotoPreview"
        alt="ID preview"
        class="mt-2 max-h-40 rounded-md border"
      >
      <p class="mt-1 text-xs text-muted-foreground">
        Photo upload comes online in Phase 5. Form can be submitted without it.
      </p>
    </div>

    <p v-if="error" class="text-sm text-destructive">
      {{ error }}
    </p>

    <div v-if="success" class="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
      ID submitted. Thanks!
    </div>

    <button
      v-if="!success"
      type="submit"
      :disabled="submitting"
      class="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
    >
      <Icon v-if="submitting" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
      {{ submitting ? 'Submitting...' : 'Submit ID' }}
    </button>
  </form>
</template>