<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toast } from 'vue-sonner'
import TemplateGallery from '~/components/guest-guides/template-gallery/TemplateGallery.vue'

const title = ref('Untitled Guide')
const language = ref('en')
const selectedTemplateId = ref<string | null>(null)

const { createGuide, createGuideFromTemplate } = useGuestGuides()

function handleTemplateSelect(templateId: string) {
  if (templateId === '') {
    // Blank
    selectedTemplateId.value = null
    return
  }
  selectedTemplateId.value = templateId
}

function handleCreate() {
  let guide
  if (selectedTemplateId.value) {
    guide = createGuideFromTemplate(selectedTemplateId.value, title.value, language.value)
  } else {
    guide = createGuide({ title: title.value, defaultLanguage: language.value })
  }
  if (guide) {
    toast.success('Guide created')
    navigateTo(`/guest-guides/${guide.id}`)
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="mb-2 text-2xl font-bold tracking-tight">Create a Guest Guide</h1>
    <p class="mb-6 text-sm text-muted-foreground">Pick a template to get started fast, or start blank</p>

    <div class="mb-6 grid max-w-2xl gap-4">
      <div>
        <Label>Title</Label>
        <Input v-model="title" />
      </div>
      <div>
        <Label>Default language (your authoring language)</Label>
        <Input v-model="language" placeholder="en" />
      </div>
    </div>

    <h2 class="mb-3 text-lg font-semibold">Choose a template</h2>
    <TemplateGallery @select="handleTemplateSelect" />

    <div class="mt-6 flex justify-end gap-2">
      <Button variant="outline" @click="navigateTo('/guest-guides')">
        Cancel
      </Button>
      <Button :disabled="!title" @click="handleCreate">
        Create guide
      </Button>
    </div>
  </div>
</template>
