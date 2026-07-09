<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/../app/components/ui/button'
import { Input } from '~/../app/components/ui/input'
import { Label } from '~/../app/components/ui/label'
import { toast } from 'vue-sonner'

const props = defineProps<{ token: string }>()

const idType = ref<'passport' | 'ktp' | 'driver_license' | ''>('')
const idNumber = ref('')
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const submitting = ref(false)
const submitted = ref(false)

const config = useRuntimeConfig()
const apiBase = config.public.apiBaseUrl

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null
  photoFile.value = file
  photoPreview.value = file ? URL.createObjectURL(file) : null
}

function clearPhoto() {
  photoFile.value = null
  photoPreview.value = null
}

async function handleSubmit() {
  if (!idType.value) {
    toast.error('Please select an ID type')
    return
  }
  if (!idNumber.value) {
    toast.error('Please enter your ID number')
    return
  }
  submitting.value = true
  try {
    let idPhotoUrl: string | undefined
    if (photoFile.value) {
      const formData = new FormData()
      formData.append('photo', photoFile.value)
      const uploadRes = await $fetch<{ url: string }>(
        `${apiBase}/api/guest-guides/by-token/${props.token}/upload-id-photo`,
        { method: 'POST', body: formData },
      )
      idPhotoUrl = uploadRes.url
    }
    await $fetch(
      `${apiBase}/api/guest-guides/by-token/${props.token}/submit-id`,
      {
        method: 'POST',
        body: {
          idType: idType.value,
          idNumber: idNumber.value,
          idPhotoUrl,
        },
      },
    )
    submitted.value = true
    toast.success('ID submitted')
  } catch (err: any) {
    toast.error(err?.statusMessage ?? err?.message ?? 'Failed to submit ID')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div v-if="!submitted">
      <Label>ID type</Label>
      <select
        v-model="idType"
        class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">
          Select...
        </option>
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

    <div v-if="!submitted">
      <Label>ID number</Label>
      <Input v-model="idNumber" placeholder="Enter ID number" class="mt-1" />
    </div>

    <div v-if="!submitted">
      <Label>Photo of ID (optional)</Label>
      <input
        type="file"
        accept="image/*"
        class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
        @change="onFileChange"
      >
      <div v-if="photoPreview" class="mt-2 flex items-start gap-2">
        <img
          :src="photoPreview"
          alt="ID preview"
          class="max-h-40 rounded-md border"
        >
        <button
          type="button"
          class="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          @click="clearPhoto"
        >
          Remove
        </button>
      </div>
      <p class="mt-1 text-xs text-muted-foreground">
        Max 5MB. JPG, PNG, or WebP.
      </p>
    </div>

    <div
      v-if="submitted"
      class="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700"
    >
      ID submitted successfully. Thanks!
    </div>

    <Button v-if="!submitted" type="submit" :disabled="submitting" class="w-full">
      <Icon v-if="submitting" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
      {{ submitting ? 'Submitting...' : 'Submit ID' }}
    </Button>
  </form>
</template>
