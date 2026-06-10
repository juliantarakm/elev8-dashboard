<script setup lang="ts">
import type { MarketplaceTemplate } from './data/journeys'
import { marketplaceTemplates } from './data/journeys'

const emit = defineEmits<{
  install: [template: MarketplaceTemplate]
  back: []
}>()

type Category = 'All' | 'Guided Stays' | 'Revenue' | 'Verification' | 'Community'

const activeCategory = ref<Category>('All')
const previewTemplate = ref<MarketplaceTemplate | null>(null)
const previewOpen = ref(false)

const categories: Category[] = ['All', 'Guided Stays', 'Revenue', 'Verification', 'Community']

const filtered = computed(() =>
  activeCategory.value === 'All'
    ? marketplaceTemplates
    : marketplaceTemplates.filter(t => t.category === activeCategory.value),
)

const categoryIcon: Record<string, string> = {
  'Guided Stays': 'i-lucide-map',
  'Revenue': 'i-lucide-trending-up',
  'Verification': 'i-lucide-shield-check',
  'Community': 'i-lucide-users',
}

const categoryBadgeClass: Record<string, string> = {
  'Guided Stays': 'text-blue-700 bg-blue-50',
  'Revenue': 'text-green-700 bg-green-50',
  'Verification': 'text-amber-700 bg-amber-50',
  'Community': 'text-violet-700 bg-violet-50',
}

const stepMeta: Record<string, { icon: string, colorClasses: string }> = {
  trigger: { icon: 'i-lucide-zap', colorClasses: 'text-purple-500 bg-purple-50 dark:bg-purple-950' },
  wait: { icon: 'i-lucide-clock', colorClasses: 'text-muted-foreground bg-muted' },
  message: { icon: 'i-lucide-message-square', colorClasses: 'text-green-600 bg-green-50 dark:bg-green-950' },
  context_check: { icon: 'i-lucide-git-branch', colorClasses: 'text-amber-500 bg-amber-50 dark:bg-amber-950' },
  action: { icon: 'i-lucide-bolt', colorClasses: 'text-red-500 bg-red-50 dark:bg-red-950' },
}

function openPreview(template: MarketplaceTemplate) {
  previewTemplate.value = template
  previewOpen.value = true
}

function handleInstall(template: MarketplaceTemplate) {
  previewOpen.value = false
  emit('install', template)
}
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto">
    <div class="flex items-center gap-2 border-b px-6 py-4 shrink-0">
      <Button variant="ghost" size="icon" aria-label="Back" @click="emit('back')">
        <Icon name="i-lucide-arrow-left" class="h-4 w-4" />
      </Button>
      <div>
        <h2 class="text-lg font-semibold leading-none">
          Journey Marketplace
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          Pre-built Journeys ready to install and customize.
        </p>
      </div>
    </div>

    <div class="flex-1 p-6">
      <div class="mb-5 flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat"
          class="rounded-full border px-3 py-1.5 text-sm transition-colors" :class="[
            activeCategory === cat
              ? 'bg-primary text-primary-foreground border-primary'
              : 'text-muted-foreground hover:border-primary hover:text-primary',
          ]"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div
          v-for="template in filtered"
          :key="template.id"
          class="flex flex-col rounded-lg border bg-card p-5 shadow-sm"
        >
          <div class="flex items-start gap-3 mb-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon :name="categoryIcon[template.category] ?? 'i-lucide-route'" class="h-5 w-5 text-muted-foreground" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-sm">{{ template.name }}</span>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="[categoryBadgeClass[template.category]]">
                  {{ template.category }}
                </span>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">
                {{ template.stepCount }} steps
              </p>
            </div>
          </div>
          <p class="text-sm text-muted-foreground flex-1 mb-4">
            {{ template.description }}
          </p>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="flex-1" @click="openPreview(template)">
              Preview
            </Button>
            <Button size="sm" class="flex-1" @click="emit('install', template)">
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Dialog v-model:open="previewOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ previewTemplate?.name }}</DialogTitle>
          <DialogDescription>{{ previewTemplate?.description }}</DialogDescription>
        </DialogHeader>

        <ScrollArea class="max-h-96">
          <div v-if="previewTemplate" class="flex flex-col pr-4">
            <div
              v-for="(step, index) in previewTemplate.steps"
              :key="step.id"
              class="relative flex gap-3"
            >
              <div class="flex flex-col items-center">
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" :class="[
                    stepMeta[step.type]?.colorClasses,
                  ]"
                >
                  <Icon :name="stepMeta[step.type]?.icon ?? 'i-lucide-circle'" class="h-3.5 w-3.5" />
                </div>
                <div
                  v-if="index < previewTemplate.steps.length - 1"
                  class="mt-1 w-px flex-1 min-h-4 border-l border-dashed border-border"
                />
              </div>
              <div class="mb-3 flex-1 rounded-lg border bg-muted/30 p-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium">{{ step.name }}</span>
                  <span class="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted capitalize">
                    {{ step.type.replace('_', ' ') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" @click="previewOpen = false">
            Close
          </Button>
          <Button @click="previewTemplate && handleInstall(previewTemplate)">
            <Icon name="i-lucide-download" class="mr-2 h-4 w-4" />
            Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
