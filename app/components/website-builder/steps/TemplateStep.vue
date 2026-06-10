<script setup lang="ts">
const emit = defineEmits<{
  select: [template: Template]
  next: []
  back: []
}>()

definePageMeta({
  layout: 'default',
})

export interface Template {
  id: string
  name: string
  description: string
  gradient: string
  icon: string
}

const templates: Template[] = [
  {
    id: 'luxury-villa',
    name: 'Luxury Villa',
    description: 'Elegant design with full-screen hero, amenity showcases, and booking integration for premium properties.',
    gradient: 'from-amber-500/20 to-orange-600/20',
    icon: 'i-lucide-crown',
  },
  {
    id: 'modern-tropical',
    name: 'Modern Tropical',
    description: 'Clean, airy layout with lush imagery and nature-inspired accents for tropical getaways.',
    gradient: 'from-emerald-500/20 to-teal-600/20',
    icon: 'i-lucide-palmtree',
  },
  {
    id: 'beach-house',
    name: 'Beach House',
    description: 'Coastal vibes with ocean palettes, photo galleries, and weather widget for seaside stays.',
    gradient: 'from-sky-500/20 to-blue-600/20',
    icon: 'i-lucide-waves',
  },
  {
    id: 'minimal-bali',
    name: 'Minimal Bali',
    description: 'Minimalist zen aesthetic with earthy tones and focused content for serene Bali retreats.',
    gradient: 'from-stone-400/20 to-stone-600/20',
    icon: 'i-lucide-flower-2',
  },
]

const selectedTemplate = ref<Template | null>(null)

function selectTemplate(template: Template) {
  selectedTemplate.value = template
  emit('select', template)
}

function handleNext() {
  if (selectedTemplate.value) {
    emit('next')
  }
}

function handleBack() {
  emit('back')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h3 class="text-lg font-semibold">
        Choose a Template
      </h3>
      <p class="text-sm text-muted-foreground">
        Select a starting design for your website. You can customise it later.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
      <Card
        v-for="template in templates"
        :key="template.id"
        class="cursor-pointer transition-all hover:shadow-md"
        :class="selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''"
        @click="selectTemplate(template)"
      >
        <CardContent class="p-4 flex gap-4">
          <!-- Thumbnail placeholder -->
          <div
            class="shrink-0 w-24 h-24 rounded-lg bg-gradient-to-br flex items-center justify-center"
            :class="template.gradient"
          >
            <Icon :name="template.icon" class="size-8 text-muted-foreground" />
          </div>

          <!-- Info -->
          <div class="flex flex-col gap-1 min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <span class="font-semibold">{{ template.name }}</span>
              <Icon
                v-if="selectedTemplate?.id === template.id"
                name="i-lucide-circle-check"
                class="size-5 text-primary"
              />
            </div>
            <p class="text-sm text-muted-foreground line-clamp-2">
              {{ template.description }}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between pt-2">
      <Button variant="ghost" @click="handleBack">
        <Icon name="i-lucide-arrow-left" class="size-4 mr-2" />
        Back
      </Button>
      <Button :disabled="!selectedTemplate" @click="handleNext">
        Next
        <Icon name="i-lucide-arrow-right" class="size-4 ml-2" />
      </Button>
    </div>
  </div>
</template>
