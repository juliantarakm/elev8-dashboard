<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  modelValue: string
  label: string
  placeholder?: string
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLElement | null>(null)

function syncFromInput(event: Event) {
  const target = event.currentTarget as HTMLElement | null
  emits('update:modelValue', target?.textContent ?? '')
}

function setBlock(tag: 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'blockquote') {
  editorRef.value?.focus()
  document.execCommand('formatBlock', false, tag)
  emits('update:modelValue', editorRef.value?.textContent ?? '')
}

function applyCommand(command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList') {
  editorRef.value?.focus()
  document.execCommand(command, false)
  emits('update:modelValue', editorRef.value?.textContent ?? '')
}

function setHtml(value: string) {
  if (editorRef.value && editorRef.value.textContent !== value)
    editorRef.value.textContent = value
}

watch(() => props.modelValue, setHtml, { immediate: true })
</script>

<template>
  <div :class="cn('space-y-2', props.class)">
    <div class="flex items-center justify-between gap-2">
      <Label class="text-xs font-medium text-muted-foreground">{{ label }}</Label>
      <div class="flex items-center gap-1 rounded-md border bg-muted/50 p-1">
        <Button type="button" variant="ghost" size="icon-sm" class="size-7" @click="applyCommand('bold')">
          <Icon name="lucide:bold" class="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" class="size-7" @click="applyCommand('italic')">
          <Icon name="lucide:italic" class="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" class="size-7" @click="applyCommand('underline')">
          <Icon name="lucide:underline" class="size-3.5" />
        </Button>
        <Separator orientation="vertical" class="mx-1 h-4" />
        <Button type="button" variant="ghost" size="icon-sm" class="size-7" @click="applyCommand('insertUnorderedList')">
          <Icon name="lucide:list" class="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" class="size-7" @click="applyCommand('insertOrderedList')">
          <Icon name="lucide:list-ordered" class="size-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button type="button" variant="ghost" size="icon-sm" class="size-7">
              <Icon name="lucide:type" class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-40">
            <DropdownMenuItem @click="setBlock('p')">Paragraph</DropdownMenuItem>
            <DropdownMenuItem @click="setBlock('h1')">Heading 1</DropdownMenuItem>
            <DropdownMenuItem @click="setBlock('h2')">Heading 2</DropdownMenuItem>
            <DropdownMenuItem @click="setBlock('h3')">Heading 3</DropdownMenuItem>
            <DropdownMenuItem @click="setBlock('blockquote')">Quote</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <div
      ref="editorRef"
      contenteditable="true"
      role="textbox"
      :data-placeholder="placeholder || 'Start writing...'"
      class="min-h-28 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      @input="syncFromInput"
    />
  </div>
</template>
