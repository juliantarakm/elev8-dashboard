<!-- app/components/users/UserPersonalInfoForm.vue -->
<script setup lang="ts">
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import type { PreferredLanguage } from '~/components/users/data/users'
import { PREFERRED_LANGUAGES } from '~/components/users/data/users'

interface FormState {
  name: string
  phone: string
  preferredLanguage: PreferredLanguage
  email: string
  employeeNumber: string
}

interface Props {
  modelValue: FormState
  errors?: Partial<Record<keyof FormState, string>>
}

const props = withDefaults(defineProps<Props>(), {
  errors: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: FormState]
}>()

function update<K extends keyof FormState>(key: K, value: FormState[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const countryCodes = [
  { code: '+62', country: 'ID' },
  { code: '+41', country: 'CH' },
  { code: '+1', country: 'US' },
  { code: '+44', country: 'GB' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+31', country: 'NL' },
]

const selectedDialCode = ref('+62')

// Split phone into dial code + number
watchEffect(() => {
  const phone = props.modelValue.phone
  const match = countryCodes.find(c => phone.startsWith(c.code))
  if (match) {
    selectedDialCode.value = match.code
  }
})

function onPhoneInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  update('phone', selectedDialCode.value + raw)
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1.5">
      <Label for="user-name">
        Name <span class="text-destructive">*</span>
      </Label>
      <Input
        id="user-name"
        :model-value="modelValue.name"
        placeholder="e.g. Reto Wyss Test"
        @update:model-value="(v) => update('name', v)"
      />
      <p v-if="errors.name" class="text-xs text-destructive">
        {{ errors.name }}
      </p>
    </div>

    <div class="space-y-1.5">
      <Label for="user-phone">Phone / WhatsApp Number</Label>
      <div class="flex gap-2">
        <Select :model-value="selectedDialCode" @update:model-value="(v) => selectedDialCode = v as string">
          <SelectTrigger class="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="c in countryCodes" :key="c.code" :value="c.code">
              {{ c.country }} {{ c.code }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          id="user-phone"
          :model-value="modelValue.phone.replace(selectedDialCode, '')"
          type="tel"
          inputmode="numeric"
          placeholder="41768165541"
          class="flex-1"
          @update:model-value="onPhoneInput($event as unknown as Event)"
        />
      </div>
    </div>

    <div class="space-y-1.5">
      <Label for="user-lang">Preferred Language</Label>
      <Select
        :model-value="modelValue.preferredLanguage"
        @update:model-value="(v) => update('preferredLanguage', v as PreferredLanguage)"
      >
        <SelectTrigger id="user-lang">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="l in PREFERRED_LANGUAGES" :key="l.value" :value="l.value">
            {{ l.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-1.5">
      <Label for="user-email">Email</Label>
      <Input
        id="user-email"
        type="email"
        :model-value="modelValue.email"
        placeholder="user@example.com"
        @update:model-value="(v) => update('email', v)"
      />
      <p v-if="errors.email" class="text-xs text-destructive">
        {{ errors.email }}
      </p>
    </div>

    <div class="space-y-1.5">
      <Label for="user-emp-num">Employee Number</Label>
      <Input
        id="user-emp-num"
        :model-value="modelValue.employeeNumber"
        placeholder="Enter employee number"
        @update:model-value="(v) => update('employeeNumber', v)"
      />
    </div>
  </div>
</template>
