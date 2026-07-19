<script setup lang="ts">
import type { Journey, MarketplaceTemplate } from '~/components/journeys/data/journeys'
import type { WhatsAppTemplate } from '~/components/journeys/data/whatsapp-templates'
import { toast } from 'vue-sonner'
import { createEmptyTemplate } from '~/components/journeys/data/whatsapp-templates'

definePageMeta({ layout: 'default' })

type ViewState = 'list' | 'marketplace' | 'builder-prompt' | 'builder-generating' | 'builder-review' | 'editor' | 'templates-list' | 'template-builder'

const { saveJourney } = useJourneys()
const { saveTemplate, submitTemplate } = useWhatsAppTemplates()

const currentView = ref<ViewState>('list')
const builderPrompt = ref('')
const generatedJourney = ref<Journey | null>(null)
const editingJourney = ref<Journey | null>(null)

const editingTemplate = ref<WhatsAppTemplate | null>(null)
const isSubmittingTemplate = ref(false)

function goTo(view: ViewState) {
  currentView.value = view
}

function handleGenerate(prompt: string) {
  builderPrompt.value = prompt
  goTo('builder-generating')
}

function handleGeneratedDone(journey: Journey) {
  generatedJourney.value = journey
  goTo('builder-review')
}

function handleUseJourney(journey: Journey) {
  editingJourney.value = { ...journey, id: `j-${Date.now()}`, status: 'draft' }
  goTo('editor')
}

function handleInstallTemplate(template: MarketplaceTemplate) {
  const trigStep = template.steps[0]?.type === 'trigger' ? (template.steps[0] as any) : null
  editingJourney.value = {
    id: `j-${Date.now()}`,
    name: template.name,
    status: 'draft',
    triggerType: trigStep?.triggers?.[0]?.type ?? 'new_booking',
    lastModified: new Date().toISOString().split('T')[0],
    properties: ['All Properties'],
    steps: template.steps.map(s => ({ ...s, id: `s-${Date.now()}-${Math.random().toString(36).slice(2)}` })),
  }
  goTo('editor')
}

function handleNewJourneyScratch() {
  editingJourney.value = null
  goTo('editor')
}

function handleEditJourney(journey: Journey) {
  editingJourney.value = journey
  goTo('editor')
}

function handleSaveJourney(journey: Journey) {
  saveJourney(journey)
  toast.success('Journey saved')
  editingJourney.value = null
  goTo('list')
}

function handleEditorBuildAI(prompt: string) {
  builderPrompt.value = prompt
  goTo('builder-generating')
}

function handleSaveTemplate(journey: Journey) {
  toast.success(`"${journey.name}" saved as template`)
}

function handleEditorBack() {
  editingJourney.value = null
  goTo('list')
}

function handleReviewBack() {
  goTo('builder-prompt')
}

function handleRegenerate() {
  goTo('builder-prompt')
}

// --- WhatsApp Templates ---
function handleCreateTemplate() {
  editingTemplate.value = createEmptyTemplate()
  goTo('template-builder')
}

function handleEditTemplate(template: WhatsAppTemplate) {
  editingTemplate.value = { ...template }
  goTo('template-builder')
}

function handleSaveWhatsAppTemplate(template: WhatsAppTemplate) {
  saveTemplate(template)
  toast.success(`"${template.name}" saved`)
}

async function handleSubmitTemplate(template: WhatsAppTemplate) {
  saveTemplate(template)
  isSubmittingTemplate.value = true
  const result = await submitTemplate(template.id)
  isSubmittingTemplate.value = false
  if (result.success) {
    toast.success(`"${template.name}" submitted and approved`)
    editingTemplate.value = null
    goTo('templates-list')
  }
  else {
    toast.error(`"${template.name}" was rejected`, { description: result.error })
    const updated = useWhatsAppTemplates().getTemplateById(template.id)
    if (updated)
      editingTemplate.value = { ...updated }
  }
}

function handleTemplateCancel() {
  editingTemplate.value = null
  goTo('templates-list')
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Tabs shown when browsing lists -->
    <div
      v-if="currentView === 'list' || currentView === 'templates-list'"
      class="flex items-center gap-1 border-b bg-background px-6 pt-4"
    >
      <button
        class="relative px-3 py-2 text-sm font-medium transition-colors"
        :class="currentView === 'list' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="goTo('list')"
      >
        Journeys
        <span
          v-if="currentView === 'list'"
          class="absolute inset-x-3 -bottom-px h-0.5 bg-primary"
        />
      </button>
      <button
        class="relative px-3 py-2 text-sm font-medium transition-colors"
        :class="currentView === 'templates-list' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="goTo('templates-list')"
      >
        WhatsApp Templates
        <span
          v-if="currentView === 'templates-list'"
          class="absolute inset-x-3 -bottom-px h-0.5 bg-primary"
        />
      </button>
    </div>

    <Transition name="fade" mode="out-in">
      <JourneysJourneyList
        v-if="currentView === 'list'"
        @new-journey="goTo('builder-prompt')"
        @new-journey-scratch="handleNewJourneyScratch"
        @open-marketplace="goTo('marketplace')"
        @edit-journey="handleEditJourney"
      />
      <JourneysJourneyMarketplace
        v-else-if="currentView === 'marketplace'"
        @install="handleInstallTemplate"
        @back="goTo('list')"
      />
      <JourneysJourneyBuilderPrompt
        v-else-if="currentView === 'builder-prompt'"
        @generate="handleGenerate"
        @use-template="handleInstallTemplate"
        @back="goTo('list')"
      />
      <JourneysJourneyBuilderGenerating
        v-else-if="currentView === 'builder-generating'"
        :prompt="builderPrompt"
        @done="handleGeneratedDone"
      />
      <JourneysJourneyBuilderReview
        v-else-if="currentView === 'builder-review'"
        :journey="(generatedJourney as any)"
        @use-journey="handleUseJourney"
        @regenerate="handleRegenerate"
        @back="handleReviewBack"
      />
      <JourneysJourneyEditor
        v-else-if="currentView === 'editor'"
        :initial-journey="editingJourney"
        @save="handleSaveJourney"
        @back="handleEditorBack"
        @build-with-ai="handleEditorBuildAI"
        @save-template="handleSaveTemplate"
      />
      <JourneysWhatsAppTemplatesList
        v-else-if="currentView === 'templates-list'"
        @create-template="handleCreateTemplate"
        @edit-template="handleEditTemplate"
      />
      <JourneysWhatsAppTemplateBuilder
        v-else-if="currentView === 'template-builder' && editingTemplate"
        :template="editingTemplate"
        :is-submitting="isSubmittingTemplate"
        @save="handleSaveWhatsAppTemplate"
        @submit="handleSubmitTemplate"
        @cancel="handleTemplateCancel"
      />
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
