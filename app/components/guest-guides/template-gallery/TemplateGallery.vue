<script setup lang="ts">
import type { GuideTemplate } from '../data/types'
import TemplateCard from './TemplateCard.vue'

const { getTemplates, createGuideFromTemplate } = useGuestGuides()

const templates = getTemplates()

defineEmits<{ 'select': [templateId: string] }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    <TemplateCard
      v-for="t in templates"
      :key="t.id"
      :template="t"
      @use="$emit('select', t.id)"
    />
    <button
      class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 hover:bg-muted"
      @click="$emit('select', '')"
    >
      <Icon name="lucide:edit" class="size-8 text-muted-foreground" />
      <span class="font-medium">Blank</span>
      <span class="text-xs text-muted-foreground">Start from scratch</span>
    </button>
  </div>
</template>
