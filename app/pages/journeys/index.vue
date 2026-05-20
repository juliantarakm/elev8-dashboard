<script setup lang="ts">
import type { Journey, MarketplaceTemplate } from '~/components/journeys/data/journeys'
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'default' })

type ViewState = 'list' | 'marketplace' | 'builder-prompt' | 'builder-generating' | 'builder-review' | 'editor'

const { saveJourney } = useJourneys()

const currentView = ref<ViewState>('list')
const builderPrompt = ref('')
const generatedJourney = ref<Journey | null>(null)
const editingJourney = ref<Journey | null>(null)

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
    triggerType: trigStep?.triggers?.[0]?.type ?? 'booking_confirmed',
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
</script>

<template>
  <div class="flex flex-col h-full">
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
