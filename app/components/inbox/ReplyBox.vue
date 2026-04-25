<script lang="ts" setup>
interface ReplyBoxProps {
  channel: string
  conversationId: string
}

const props = defineProps<ReplyBoxProps>()
const { isElevaiEnabled, toggleElevai, pendingSuggestion, clearSuggestion } = useInbox()

const replyText = ref('')
const isRewriting = ref(false)
const elevaiOn = computed(() => isElevaiEnabled(props.conversationId))
const showRewrite = computed(() => replyText.value.trim().length > 0)

const rewrites = [
  'Thanks for reaching out! I\'d be happy to help with that. Let me look into it and get back to you shortly.',
  'Thank you for your message! We appreciate you letting us know. I\'ll take care of this right away.',
  'Great question! Here\'s what I can tell you — check-in is from 3 PM, and we\'ll have everything ready for your arrival.',
  'We\'re so glad you\'re staying with us! I\'ve noted your request and our team will make sure everything is taken care of.',
  'Thanks for letting us know! We want to make sure your stay is perfect. I\'ll have our team address this immediately.',
]

function toggleElevaiState() {
  toggleElevai(props.conversationId)
}

function send() {
  if (!replyText.value.trim()) return
  replyText.value = ''
}

async function rewriteWithAI() {
  isRewriting.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  const randomRewrite = rewrites[Math.floor(Math.random() * rewrites.length)]!
  replyText.value = randomRewrite
  isRewriting.value = false
}

watch(pendingSuggestion, (val) => {
  if (val) {
    replyText.value = val
    clearSuggestion()
  }
})
</script>

<template>
  <div class="border-t p-3 space-y-2">
    <div class="relative">
      <Textarea
        v-model="replyText"
        placeholder="Type your reply..."
        class="min-h-[80px] resize-none pr-10"
        @keydown.enter.meta="send"
      />
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <button
          v-if="showRewrite && elevaiOn && !isRewriting"
          class="absolute right-2 bottom-2 flex items-center justify-center size-7 rounded-md text-[#C8A84B] hover:bg-[#C8A84B]/10 transition-colors"
          title="Rewrite with ElevAI"
          @click="rewriteWithAI"
        >
          <Icon name="lucide:sparkles" class="size-4" />
        </button>
      </Transition>
      <div
        v-if="isRewriting"
        class="absolute right-2 bottom-2 flex items-center gap-1 text-[10px] text-muted-foreground"
      >
        <Icon name="lucide:loader-2" class="size-3.5 animate-spin text-[#C8A84B]" />
        Rewriting
      </div>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-2 text-xs"
          @click="toggleElevaiState"
        >
          <span
            :class="[
              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
              elevaiOn ? 'bg-[#C8A84B]' : 'bg-muted-foreground/30',
            ]"
          >
            <span
              :class="[
                'pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
                elevaiOn ? 'translate-x-4' : 'translate-x-0.5',
              ]"
              style="margin-top: 2px;"
            />
          </span>
          <span class="text-xs text-muted-foreground">ElevAI Assist</span>
        </button>
        <Badge variant="secondary" class="text-xs">
          via {{ channel }}
        </Badge>
      </div>
      <Button
        variant="default"
        size="sm"
        :disabled="!replyText.trim()"
        @click="send"
      >
        <Icon name="lucide:send" class="size-4" />
        Send
      </Button>
    </div>
  </div>
</template>