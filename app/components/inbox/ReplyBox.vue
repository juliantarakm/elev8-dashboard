<script lang="ts" setup>
interface ReplyBoxProps {
  channel: string
  conversationId: string
}

const props = defineProps<ReplyBoxProps>()
const { isElevaiEnabled, toggleElevai } = useInbox()

const replyText = ref('')
const elevaiOn = computed(() => isElevaiEnabled(props.conversationId))

function toggleElevaiState() {
  toggleElevai(props.conversationId)
}

function send() {
  if (!replyText.value.trim()) return
  replyText.value = ''
}
</script>

<template>
  <div class="border-t p-3 space-y-2">
    <Textarea
      v-model="replyText"
      placeholder="Type your reply..."
      class="min-h-[80px] resize-none"
      @keydown.enter.meta="send"
    />
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
        <span class="text-xs text-muted-foreground">
          via {{ channel }}
        </span>
      </div>
      <Button
        size="sm"
        class="bg-[#C8A84B] text-[#0a0a0f] hover:bg-[#C8A84B]/90"
        :disabled="!replyText.trim()"
        @click="send"
      >
        <Icon name="lucide:send" class="size-4" />
        Send
      </Button>
    </div>
  </div>
</template>