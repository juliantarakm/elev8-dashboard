import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAssistant } from '~/composables/useAssistant'

describe('useAssistant', () => {
  beforeEach(() => {
    // Reset the global panel state
    const { isOpen } = useAssistant()
    isOpen.value = false
  })

  it('starts with empty messages and closed panel', () => {
    const { messages, isOpen, isStreaming } = useAssistant()
    expect(messages.value).toEqual([])
    expect(isOpen.value).toBe(false)
    expect(isStreaming.value).toBe(false)
  })

  it('openPanel sets isOpen to true', () => {
    const { isOpen, openPanel } = useAssistant()
    openPanel()
    expect(isOpen.value).toBe(true)
  })

  it('closePanel sets isOpen to false', () => {
    const { isOpen, openPanel, closePanel } = useAssistant()
    openPanel()
    closePanel()
    expect(isOpen.value).toBe(false)
  })

  it('togglePanel flips isOpen', () => {
    const { isOpen, togglePanel } = useAssistant()
    expect(isOpen.value).toBe(false)
    togglePanel()
    expect(isOpen.value).toBe(true)
    togglePanel()
    expect(isOpen.value).toBe(false)
  })

  it('clear empties messages', () => {
    const { messages, clear } = useAssistant()
    messages.value = [
      { id: '1', role: 'user', content: 'hi' },
      { id: '2', role: 'assistant', content: 'hello' },
    ]
    clear()
    expect(messages.value).toEqual([])
  })

  it('panel state is shared across composable instances', () => {
    const a = useAssistant()
    const b = useAssistant()
    a.openPanel()
    expect(b.isOpen.value).toBe(true)
  })

  it('messages state is shared across composable instances', () => {
    const a = useAssistant()
    const b = useAssistant()
    a.messages.value = [{ id: '1', role: 'user', content: 'x' }]
    expect(b.messages.value).toHaveLength(1)
  })
})
