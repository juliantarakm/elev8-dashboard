import type { Conversation, ConversationStatus, Message, Note, Reservation, StayStatus } from '~/components/inbox/data/conversations'
import { conversations as conversationsData, messages, reservations, staffMembers } from '~/components/inbox/data/conversations'

export type SortOption = 'newest' | 'oldest' | 'unread'

export function useInbox() {
  const conversations = useState<Conversation[]>('inbox-conversations', () => conversationsData)
  const selectedConversationId = useState<string | undefined>('inbox-selected-conversation', () => undefined)
  const showActionNeeded = useState<boolean>('inbox-show-action-needed', () => true)
  const assignedToMeFilter = useState<boolean>('inbox-assigned-to-me-filter', () => false)
  const unreadFilter = useState<boolean>('inbox-unread-filter', () => false)
  const activeStayFilter = useState<StayStatus | 'all'>('inbox-active-stay-filter', () => 'all')
  const activeListingFilter = useState<string[]>('inbox-active-listing-filter', () => [])
  const activeTagFilters = useState<string[]>('inbox-active-tag-filters', () => [])
  const listingSearchText = useState<string>('inbox-listing-search-text', () => '')
  interface ElevaiConvState { on: boolean, pausedUntil?: number }
  const elevaiState = useState<Record<string, ElevaiConvState>>('inbox-elevai-state', () => ({}))
  const searchValue = useState<string>('inbox-search-value', () => '')
  const rightPanelCollapsed = useState<boolean>('inbox-right-panel-collapsed', () => false)
  const sortBy = useState<SortOption>('inbox-sort-by', () => 'newest')
  const pendingSuggestion = useState<string>('inbox-pending-suggestion', () => '')

  const notes = useState<Record<string, Note[]>>('inbox-notes', () => ({}))

  const filteredConversations = computed(() => {
    let result = conversations.value

    if (showActionNeeded.value) {
      result = result.filter(c => c.status === 'action_needed')
    }

    if (assignedToMeFilter.value) {
      result = result.filter(c => c.isAssignedToMe)
    }

    if (unreadFilter.value) {
      result = result.filter(c => c.unreadCount > 0)
    }

    if (activeStayFilter.value !== 'all') {
      result = result.filter(c => c.stayStatus === activeStayFilter.value)
    }

    if (activeListingFilter.value.length > 0) {
      result = result.filter(c => activeListingFilter.value.includes(c.propertyName))
    }

    if (searchValue.value) {
      const q = searchValue.value.toLowerCase()
      result = result.filter(
        c =>
          c.guestName.toLowerCase().includes(q)
          || c.listingName.toLowerCase().includes(q)
          || c.propertyName.toLowerCase().includes(q)
          || c.lastMessage.toLowerCase().includes(q)
          || c.labels.some(l => l.toLowerCase().includes(q))
          || c.tags.some(t => t.toLowerCase().includes(q))
          || c.stayStatus.toLowerCase().includes(q)
          || c.otaSource.toLowerCase().includes(q),
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
    return conversations.value.find(c => c.id === selectedConversationId.value)
  })

  watch(selectedConversationId, (id) => {
    if (!id) return
    const index = conversations.value.findIndex(c => c.id === id)
    if (index !== -1 && conversations.value[index].unreadCount > 0) {
      conversations.value[index] = { ...conversations.value[index], unreadCount: 0 }
    }
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
    const s = elevaiState.value[conversationId]
    if (!s) return true
    if (s.pausedUntil !== undefined) return Date.now() > s.pausedUntil
    return s.on
  }

  function getElevaiState(conversationId: string) {
    return elevaiState.value[conversationId] ?? { on: true }
  }

  function enableElevai(conversationId: string) {
    elevaiState.value = { ...elevaiState.value, [conversationId]: { on: true } }
  }

  function pauseElevai(conversationId: string, minutes: number) {
    elevaiState.value = {
      ...elevaiState.value,
      [conversationId]: { on: false, pausedUntil: Date.now() + minutes * 60 * 1000 },
    }
  }

  function disableElevai(conversationId: string) {
    elevaiState.value = { ...elevaiState.value, [conversationId]: { on: false } }
  }

  function markAsHandled(conversationId: string) {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations.value[index] = { ...conversations.value[index], status: null }
      const conv = conversations.value[index]
      if (conv.reservationId && reservations[conv.reservationId]) {
        reservations[conv.reservationId].smartActions = []
      }
    }
  }

  function markAsUnread(conversationId: string) {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1 && conversations.value[index].unreadCount === 0)
      conversations.value[index] = { ...conversations.value[index], unreadCount: 1 }
  }

  function assignTo(conversationId: string, staffId: string | null) {
    const index = conversations.value.findIndex(c => c.id === conversationId)
    if (index !== -1) {
      conversations.value[index] = {
        ...conversations.value[index],
        assignedTo: staffId,
        isAssignedToMe: staffId === 'staff-2',
      }
    }
  }

  function getAssignedStaff(conv: Conversation) {
    if (!conv.assignedTo) return null
    return staffMembers.find(s => s.id === conv.assignedTo) ?? null
  }

  function getNotes(conversationId: string): Note[] {
    const convNotes = notes.value[conversationId]
    if (convNotes) return convNotes
    const conv = conversations.value.find(c => c.id === conversationId)
    if (!conv) return []
    const resId = conv.reservationId
    const res = reservations[resId]
    const guestNotes = res?.guestDetails?.notes
    if (!guestNotes) return []
    const initial: Note[] = [{
      id: `note-guest-${conversationId}`,
      content: guestNotes,
      authorId: 'guest',
      authorName: conv.guestName,
      createdAt: conv.lastMessageAt,
      visibleToAI: true,
    }]
    notes.value = { ...notes.value, [conversationId]: initial }
    return initial
  }

  function addNote(conversationId: string, content: string, visibleToAI: boolean) {
    const convNotes = getNotes(conversationId)
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      authorId: 'staff-2',
      authorName: 'Komang Juliantara',
      createdAt: new Date().toISOString(),
      visibleToAI,
    }
    notes.value = { ...notes.value, [conversationId]: [...convNotes, newNote] }
  }

  function actionNeededCount(): number {
    return conversations.value.filter(c => c.status === 'action_needed').length
  }

  function assignedToMeCount(): number {
    return conversations.value.filter(c => c.isAssignedToMe).length
  }

  function totalCount(): number {
    return conversations.value.length
  }

  function stayCountByStatus(status: StayStatus): number {
    return conversations.value.filter(c => c.stayStatus === status).length
  }

  const allListingOptions = computed(() => {
    const map = new Map<string, number>()
    for (const c of conversations.value) {
      map.set(c.listingName, (map.get(c.listingName) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  })

  const listingOptions = computed(() => {
    let convs = conversations.value

    if (activeTagFilters.value.length > 0) {
      convs = convs.filter(c =>
        activeTagFilters.value.every(tag => c.tags.includes(tag)),
      )
    }

    if (listingSearchText.value) {
      const q = listingSearchText.value.toLowerCase()
      convs = convs.filter(c =>
        c.listingName.toLowerCase().includes(q),
      )
    }

    const map = new Map<string, number>()
    for (const c of convs) {
      map.set(c.propertyName, (map.get(c.propertyName) ?? 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  })

  const listingTags = computed(() => {
    const map = new Map<string, number>()
    for (const c of conversations.value) {
      for (const tag of c.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  })

  function toggleListingFilter(name: string) {
    const current = [...activeListingFilter.value]
    const idx = current.indexOf(name)
    if (idx !== -1) {
      current.splice(idx, 1)
    }
    else {
      current.push(name)
    }
    activeListingFilter.value = current
  }

  function clearListingFilters() {
    activeListingFilter.value = []
  }

  function toggleTagFilter(tag: string) {
    const current = [...activeTagFilters.value]
    const idx = current.indexOf(tag)
    if (idx !== -1) {
      current.splice(idx, 1)
    }
    else {
      current.push(tag)
    }
    activeTagFilters.value = current
  }

  function clearTagFilters() {
    activeTagFilters.value = []
  }

  function clearAllListingFilters() {
    activeListingFilter.value = []
    activeTagFilters.value = []
    listingSearchText.value = ''
  }

  function useSuggestion(content: string) {
    pendingSuggestion.value = content
  }

  function clearSuggestion() {
    pendingSuggestion.value = ''
  }

  return {
    selectedConversationId,
    showActionNeeded,
    assignedToMeFilter,
    unreadFilter,
    activeStayFilter,
    activeListingFilter,
    activeTagFilters,
    listingSearchText,
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
    getElevaiState,
    enableElevai,
    pauseElevai,
    disableElevai,
    markAsHandled,
    markAsUnread,
    assignTo,
    getAssignedStaff,
    actionNeededCount,
    assignedToMeCount,
    totalCount,
    stayCountByStatus,
    allListingOptions,
    listingOptions,
    listingTags,
    toggleListingFilter,
    clearListingFilters,
    toggleTagFilter,
    clearTagFilters,
    clearAllListingFilters,
    useSuggestion,
    clearSuggestion,
    getNotes,
    addNote,
  }
}