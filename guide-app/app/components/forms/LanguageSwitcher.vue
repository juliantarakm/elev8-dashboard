<script setup lang="ts">
const modelValue = defineModel<string>({ default: 'en' })

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'nl', label: 'Nederlands' },
]
</script>

<template>
  <select
    v-model="modelValue"
    aria-label="Language"
    class="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
  >
    <option v-for="l in languages" :key="l.code" :value="l.code">
      {{ l.label }}
    </option>
  </select>
</template>