<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'
import { otaSources } from '~/components/inbox/data/conversations'

const {
  selectedConversation,
  selectedMessages,
  markAsDone,
  isElevaiEnabled,
  useSuggestion,
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

function handleUseSuggestion(content: string) {
  useSuggestion(content)
}

function dismissSuggestion() {
  if (aiSuggestion.value) {
    dismissedSuggestions.value.push(aiSuggestion.value.id)
  }
}

const otaColorMap: Record<string, string> = Object.fromEntries(otaSources.map(s => [s.name, s.color]))

const statusVariantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  needs_reply: 'default',
  waiting_on_guest: 'secondary',
  done: 'outline',
}

const statusLabelMap: Record<string, string> = {
  needs_reply: 'Needs Reply',
  waiting_on_guest: 'Waiting',
  done: 'Done',
}
</script>

<template>
  <div v-if="!selectedConversation" class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
    <Icon name="lucide:message-square" class="size-12" />
    <p class="text-sm">Select a conversation</p>
  </div>

  <div v-else class="flex flex-col h-full">
    <div class="flex items-center px-4 h-[56px]">
      <div class="flex flex-col justify-center min-w-0 flex-1">
        <span class="font-semibold text-sm truncate">{{ selectedConversation.guestName }}</span>
        <div class="flex items-center gap-1.5">
          <span class="text-xs text-muted-foreground truncate">{{ selectedConversation.listingName }}</span>
          <Badge
            :style="{ backgroundColor: `${otaColorMap[selectedConversation.otaSource] ?? '#888'}20`, color: otaColorMap[selectedConversation.otaSource] ?? '#888' }"
            class="text-[10px]"
          >
            {{ selectedConversation.otaSource }}
          </Badge>
          <Badge :variant="statusVariantMap[selectedConversation.status] ?? 'outline'" class="text-[10px]">
            {{ statusLabelMap[selectedConversation.status] ?? selectedConversation.status }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              v-if="selectedConversation.status !== 'done'"
              variant="outline"
              size="sm"
              @click="markAsDone(selectedConversation.id)"
            >
              <Icon name="lucide:check-circle" class="size-4 mr-1" />
              Mark as Done
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mark conversation as done</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon">
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
    <Separator />

    <div class="flex-1 min-h-0">
      <ScrollArea class="h-full p-4">
        <div class="flex flex-col gap-4">
          <InboxThreadMessage
            v-for="msg of displayMessages"
            :key="msg.id"
            :message="msg"
          />
        </div>
      </ScrollArea>
    </div>

    <div v-if="showSuggestion && aiSuggestion" class="shrink-0 px-4 py-2">
      <InboxHostbuddySuggestion
        :suggestion="aiSuggestion"
        @use="handleUseSuggestion"
        @dismiss="dismissSuggestion"
      />
    </div>

    <div class="shrink-0 border-t bg-background">
      <InboxReplyBox
        :channel="selectedConversation.otaSource"
        :conversation-id="selectedConversation.id"
      />
    </div>
  </div>
</template>