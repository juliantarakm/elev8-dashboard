<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PaperclipIcon } from '@lucide/vue'
import { useAssistant } from '~/composables/useAssistant'

const { submit, stop, isStreaming } = useAssistant()

// Map our isStreaming to the ChatStatus used by ai-elements primitives.
const chatStatus = computed<'ready' | 'streaming' | 'submitted' | 'error'>(
  () => isStreaming.value ? 'streaming' : 'ready',
)

// Local mirror of the files in the PromptInput context. We watch it so we
// can show preview chips above the textarea (the ai-elements primitives
// handle the file picker + drag/drop, but they don't render previews
// inline — we render our own ElevAIAttachments chip strip).
interface PreviewFile {
  id: string
  name: string
  type: string
  size: number
  url?: string
}
const previews = ref<PreviewFile[]>([])

async function onPromptSubmit(payload: { text: string, files: Array<{ type: string, filename?: string, mediaType?: string }> }) {
  if (!payload.text.trim() && previews.value.length === 0) return

  // Map previews (which have blob URLs) to the shape submit() expects.
  const attachments = previews.value.map((p) => ({
    name: p.name,
    type: p.type,
    size: p.size,
    url: p.url,
  }))

  // Revoke blob URLs as soon as submit completes (they're no longer
  // needed since the messages array holds the same reference).
  const revokable = previews.value
  previews.value = []
  revokable.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url) })

  await submit(payload.text, attachments)
}

function onPromptError(payload: { code: string, message: string }) {
  // eslint-disable-next-line no-console
  console.error('PromptInput error:', payload)
}

// Watch files via window events would be more invasive — instead the
// ai-elements PromptInputProvider exposes the files context. We watch
// the actual selected files by listening to the input change indirectly.
// Since we don't have direct context access from outside, we mirror
// the files using a side-effect of the PromptInput's input element.
const fileInputRef = ref<HTMLInputElement | null>(null)

// Watch the hidden file input to build preview chips. The ai-elements
// PromptInput manages this input internally, but exposes it via the
// fileInputRef on the context. We use a MutationObserver-free approach:
// intercept clicks on attachment-add buttons by listening to drag events.
function handleFilesAdded(fileList: FileList | File[]) {
  const files = Array.from(fileList)
  for (const f of files) {
    previews.value.push({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      type: f.type || 'application/octet-stream',
      size: f.size,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    })
  }
}

function removePreview(id: string) {
  const idx = previews.value.findIndex(p => p.id === id)
  if (idx >= 0) {
    const p = previews.value[idx]
    if (p?.url) URL.revokeObjectURL(p.url)
    previews.value.splice(idx, 1)
  }
}

// Listen for drag/drop on the wrapper to capture files (the ai-elements
// PromptInput does this itself, but it doesn't expose a public event for
// new files — so we rely on the input element's change event bubbling).
function handleDrop(e: DragEvent) {
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    // Hand off to ai-elements PromptInput's built-in handler
    // (the drop event already bubbles to it via @drop.prevent.stop on PromptInput)
  }
}

function handleStop() {
  stop()
}
</script>

<template>
  <div class="border-t p-3">
    <!-- Show preview chips for files that have been added.
         Note: the ai-elements PromptInput manages the file state internally,
         but doesn't render visible previews by default — we mirror the
         picked files locally by listening for new File objects. -->
    <ElevAIAttachments
      v-if="previews.length > 0"
      :attachments="previews"
      @remove="removePreview"
    />

    <PromptInput
      class="w-full"
      accept="image/*,application/pdf,.txt,.doc,.docx"
      :multiple="true"
      :global-drop="true"
      @submit="onPromptSubmit"
      @error="onPromptError"
      @drop="handleFilesAdded($event.dataTransfer?.files)"
    >
      <PromptInputBody>
        <PromptInputTextarea
          placeholder="Ask about your properties..."
          :maxlength="2000"
          data-testid="prompt-input"
        />
      </PromptInputBody>
      <PromptInputFooter class="flex justify-end gap-1">
        <PromptInputSubmit
          v-if="!isStreaming"
          :status="chatStatus"
          data-testid="prompt-send"
        />
        <PromptInputSubmit
          v-else
          :status="chatStatus"
          data-testid="prompt-stop"
          @click="handleStop"
        >
          <span class="text-xs">Stop</span>
        </PromptInputSubmit>
      </PromptInputFooter>
    </PromptInput>
  </div>
</template>