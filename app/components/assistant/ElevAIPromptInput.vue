<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAssistant } from '~/composables/useAssistant'
import type { ToolCallDisplay } from '~/composables/useAssistant'

const { submit, stop, isStreaming, messages } = useAssistant()

// Map our isStreaming to the ChatStatus used by ai-elements primitives.
const chatStatus = computed<'ready' | 'streaming' | 'submitted' | 'error'>(
  () => isStreaming.value ? 'streaming' : 'ready',
)

// Local mirror of the files in the PromptInput context. We watch it so we
// can show preview chips above the textarea.
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

  const attachments = previews.value.map((p) => ({
    name: p.name,
    type: p.type,
    size: p.size,
    url: p.url,
  }))

  const revokable = previews.value
  previews.value = []
  revokable.forEach((p) => { if (p.url) URL.revokeObjectURL(p.url) })

  await submit(payload.text, attachments)
}

function onPromptError(payload: { code: string, message: string }) {
  // eslint-disable-next-line no-console
  console.error('PromptInput error:', payload)
}

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

function handleStop() {
  stop()
}

// --- Follow-up suggestions: derived from the last assistant message's
// tool calls. Shown as a horizontal scroll row above the textarea, but
// only when the AI has finished responding AND there's room (panel wide
// enough) to fit them.
const lastMessage = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const m = messages.value[i]
    if (m && m.role === 'assistant' && m.content) return m
  }
  return null
})

const followUps = computed<string[]>(() => {
  const m = lastMessage.value
  if (!m?.toolCalls || m.toolCalls.length === 0) return []
  const names = m.toolCalls.map((t: ToolCallDisplay) => t.name)

  if (names.includes('get_upcoming_checkins')) {
    return [
      "What about today's check-outs?",
      'Any VIP guests arriving?',
      'Which villa has the most arrivals?',
    ]
  }
  if (names.includes('get_cleaning_schedule') || names.includes('get_cleaning_schedule_by_date_range')) {
    return [
      'Who is cleaning tomorrow?',
      'Any deep cleans this week?',
      'Are there any maintenance issues?',
    ]
  }
  if (names.includes('get_revenue_summary') || names.includes('get_revenue_by_listing')) {
    return [
      'What about last month?',
      'Which listing earns the most?',
      'Any pending payouts?',
    ]
  }
  if (names.includes('get_occupancy_rate')) {
    return [
      'Which villa has lowest occupancy?',
      'Compare to last month',
      'Show me upcoming gaps',
    ]
  }
  if (names.includes('get_listings_overview')) {
    return [
      'Show me active listings only',
      'Which has the best rating?',
      'Any inactive listings?',
    ]
  }
  if (names.includes('get_repeat_guests') || names.includes('get_current_bookings')) {
    return [
      'Tell me more about Anna Schmidt',
      'Any special requests?',
      "What's the average stay length?",
    ]
  }
  return ['Tell me more', 'What about last week?', 'Any issues?']
})

const showFollowUps = computed(
  () => !isStreaming.value && followUps.value.length > 0,
)

async function onFollowUp(prompt: string) {
  await submit(prompt)
}
</script>

<template>
  <div class="border-t p-3 space-y-2">
    <!-- File attachment previews -->
    <ElevAIAttachments
      v-if="previews.length > 0"
      :attachments="previews"
      @remove="removePreview"
    />

    <!-- Follow-up suggestions: horizontal scroll row above the textarea,
         shown only after the last assistant message has a response -->
    <Suggestions
      v-if="showFollowUps"
      class="-mx-1 animate-in fade-in slide-in-from-bottom-2 duration-500"
      data-testid="elev-ai-follow-ups"
    >
      <Suggestion
        v-for="(prompt, i) in followUps"
        :key="prompt"
        :style="{ animationDelay: `${i * 80}ms` }"
        class="animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-400"
        :suggestion="prompt"
        @click="onFollowUp(prompt)"
      />
    </Suggestions>

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