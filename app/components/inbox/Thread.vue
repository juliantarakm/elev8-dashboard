<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'
import { cn } from '~/lib/utils'
import type { Conversation } from '~/components/inbox/data/conversations'
import { otaSources } from '~/components/inbox/data/conversations'

interface ThreadEmits {
  useSuggestion: [content: string]
}

const emit = defineEmits<ThreadEmits>()

const {
  selectedConversation,
  selectedMessages,
  markAsDone,
  isElevaiEnabled,
} = useInbox()

const dismissedSuggestions = ref<string[]>([])

const displayMessages = computed(() =>
  selectedMessages.value.filter(m => !m.isAISuggestion),
)

const aiSuggestion = computed(() =>
  selectedMessages.value.find(m => m.isAISuggestion),
)

const showSuggestion = computed(() => {
  if (!aiSuggestion.value) return false
  if (dismissedSuggestions.value.includes(aiSuggestion.value.id)) return false
  return selectedConversation.value ? isElevaiEnabled(selectedConversation.value.id) : false
})

function dismissSuggestion() {
  if (aiSuggestion.value) {
    dismissedSuggestions.value.push(aiSuggestion.value.id)
  }
}

const otaColorMap: Record<string, string> = Object.fromEntries(otaSources.map(s => [s.name, s.color]))

function statusBadge(status: string) {
  const map: Record<string, { label: string, class: string }> = {
    needs_reply: { label: 'Needs Reply', class: 'bg-[#C8A84B]/20 text-[#C8A84B]' },
    waiting_on_guest: { label: 'Waiting', class: 'bg-green-500/20 text-green-600' },
    done: { label: 'Done', class: 'bg-muted text-muted-foreground' },
  }
  return map[status] ?? { label: status, class: 'bg-muted text-muted-foreground' }
}
</script>

<template>
  <div v-if="!selectedConversation" class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
    <Icon name="lucide:message-square" class="size-12" />
    <p class="text-sm">Select a conversation</p>
  </div>

  <div v-else class="flex flex-col h-full">
    <div class="flex items-center justify-between border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <h2 class="font-semibold text-sm">{{ selectedConversation.guestName }}</h2>
        <span class="text-xs text-muted-foreground">{{ selectedConversation.listingName }}</span>
        <span
          class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
          :style="{ backgroundColor: `${otaColorMap[selectedConversation.otaSource] ?? '#888'}20`, color: otaColorMap[selectedConversation.otaSource] ?? '#888' }"
        >
          {{ selectedConversation.otaSource }}
        </span>
        <span :class="cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', statusBadge(selectedConversation.status).class)">
          {{ statusBadge(selectedConversation.status).label }}
        </span>
      </div>

      <div class="flex items-center gap-1">
        <Button
          v-if="selectedConversation.status !== 'done'"
          variant="ghost"
          size="sm"
          @click="markAsDone(selectedConversation.id)"
        >
          <Icon name="lucide:check-circle" class="size-4 mr-1" />
          Mark as Done
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon-sm">
              <Icon name="lucide:more-vertical" class="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Assign</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
            <DropdownMenuItem>Mute</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <ScrollArea class="flex-1 p-4">
      <div class="flex flex-col gap-4">
        <InboxThreadMessage
          v-for="msg of displayMessages"
          :key="msg.id"
          :message="msg"
        />

        <InboxHostbuddySuggestion
          v-if="showSuggestion && aiSuggestion"
          :suggestion="aiSuggestion"
          @use="emit('useSuggestion', $event)"
          @dismiss="dismissSuggestion"
        />
      </div>
    </ScrollArea>

    <InboxReplyBox
      :channel="selectedConversation.otaSource"
      :conversation-id="selectedConversation.id"
    />
  </div>
</template>