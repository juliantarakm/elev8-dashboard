import type { Conversation, ConversationStatus, Message, Reservation, StayStatus } from '~/components/inbox/data/conversations'
import { conversations, messages, reservations } from '~/components/inbox/data/conversations'

export type SortOption = 'newest' | 'oldest' | 'unread'

export function useInbox() {
  const selectedConversationId = useState<string | undefined>('inbox-selected-conversation', () => undefined)
  const activeFilter = useState<ConversationStatus | 'all'>('inbox-active-filter', () => 'needs_reply')
  const activeStayFilter = useState<StayStatus | 'all'>('inbox-active-stay-filter', () => 'all')
  const elevaiEnabled = useState<Record<string, boolean>>('inbox-elevai-enabled', () => ({}))
  const searchValue = useState<string>('inbox-search-value', () => '')
  const rightPanelCollapsed = useState<boolean>('inbox-right-panel-collapsed', () => false)
  const sortBy = useState<SortOption>('inbox-sort-by', () => 'newest')
  const pendingSuggestion = useState<string>('inbox-pending-suggestion', () => '')

  const filteredConversations = computed(() => {
    let result = conversations

    if (activeFilter.value !== 'all') {
      result = result.filter(c => c.status === activeFilter.value)
    }

    if (activeStayFilter.value !== 'all') {
      result = result.filter(c => c.stayStatus === activeStayFilter.value)
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

    return result.sort((a, b) => {
      if (sortBy.value === 'newest') {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      }
      if (sortBy.value === 'oldest') {
        return new Date(a.lastMessageAt).getTime() - new Date(b.lastMessageAt).getTime()
      }
      if (sortBy.value === 'unread') {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      }
      return 0
    })
  })

  const selectedConversation = computed<Conversation | undefined>(() => {
    if (!selectedConversationId.value)
      return undefined
    return conversations.find(c => c.id === selectedConversationId.value)
  })

  const selectedMessages = computed<Message[]>(() => {
    if (!selectedConversationId.value)
      return []
    return messages[selectedConversationId.value] ?? []
  })

  const selectedReservation = computed<Reservation | undefined>(() => {
    const conv = selectedConversation.value
    if (!conv)
      return undefined
    return reservations[conv.reservationId]
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
    return conversations.filter(c => c.status === status).length
  }

  function unreadNeedsReply(): number {
    return conversations.filter(c => c.status === 'needs_reply').length
  }

  function stayCountByStatus(status: StayStatus): number {
    return conversations.filter(c => c.stayStatus === status).length
  }

  function useSuggestion(content: string) {
    pendingSuggestion.value = content
  }

  function clearSuggestion() {
    pendingSuggestion.value = ''
  }

  return {
    selectedConversationId,
    activeFilter,
    activeStayFilter,
    elevaiEnabled,
    searchValue,
    rightPanelCollapsed,
    sortBy,
    pendingSuggestion,
    filteredConversations,
    conversations,
    selectedConversation,
    selectedMessages,
    selectedReservation,
    selectedHasAISuggestion,
    isElevaiEnabled,
    toggleElevai,
    markAsDone,
    unreadCountByStatus,
    stayCountByStatus,
    unreadNeedsReply,
    useSuggestion,
    clearSuggestion,
  }
}