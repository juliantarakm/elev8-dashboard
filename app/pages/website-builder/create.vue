<script setup lang="ts">
import type { Template } from '~/components/website-builder/steps/TemplateStep.vue'
import type { WebsiteSettings } from '~/components/website-builder/steps/SettingsStep.vue'
import type { PropertySelection } from '~/components/website-builder/steps/PropertyStep.vue'

definePageMeta({
  layout: 'default',
})

const router = useRouter()

const STEPS = [
  { key: 'template', label: 'Template', icon: 'i-lucide-layout-template' },
  { key: 'settings', label: 'Settings', icon: 'i-lucide-settings' },
  { key: 'property', label: 'Property', icon: 'i-lucide-home' },
  { key: 'preview', label: 'Preview', icon: 'i-lucide-eye' },
] as const

const currentStep = ref(0)
const selectedTemplate = ref<Template | null>(null)
const websiteSettings = ref<WebsiteSettings>({
  name: '',
  domain: '',
  description: '',
  brandColor: '#1a1a2e',
  fontFamily: 'Inter',
  logoFile: null,
  faviconFile: null,
  useDefaultFavicon: false,
})
const propertySelection = ref<PropertySelection>({
  propertyId: null,
  roomIds: [],
})

function onSelectTemplate(template: Template) {
  selectedTemplate.value = template
}

function goNext() {
  if (currentStep.value === 0 && selectedTemplate.value) {
    currentStep.value = 1
  }
  else if (currentStep.value === 1 && websiteSettings.value.name && websiteSettings.value.domain) {
    currentStep.value = 2
  }
  else if (currentStep.value === 2 && propertySelection.value.propertyId && propertySelection.value.roomIds.length > 0) {
    currentStep.value = 3
  }
}

function goBack() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
  else {
    router.push('/website-builder')
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.push('/website-builder')">
        <Icon name="i-lucide-arrow-left" class="size-4 mr-2" />
        Back to Website Builder
      </Button>
    </div>

    <div>
      <h2 class="text-2xl font-bold tracking-tight">Create Website</h2>
      <p class="text-muted-foreground mt-1">Set up your new property website in a few steps.</p>
    </div>

    <!-- Step Indicator -->
    <div class="flex items-center gap-2">
      <template v-for="(step, index) in STEPS" :key="step.key">
        <div class="flex items-center gap-2">
          <div
            class="flex items-center justify-center size-8 rounded-full border text-xs font-medium transition-colors"
            :class="{
              'bg-primary text-primary-foreground border-primary': index < currentStep,
              'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30': index === currentStep,
              'bg-muted text-muted-foreground border-border': index > currentStep,
            }"
          >
            <Icon v-if="index < currentStep" name="i-lucide-check" class="size-4" />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            class="text-sm font-medium hidden sm:inline"
            :class="index <= currentStep ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ step.label }}
          </span>
        </div>
        <div
          v-if="index < STEPS.length - 1"
          class="h-px flex-1 min-w-4 max-w-16"
          :class="index < currentStep ? 'bg-primary' : 'bg-border'"
        />
      </template>
    </div>

    <!-- Step Content -->
    <div class="flex-1">
      <WebsiteBuilderStepsTemplateStep
        v-if="currentStep === 0"
        @select="onSelectTemplate"
        @next="goNext"
        @back="goBack"
      />

      <WebsiteBuilderStepsSettingsStep
        v-else-if="currentStep === 1"
        v-model="websiteSettings"
        @next="goNext"
        @back="goBack"
      />

      <!-- Step 3: Property & Rooms -->
      <WebsiteBuilderStepsPropertyStep
        v-else-if="currentStep === 2"
        v-model="propertySelection"
        @next="goNext"
        @back="goBack"
      />

      <!-- Step 4: Preview & Publish -->
      <WebsiteBuilderStepsPreviewStep
        v-else-if="currentStep === 3"
        :template="selectedTemplate"
        :settings="websiteSettings"
        :property="propertySelection"
        @back="goBack"
        @go-to-step="(s: number) => currentStep = s"
      />
    </div>
  </div>
</template>
