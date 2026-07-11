import { ref } from 'vue'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  toolCalls?: ToolCallDisplay[]
  attachments?: Array<{
    name: string
    type: string
    size: number
    url?: string
  }>
  confirmation?: {
    title: string
    description: string
    actionLabel: string
    details: Array<{ label: string, value: string }>
  }
  approvalState?: 'pending' | 'approved' | 'rejected'
}

export interface ToolCallDisplay {
  id: string
  name: string
  args: Record<string, any>
  displayName: string
  status: 'running' | 'completed'
}

// Shared state via useState so panel open state and messages
// survive across components (ElevAIButton + ElevAIPanel + chat).
const useAssistantState = () => {
  const isOpen = useState<boolean>('elevai-open', () => false)
  const messages = useState<AssistantMessage[]>('elevai-messages', () => [])
  const isStreaming = useState<boolean>('elevai-streaming', () => false)
  const error = useState<string | null>('elevai-error', () => null)
  const input = useState<string>('elevai-input', () => '')

  function openPanel() {
    isOpen.value = true
  }

  function closePanel() {
    isOpen.value = false
  }

  function togglePanel() {
    isOpen.value = !isOpen.value
  }

  function clear() {
    messages.value = []
    error.value = null
  }

  function appendUserMessage(
    content: string,
    attachments?: Array<{ name: string, type: string, size: number, url?: string }>,
  ) {
    messages.value = [
      ...messages.value,
      {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      },
    ]
  }

  function appendAssistantPlaceholder() {
    const id = `msg-${Date.now()}-assistant`
    messages.value = [
      ...messages.value,
      { id, role: 'assistant', content: '', toolCalls: [] },
    ]
    return id
  }

  function appendTextDelta(assistantId: string, delta: string) {
    messages.value = messages.value.map(m =>
      m.id === assistantId ? { ...m, content: m.content + delta } : m,
    )
  }

  function appendToolCall(assistantId: string, toolCall: ToolCallDisplay) {
    messages.value = messages.value.map(m =>
      m.id === assistantId
        ? { ...m, toolCalls: [...(m.toolCalls ?? []), toolCall] }
        : m,
    )
  }

  function setConfirmation(assistantId: string, confirmation: AssistantMessage['confirmation']) {
    messages.value = messages.value.map(m =>
      m.id === assistantId
        ? { ...m, confirmation: confirmation ?? undefined, approvalState: 'pending' }
        : m,
    )
  }

  function setApprovalState(assistantId: string, state: 'approved' | 'rejected') {
    messages.value = messages.value.map(m =>
      m.id === assistantId ? { ...m, approvalState: state } : m,
    )
  }

  async function submit(text: string, attachments: Array<{ name: string, type: string, size: number }> = []) {
    if ((!text.trim() && attachments.length === 0) || isStreaming.value) return

    // Append attachment names to the user message so the matcher / resolver
    // see them. Real AI would upload the files separately; v1 is text-only.
    const attachmentSuffix = attachments.length
      ? (text.trim() ? '\n\n[Attached: ' + attachments.map(a => a.name).join(', ') + ']'
                     : '[Attached: ' + attachments.map(a => a.name).join(', ') + ']')
      : ''
    const trimmed = (text.trim() + attachmentSuffix).slice(0, 2000)
    appendUserMessage(trimmed, attachments.length > 0 ? attachments : undefined)
    input.value = ''
    isStreaming.value = true
    error.value = null

    const assistantId = appendAssistantPlaceholder()

    try {
      // Use runtime config to get baseURL (default '/dashboard/' in dev).
      // Plain fetch() with a path needs the baseURL prepended manually
      // because baseURL is not part of the JS origin (Nuxt serves under
      // /dashboard/ but window.location.origin is still http://localhost:3007).
      const baseURL = useRuntimeConfig().app.baseURL || ''
      const response = await fetch(`${baseURL}api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value
            .filter(m => m.role !== 'system')
            .map(m => ({ role: m.role, content: m.content })),
          attachments,
        }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Server returned ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const dataStr = line.slice(6)
          try {
            const data = JSON.parse(dataStr)
            if (data.type === 'tool_call') {
              appendToolCall(assistantId, {
                id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: data.toolName,
                args: data.args,
                displayName: humanizeToolName(data.toolName),
                status: 'completed',
              })
            }
            else if (data.type === 'text' && data.delta) {
              appendTextDelta(assistantId, data.delta)
            }
            else if (data.type === 'confirmation' && data.data) {
              setConfirmation(assistantId, data.data)
            }
            else if (data.type === 'finish') {
              break
            }
          }
          catch (parseErr) {
            // Skip malformed lines
          }
        }
      }
    }
    catch (err: any) {
      error.value = err.message ?? 'Something went wrong'
      // Append error inline to the assistant message
      appendTextDelta(assistantId, '\n\n⚠️ Connection lost.')
      toast.error('Something went wrong')
    }
    finally {
      isStreaming.value = false
    }
  }

  function stop() {
    isStreaming.value = false
    // Note: the fetch continues but UI stops showing loader.
    // A full abort would require an AbortController (future enhancement).
  }

  return {
    isOpen,
    messages,
    isStreaming,
    error,
    input,
    openPanel,
    closePanel,
    togglePanel,
    clear,
    submit,
    stop,
  }
}

function humanizeToolName(name: string): string {
  // v2 safety fallback: today the server always sends `displayName` alongside the
  // tool call, so this map is unused in practice. Keep it so a v2 server (or a
  // tool call arriving without a pre-computed displayName) still gets a
  // human-readable label.
  const map: Record<string, string> = {
    get_upcoming_checkins: 'Looked up upcoming check-ins',
    get_upcoming_checkouts: 'Looked up upcoming check-outs',
    get_current_bookings: 'Looked up in-house guests',
    get_cleaning_schedule: 'Looked up cleaning schedule',
    get_listings_overview: 'Looked up listings',
    get_listings_performance: 'Looked up listing performance',
    get_occupancy_rate: 'Calculated occupancy',
    get_revenue_summary: 'Looked up revenue',
    get_revenue_by_listing: 'Looked up revenue by listing',
    get_repeat_guests: 'Looked up repeat guests',
    get_pending_tasks: 'Looked up open tasks',
    get_costs: 'Looked up costs',
    get_upsells: 'Looked up upsells',
  }
  return map[name] ?? name
}

export function useAssistant() {
  return useAssistantState()
}
