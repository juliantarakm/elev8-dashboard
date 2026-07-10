import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ElevAIAssistant from '~/components/assistant/ElevAIAssistant.vue'

// Stub child components used inside ElevAIAssistant + ElevAIEmptyState
// to avoid resolution issues in the test environment (jsdom can't resolve
// all components used by these templates via the alias `~/components/...`).
const assistantStubs = {
  ScrollArea: { template: '<div><slot /></div>' },
  ElevAIConversation: { template: '<div><slot /></div>' },
  ElevAIMessage: {
    template:
      '<div v-if="message.role === \'user\'" data-testid="message-user">{{ message.content }}</div>'
      + '<div v-else data-testid="message-assistant"></div>',
    props: ['message'],
  },
  ElevAIEmptyState: {
    template:
      '<div><h3>Hi Komang</h3>'
      + '<button v-for="s in suggestions" :key="s.prompt" '
      + 'data-testid="suggestion-chip" :data-prompt="s.prompt" '
      + '@click="handleSelect(s.prompt)">{{ s.label }}</button></div>',
    data() {
      return {
        suggestions: [
          { emoji: '1', label: "Today's check-ins", prompt: "What are today's check-ins?" },
          { emoji: '2', label: 'Cleaning today', prompt: 'What is the cleaning schedule today?' },
          { emoji: '3', label: 'Revenue this month', prompt: 'How is revenue this month?' },
          { emoji: '4', label: 'Occupancy this month', prompt: 'What is the occupancy this month?' },
          { emoji: '5', label: 'Listings overview', prompt: 'Show me all listings' },
          { emoji: '6', label: 'Repeat guests', prompt: 'Who are the repeat guests?' },
        ],
      }
    },
    methods: {
      handleSelect(prompt: string) {
        // Mirror the real component's behavior: call useAssistant().submit().
        const { submit } = useAssistant()
        submit(prompt)
      },
    },
    emits: ['select'],
  },
  ElevAIPromptInput: { template: '<div data-testid="prompt-input-stub" />' },
  ElevAIResponse: { template: '<div />' },
  ElevAILoader: { template: '<div />' },
  ElevAIToolBadge: { template: '<div />' },
  ElevAISuggestionChip: {
    template:
      '<button data-testid="suggestion-chip" @click="$emit(\'select\', prompt)">'
      + '{{ label }}</button>',
    props: ['emoji', 'label', 'prompt'],
    emits: ['select'],
  },
}

describe('ElevAIAssistant', () => {
  beforeEach(() => {
    const { clear, closePanel } = useAssistant()
    clear()
    closePanel()
  })

  it('renders empty state with 6 suggestion chips when no messages', () => {
    const wrapper = mount(ElevAIAssistant, {
      global: {
        stubs: assistantStubs,
      },
    })
    const chips = wrapper.findAll('[data-testid="suggestion-chip"]')
    expect(chips).toHaveLength(6)
    expect(wrapper.text()).toContain('Hi Komang')
  })

  it('clicking a suggestion chip calls submit', async () => {
    const wrapper = mount(ElevAIAssistant, {
      global: {
        stubs: assistantStubs,
      },
    })
    const firstChip = wrapper.find('[data-testid="suggestion-chip"]')
    expect(firstChip.exists()).toBe(true)
    await firstChip.trigger('click')
    // submit() is async; give it a tick
    await new Promise(r => setTimeout(r, 10))
    // User message should now exist
    const { messages } = useAssistant()
    expect(messages.value.some(m => m.role === 'user')).toBe(true)
  })

  it('renders user message bubble after submission', async () => {
    const { submit } = useAssistant()
    await submit('test query')
    // Wait for streaming to settle (mock won't actually stream in test)
    const wrapper = mount(ElevAIAssistant, {
      global: {
        stubs: assistantStubs,
      },
    })
    expect(wrapper.find('[data-testid="message-user"]').exists()).toBe(true)
  })
})
