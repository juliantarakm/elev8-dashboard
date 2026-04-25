<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'
import { otaSources } from '~/components/inbox/data/conversations'
import { isToday, isYesterday, differenceInDays, format } from 'date-fns'
import { toast } from 'vue-sonner'

const { selectedConversation,
  selectedMessages,
  selectedReservation,
  markAsHandled,
  markAsUnread,
  getAssignedStaff,
  isElevaiEnabled,
  useSuggestion,
  getNotes,
  addNote,
} = useInbox()

const activeThreadTab = ref<'messages' | 'notes'>('messages')

const newNoteContent = ref('')
const newNoteVisibleToAI = ref(false)

const conversationNotes = computed(() => {
  if (!selectedConversation.value) return []
  return getNotes(selectedConversation.value.id)
})

const dismissedSuggestions = ref<string[]>([])

const displayMessages = computed(() =>
  selectedMessages.value.filter(m => !m.isAISuggestion),
)

const aiSuggestion = computed(() =>
  selectedMessages.value.find(m => m.isAISuggestion),
)

function getDateLabel(timestamp: string) {
  const date = new Date(timestamp)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  const daysAgo = differenceInDays(new Date(), date)
  if (daysAgo <= 3) return format(date, 'EEEE')
  return format(date, 'MMM d')
}

const showSuggestion = computed(() => {
  if (aiSuggestion.value) return false
  if (dismissedSuggestions.value.includes(aiSuggestion.value.id)) return false
  return selectedConversation.value ? isElevaiEnabled(selectedConversation.value.id) : false
})

function handleUseSuggestion(content: string) {
  useSuggestion(content)
  toast.success('Suggestion applied to reply box')
}

function dismissSuggestion() {
  if (aiSuggestion.value) {
    dismissedSuggestions.value.push(aiSuggestion.value.id)
  }
}

const otaIconMap: Record<string, string> = Object.fromEntries(otaSources.map(s => [s.name, s.icon]))

const statusVariantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  action_needed: 'destructive',
}

const statusLabelMap: Record<string, string> = {
  action_needed: 'Action Needed',
}

const assignedStaff = computed(() => {
  if (!selectedConversation.value) return null
  return getAssignedStaff(selectedConversation.value)
})

function handleMarkAsHandled() {
  if (!selectedConversation.value) return
  markAsHandled(selectedConversation.value.id)
  toast.success('Marked as handled')
}

function handleMarkAsUnread() {
  if (!selectedConversation.value) return
  markAsUnread(selectedConversation.value.id)
  toast.info('Marked as unread')
}

function handleAddNote() {
  if (!selectedConversation.value || !newNoteContent.value.trim()) return
  addNote(selectedConversation.value.id, newNoteContent.value.trim(), newNoteVisibleToAI.value)
  newNoteContent.value = ''
  newNoteVisibleToAI.value = false
  toast.success('Note added')
}

function formatNoteDate(timestamp: string) {
  const date = new Date(timestamp)
  return format(date, 'MMM d, h:mm a')
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
          <Icon :name="otaIconMap[selectedConversation.otaSource] ?? 'lucide:globe'" class="size-4 shrink-0" />
          <Badge v-if="selectedConversation.status === 'action_needed'" :variant="statusVariantMap[selectedConversation.status]" class="text-[10px]">
            {{ statusLabelMap[selectedConversation.status] }}
          </Badge>
          <span v-if="assignedStaff" class="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Icon name="lucide:user-check" class="size-3" />
            {{ assignedStaff.name }}
          </span>
          <span v-else class="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Icon name="lucide:user-x" class="size-3" />
            Unassigned
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              v-if="selectedConversation.status === 'action_needed'"
              variant="outline"
              size="sm"
              @click="handleMarkAsHandled"
            >
              <Icon name="lucide:check-circle" class="size-4 mr-1" />
              Mark as Handled
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
            <DropdownMenuItem>Archive</DropdownMenuItem>
            <DropdownMenuItem>Mute</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleMarkAsUnread">
              <Icon name="lucide:mail" class="size-4 mr-2" />
              Mark as Unread
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    <Separator />

    <Tabs v-model="activeThreadTab" class="flex flex-col min-h-0 flex-1">
      <TabsList class="w-full justify-start rounded-none border-b bg-transparent h-8 px-4">
        <TabsTrigger value="messages" class="text-xs">Messages</TabsTrigger>
        <TabsTrigger value="notes" class="text-xs">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="messages" class="flex-1 min-h-0 flex flex-col">
        <ScrollArea class="flex-1 p-4">
          <div class="flex flex-col gap-4">
            <template v-for="(msg, index) of displayMessages" :key="msg.id">
              <div v-if="index === 0 || getDateLabel(msg.timestamp) !== getDateLabel(displayMessages[index - 1].timestamp)" class="flex items-center justify-center">
                <Badge variant="outline" class="text-xs text-muted-foreground">
                  {{ getDateLabel(msg.timestamp) }}
                </Badge>
              </div>
              <InboxThreadMessage :message="msg" />
            </template>
          </div>
        </ScrollArea>

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
      </TabsContent>

      <TabsContent value="notes" class="flex-1 min-h-0 flex flex-col">
        <ScrollArea class="flex-1">
          <div class="p-4 space-y-3">
            <div v-for="note of conversationNotes" :key="note.id" class="rounded-lg border bg-muted/50 p-3">
              <p class="text-sm leading-relaxed">{{ note.content }}</p>
              <div class="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <span>{{ note.authorName }}</span>
                <span>·</span>
                <span>{{ formatNoteDate(note.createdAt) }}</span>
                <span v-if="note.visibleToAI" class="inline-flex items-center gap-0.5 text-[#C8A84B]">
                  <Icon name="lucide:sparkles" class="size-3" />
                  ElevAI
                </span>
              </div>
            </div>
            <div v-if="!conversationNotes.length" class="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Icon name="lucide:sticky-note" class="size-10 mb-2" />
              <p class="text-sm">No notes yet</p>
            </div>
          </div>
        </ScrollArea>
        <div class="shrink-0 border-t bg-background p-3">
          <div class="space-y-2">
            <Textarea v-model="newNoteContent" placeholder="Add a note..." class="min-h-[60px] text-sm resize-none" />
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <Checkbox v-model:checked="newNoteVisibleToAI" class="size-3.5" />
                <Icon name="lucide:sparkles" class="size-3 text-[#C8A84B]" />
                Let ElevAI read this note
              </label>
              <Button size="sm" :disabled="!newNoteContent.trim()" @click="handleAddNote">
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>