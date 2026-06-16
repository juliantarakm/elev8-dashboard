<script setup lang="ts">
import type {
  TemplateCategory,
  TemplateDifficulty,
} from './data/journeys'

const props = defineProps<{
  open: boolean
  defaultName?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [meta: {
    templateName: string
    description: string
    category: TemplateCategory
    difficulty: TemplateDifficulty
    estimatedImpact?: string
    tags: string[]
    makePublic: boolean
  }]
}>()

const templateName = ref('')
const description = ref('')
const category = ref<TemplateCategory>('Upsells')
const difficulty = ref<TemplateDifficulty>('Beginner')
const estimatedImpact = ref('')
const tags = ref<string[]>([])
const tagInput = ref('')
const makePublic = ref(false)

const categories: TemplateCategory[] = ['Upsells', 'Guided Stays', 'Objective-Based']
const difficulties: TemplateDifficulty[] = ['Beginner', 'Intermediate', 'Advanced']

watch(() => props.open, (open) => {
  if (open) {
    templateName.value = props.defaultName ?? ''
    description.value = ''
    category.value = 'Upsells'
    difficulty.value = 'Beginner'
    estimatedImpact.value = ''
    tags.value = []
    tagInput.value = ''
    makePublic.value = false
  }
})

function addTag() {
  const t = tagInput.value.trim()
  if (t && !tags.value.includes(t))
    tags.value = [...tags.value, t]
  tagInput.value = ''
}

function removeTag(t: string) {
  tags.value = tags.value.filter(x => x !== t)
}

const isValid = computed(() => templateName.value.trim().length > 0 && description.value.trim().length > 0)

function handleSave() {
  if (!isValid.value)
    return
  emit('save', {
    templateName: templateName.value.trim(),
    description: description.value.trim(),
    category: category.value,
    difficulty: difficulty.value,
    estimatedImpact: estimatedImpact.value.trim() || undefined,
    tags: tags.value,
    makePublic: makePublic.value,
  })
  emit('update:open', false)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogDescription>
          Save this journey as a reusable template you can install again or share with the marketplace.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-1 max-h-[65vh] overflow-y-auto pr-1">
        <div class="flex flex-col gap-1.5">
          <Label for="tpl-name">Template Name <span class="text-destructive">*</span></Label>
          <Input
            id="tpl-name"
            v-model="templateName"
            placeholder="e.g., Pre-Stay Gap Night Upsell"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="tpl-desc">Description <span class="text-destructive">*</span></Label>
          <Textarea
            id="tpl-desc"
            v-model="description"
            class="min-h-20 text-sm"
            placeholder="Describe what this journey does and when to use it…"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Category</Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in categories"
              :key="c"
              class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              :class="category === c ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              @click="category = c"
            >
              {{ c }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>Difficulty Level</Label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="d in difficulties"
              :key="d"
              class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
              :class="difficulty === d ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              @click="difficulty = d"
            >
              {{ d }}
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <Label for="tpl-impact">
            Estimated Impact
            <span class="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <Input
            id="tpl-impact"
            v-model="estimatedImpact"
            placeholder="e.g., Potential 10-20% increase in revenue"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <Label>
            Tags
            <span class="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <div class="flex gap-2">
            <Input
              v-model="tagInput"
              placeholder="Add a tag…"
              @keydown.enter.prevent="addTag"
            />
            <Button variant="outline" :disabled="!tagInput.trim()" @click="addTag">
              Add
            </Button>
          </div>
          <div v-if="tags.length > 0" class="flex flex-wrap gap-1.5">
            <span
              v-for="t in tags"
              :key="t"
              class="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {{ t }}
              <button class="text-muted-foreground hover:text-destructive" @click="removeTag(t)">
                <Icon name="i-lucide-x" class="h-2.5 w-2.5" />
              </button>
            </span>
          </div>
        </div>

        <label
          class="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/40"
          @click="makePublic = !makePublic"
        >
          <div
            class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border"
            :class="makePublic ? 'border-primary bg-primary text-primary-foreground' : 'border-input'"
          >
            <Icon v-if="makePublic" name="i-lucide-check" class="h-3 w-3" />
          </div>
          <div>
            <p class="text-sm font-medium leading-none">
              Make public
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Make this template public in the journey marketplace
            </p>
          </div>
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose">
          Cancel
        </Button>
        <Button :disabled="!isValid" @click="handleSave">
          Save Template
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
