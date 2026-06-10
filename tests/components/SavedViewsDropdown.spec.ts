import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SavedViewsDropdown from '~/components/listings/SavedViewsDropdown.vue'

describe('savedViewsDropdown', () => {
  it('renders button with default text', () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [],
        activeView: null,
        isDirty: false,
        isLoading: false,
      },
    })

    expect(wrapper.text()).toContain('Saved Views')
  })

  it('renders active view name', () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [],
        activeView: { id: '1', name: 'My View' } as any,
        isDirty: false,
        isLoading: false,
      },
    })

    expect(wrapper.text()).toContain('Saved Views: My View')
  })

  it('emits save-as event when clicking save option', async () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [],
        activeView: null,
        isDirty: false,
        isLoading: false,
      },
    })

    await wrapper.find('[data-testid="save-as-option"]').trigger('click')

    expect(wrapper.emitted('save-as')).toBeTruthy()
  })

  it('emits load-view event when clicking a view', async () => {
    const wrapper = mount(SavedViewsDropdown, {
      props: {
        savedViews: [{ id: '1', name: 'My View' } as any],
        activeView: null,
        isDirty: false,
        isLoading: false,
      },
    })

    await wrapper.find('[data-testid="view-item-1"]').trigger('click')

    expect(wrapper.emitted('load-view')?.[0]).toEqual(['1'])
  })
})
