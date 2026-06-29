<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const popoverOpen = ref(false)

const languages = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'id', label: 'Indonesia' },
  { code: 'nl', label: 'Nederlands' },
]

const currentLanguage = ref(languages[0])

function selectLanguage(lang: typeof languages[number]) {
  currentLanguage.value = lang
  popoverOpen.value = false
}

function flagUrl(code: string) {
  return `https://hatscripts.github.io/circle-flags/flags/language/${code}.svg`
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Button variant="ghost" class="gap-1.5 px-2 h-8" aria-label="Change language">
        <img :src="flagUrl(currentLanguage.code)" :alt="currentLanguage.label" class="size-5 rounded-full" />
        <span class="text-xs font-medium uppercase">{{ currentLanguage.code }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-48 p-1" align="end" :side-offset="8">
      <button
        v-for="lang in languages"
        :key="lang.code"
        class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm transition-colors hover:bg-muted"
        :class="{ 'bg-muted font-medium': currentLanguage.code === lang.code }"
        @click="selectLanguage(lang)"
      >
        <img :src="flagUrl(lang.code)" :alt="lang.label" class="size-5 rounded-full" />
        <span>{{ lang.label }}</span>
        <span class="ml-auto text-xs text-muted-foreground uppercase">{{ lang.code }}</span>
      </button>
    </PopoverContent>
  </Popover>
</template>
