<script lang="ts" setup>
import type { Message } from '~/components/inbox/data/conversations'
import { isToday, isYesterday, differenceInDays, format } from 'date-fns'
import { toast } from 'vue-sonner'

const { selectedConversation,
  selectedMessages,
  selectedReservation,
  markAsHandled,
  markAsUnread,
  isElevaiEnabled,
  useSuggestion,
  getNotes,
  addNote,
  rightPanelCollapsed,
  toggleRightPanel,
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

const threadItems = computed(() => {
  const msgs = displayMessages.value.map(m => ({ type: 'message' as const, data: m, timestamp: m.timestamp }))
  const notes = conversationNotes.value
    .filter(n => n.authorId !== 'guest')
    .map(n => ({ type: 'note' as const, data: n, timestamp: n.createdAt }))
  const combined = [...msgs, ...notes]
  combined.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  return combined
})

const aiSuggestion = computed(() =>
  selectedMessages.value.find(m => m.isAISuggestion),
)

function getDateLabel(timestamp: string) {
  const date = new Date(timestamp)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  const daysAgo = differenceInDays(new Date(), date)
  if (daysAgo <= 3) return format(date, 'EEEE')
  return format(date, 'EEEE, d MMM yyyy')
}

const showSuggestion = computed(() => {
  if (!aiSuggestion.value) return false
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

const statusVariantMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  action_needed: 'destructive',
}

const statusLabelMap: Record<string, string> = {
  action_needed: 'Action Needed',
}

const stayDateLabel = computed(() => {
  const res = selectedReservation.value
  if (!res?.checkIn || !res?.checkOut) return ''
  return `${format(new Date(res.checkIn), 'd MMM yyyy')} – ${format(new Date(res.checkOut), 'd MMM yyyy')}`
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
  return format(date, 'EEEE, MMMM d yyyy, h:mm a')
}
</script>

<template>
  <div v-if="!selectedConversation" class="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
    <Icon name="lucide:message-square" class="size-12" />
    <p class="text-sm">Select a conversation</p>
  </div>

  <div v-else class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center px-4 h-[56px]">
      <div class="flex flex-col justify-center min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm truncate">{{ selectedConversation.guestName }}</span>
          <Badge v-if="selectedConversation.status === 'action_needed'" :variant="statusVariantMap[selectedConversation.status]" class="text-[10px]">
            {{ statusLabelMap[selectedConversation.status] }}
          </Badge>
        </div>
        <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon v-if="stayDateLabel" name="lucide:calendar" class="size-3 shrink-0" />
          <span v-if="stayDateLabel" class="shrink-0">{{ stayDateLabel }}</span>
          <span v-if="stayDateLabel" class="shrink-0">·</span>
          <span class="truncate">{{ selectedConversation.listingName }}</span>
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
              Mark as Resolved
            </Button>
          </TooltipTrigger>
          <TooltipContent>Resolve action needed for this guest</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="toggleRightPanel">
              <Icon :name="rightPanelCollapsed ? 'lucide:panel-right' : 'lucide:panel-right-close'" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ rightPanelCollapsed ? 'Show' : 'Hide' }} reservation panel</TooltipContent>
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

    <div class="flex flex-col flex-1 overflow-hidden">
      <div class="flex items-center border-b h-8 px-4 shrink-0">
        <button
          :class="['text-xs px-3 py-1 font-medium transition-colors relative', activeThreadTab === 'messages' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground']"
          @click="activeThreadTab = 'messages'"
        >
          Messages
          <span v-if="activeThreadTab === 'messages'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        </button>
        <button
          :class="['text-xs px-3 py-1 font-medium transition-colors relative', activeThreadTab === 'notes' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground']"
          @click="activeThreadTab = 'notes'"
        >
          Notes
          <Badge v-if="conversationNotes.length" variant="secondary" class="ml-1 text-[10px] h-4 px-1">{{ conversationNotes.length }}</Badge>
          <span v-if="activeThreadTab === 'notes'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        </button>
      </div>

      <div v-if="activeThreadTab === 'messages'" class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea class="flex-1 min-h-0">
          <div class="flex flex-col gap-4 p-4 pb-32">
            <template v-for="(item, index) of threadItems" :key="item.data.id">
              <div v-if="index === 0 || getDateLabel(item.timestamp) !== getDateLabel(threadItems[index - 1].timestamp)" class="flex items-center justify-center">
                <Badge variant="outline" class="text-xs text-muted-foreground">
                  {{ getDateLabel(item.timestamp) }}
                </Badge>
              </div>
              <InboxThreadMessage v-if="item.type === 'message'" :message="item.data" />
              <div v-else class="flex justify-end">
                <div class="flex flex-col gap-1 max-w-[75%]">
                  <div class="flex items-center gap-2">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10">
                      <Icon name="lucide:sticky-note" class="size-4 text-warning" />
                    </div>
                    <span class="text-xs font-medium">Internal Note</span>
                    <span v-if="item.data.visibleToAI" class="inline-flex items-center gap-0.5 text-[10px] text-[#FBC800]">
                      <Icon name="lucide:sparkles" class="size-3" />
                      ElevAI
                    </span>
                    <span v-if="getDateLabel(item.timestamp)" class="text-[10px] text-muted-foreground">{{ getDateLabel(item.timestamp) }} · </span>
                    <span class="text-[10px] text-muted-foreground">{{ formatNoteDate(item.data.createdAt) }}</span>
                  </div>
                  <div class="rounded-2xl bg-warning text-warning-foreground px-3 py-2 text-sm">
                    {{ item.data.content }}
                  </div>
                </div>
              </div>
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
            :stay-status="selectedConversation.stayStatus"
          />
        </div>
      </div>

      <div v-if="activeThreadTab === 'notes'" class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <ScrollArea class="flex-1 min-h-0">
          <div class="p-4 space-y-3 pb-32">
            <div v-for="note of conversationNotes" :key="note.id" class="rounded-lg border bg-muted/50 p-3">
              <p class="text-sm leading-relaxed">{{ note.content }}</p>
              <div class="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <span>{{ note.authorName }}</span>
                <span>·</span>
                <span>{{ formatNoteDate(note.createdAt) }}</span>
                <span v-if="note.visibleToAI" class="inline-flex items-center gap-0.5 text-[#FBC800]">
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
                <Icon name="lucide:sparkles" class="size-3 text-[#FBC800]" />
                Let ElevAI read this note
              </label>
              <Button size="sm" :disabled="!newNoteContent.trim()" @click="handleAddNote">
                Add Note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>