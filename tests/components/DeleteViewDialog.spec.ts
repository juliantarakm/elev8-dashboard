import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DeleteViewDialog from '~/components/listings/DeleteViewDialog.vue'

describe('DeleteViewDialog', () => {
  it('renders dialog with view name', () => {
    const wrapper = mount(DeleteViewDialog, {
      props: {
        open: true,
        viewName: 'My View',
      },
    })

    expect(wrapper.text()).toContain('Delete "My View"?')
  })

  it('emits delete event on confirm', async () => {
    const wrapper = mount(DeleteViewDialog, {
      props: {
        open: true,
        viewName: 'My View',
      },
    })

    await wrapper.find('button.text-destructive').trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})