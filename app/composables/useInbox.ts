import type { Conversation, ConversationStatus, Message, Reservation } from '~/components/inbox/data/conversations'
import { conversations, messages, reservations } from '~/components/inbox/data/conversations'

export function useInbox() {
  const selectedConversationId = useState<string | null>('inbox-selected-conversation', () => null)
  const activeFilter = useState<ConversationStatus | 'all'>('inbox-active-filter', () => 'all')
  const elevaiEnabled = useState<Record<string, boolean>>('inbox-elevai-enabled', () => ({}))
  const searchValue = useState<string>('inbox-search-value', () => '')
  const rightPanelCollapsed = useState<boolean>('inbox-right-panel-collapsed', () => false)

  const filteredConversations = computed(() => {
    let result = conversations

    if (activeFilter.value !== 'all') {
      result = result.filter(c => c.status === activeFilter.value)
    }

    if (searchValue.value) {
      const q = searchValue.value.toLowerCase()
      result = result.filter(
        c =>
          c.guestName.toLowerCase().includes(q)
          || c.listingName.toLowerCase().includes(q)
          || c.lastMessage.toLowerCase().includes(q),
      )
    }

    return result
  })

  const selectedConversation = computed<Conversation | null>(() => {
    if (!selectedConversationId.value)
      return null
    return conversations.find(c => c.id === selectedConversationId.value) ?? null
  })

  const selectedMessages = computed<Message[]>(() => {
    if (!selectedConversationId.value)
      return []
    return messages[selectedConversationId.value] ?? []
  })

  const selectedReservation = computed<Reservation | null>(() => {
    const conv = selectedConversation.value
    if (!conv)
      return null
    return reservations[conv.reservationId] ?? null
  })

  const selectedHasAISuggestion = computed<boolean>(() => {
    return selectedMessages.value.some(m => m.isAISuggestion)
  })

  function isElevaiEnabled(conversationId: string): boolean {
    return elevaiEnabled.value[conversationId] !== false
  }

  function toggleElevai(conversationId: string) {
    elevaiEnabled.value = {
      ...elevaiEnabled.value,
      [conversationId]: !isElevaiEnabled(conversationId),
    }
  }

  function markAsDone(conversationId: string) {
    const conv = conversations.find(c => c.id === conversationId)
    if (conv)
      conv.status = 'done'
  }

  function unreadCountByStatus(status: ConversationStatus): number {
    return conversations.filter(c => c.status === status).reduce((sum, c) => sum + c.unreadCount, 0)
  }

  function unreadNeedsReply(): number {
    return conversations.filter(c => c.status === 'needs_reply').reduce((sum, c) => sum + c.unreadCount, 0)
  }

  return {
    selectedConversationId,
    activeFilter,
    elevaiEnabled,
    searchValue,
    rightPanelCollapsed,
    filteredConversations,
    selectedConversation,
    selectedMessages,
    selectedReservation,
    selectedHasAISuggestion,
    isElevaiEnabled,
    toggleElevai,
    markAsDone,
    unreadCountByStatus,
    unreadNeedsReply,
  }
}