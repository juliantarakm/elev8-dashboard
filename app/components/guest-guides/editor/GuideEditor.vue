<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GuideSection, GuideSectionType } from '../data/types'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Label } from '~/components/ui/label'
import { toast } from 'vue-sonner'
import SectionList from './SectionList.vue'
import SectionEditor from './SectionEditor.vue'
import AddSectionDialog from './AddSectionDialog.vue'
import ListingsAssignSection from './ListingsAssignSection.vue'
import { generateSectionId } from '~/utils/guest-guide-token'

const props = defineProps<{ guideId: string }>()

const { guides, updateGuide } = useGuestGuides()

const guide = computed(() => guides.value.find(g => g.id === props.guideId))

const selectedSectionId = ref<string | null>(null)
const addDialogOpen = ref(false)
const dirty = ref(false)

const selectedSection = computed(() => {
  if (!selectedSectionId.value) return null
  return guide.value?.sections.find(s => s.id === selectedSectionId.value) ?? null
})

function handleSectionsUpdate(newSections: GuideSection[]) {
  if (!guide.value) return
  updateGuide(guide.value.id, { sections: newSections })
  dirty.value = true
}

function handleSelect(id: string) {
  selectedSectionId.value = id
}

function handleAdd() {
  addDialogOpen.value = true
}

function handleAddSectionType(type: GuideSectionType) {
  if (!guide.value) return
  const newSection: GuideSection = {
    id: generateSectionId(),
    type,
    order: guide.value.sections.length,
    enabled: true,
    data: {},
  }
  handleSectionsUpdate([...guide.value.sections, newSection])
  selectedSectionId.value = newSection.id
  toast.success('Section added')
}

function handleDelete(id: string) {
  if (!guide.value) return
  handleSectionsUpdate(guide.value.sections.filter(s => s.id !== id))
  if (selectedSectionId.value === id) selectedSectionId.value = null
}

function handleSectionDataUpdate(data: Record<string, any>) {
  if (!selectedSection.value || !guide.value) return
  handleSectionsUpdate(
    guide.value.sections.map(s => (s.id === selectedSection.value!.id ? { ...s, data } : s)),
  )
}

function handleSave() {
  // updateGuide is called on every change; just mark clean
  dirty.value = false
  toast.success('Saved')
}

function handlePublish() {
  if (!guide.value) return
  updateGuide(guide.value.id, { status: 'active' })
  toast.success('Published — guide is now active')
}

function handleSmartOrderingToggle(value: boolean) {
  if (!guide.value) return
  updateGuide(guide.value.id, { smartOrdering: value })
  dirty.value = true
}
</script>

<template>
  <div v-if="guide" class="flex h-full">
    <aside class="w-64 border-r p-4 overflow-y-auto">
      <div class="mb-4">
        <ListingsAssignSection :guide-id="guideId" />
      </div>
      <h3 class="mb-3 text-sm font-medium text-muted-foreground">Sections</h3>
      <SectionList
        :model-value="guide.sections"
        :selected-id="selectedSectionId"
        @update:model-value="handleSectionsUpdate"
        @select="handleSelect"
        @add="handleAdd"
        @delete="handleDelete"
      />
    </aside>

    <main class="flex-1 overflow-y-auto p-6">
      <div v-if="selectedSection">
        <h2 class="mb-4 text-lg font-semibold capitalize">
          {{ selectedSection.type.replace('_', ' ') }}
        </h2>
        <SectionEditor
          :section="selectedSection"
          @update="handleSectionDataUpdate"
        />
      </div>
      <div v-else class="py-12 text-center text-muted-foreground">
        Select a section to edit, or add a new one.
      </div>
    </main>

    <div class="border-t p-4 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Switch
          :model-value="guide.smartOrdering ?? false"
          @update:model-value="handleSmartOrderingToggle"
        />
        <Label class="text-sm">Smart section ordering (reorder by stay phase)</Label>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="handleSave" :disabled="!dirty">
          Save
        </Button>
        <Button @click="handlePublish">
          Publish
        </Button>
      </div>
    </div>

    <AddSectionDialog v-model:open="addDialogOpen" @select="handleAddSectionType" />
  </div>
  <div v-else class="p-12 text-center text-muted-foreground">
    Guide not found.
  </div>
</template>