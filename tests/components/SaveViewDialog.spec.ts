import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SaveViewDialog from '~/components/listings/SaveViewDialog.vue'

describe('SaveViewDialog', () => {
  it('renders dialog with name input', () => {
    const wrapper = mount(SaveViewDialog, {
      props: {
        open: true,
      },
    })

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Save current view')
  })

  it('emits save event with name', async () => {
    const wrapper = mount(SaveViewDialog, {
      props: {
        open: true,
      },
    })

    const input = wrapper.find('input[type="text"]')
    await input.setValue('My View')

    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('save')?.[0]).toEqual(['My View'])
  })

  it('does not emit save with empty name', async () => {
    const wrapper = mount(SaveViewDialog, {
      props: {
        open: true,
      },
    })

    await wrapper.find('button[type="submit"]').trigger('click')

    expect(wrapper.emitted('save')).toBeUndefined()
  })
})