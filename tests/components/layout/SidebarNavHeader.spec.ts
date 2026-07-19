import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SidebarNavHeader from '~/components/layout/SidebarNavHeader.vue'
import { useTenantBranding } from '~/composables/useTenantBranding'

vi.mock('~/components/ui/sidebar', () => ({
  useSidebar: () => ({ isMobile: false }),
}))

const teams = [{ name: 'Acme Inc', logo: 'i-lucide-gallery-vertical-end', plan: 'Enterprise' }]
const stubs = {
  SidebarMenu: { template: '<div><slot /></div>' },
  SidebarMenuItem: { template: '<div><slot /></div>' },
  SidebarMenuButton: { template: '<button><slot /></button>' },
  DropdownMenu: { template: '<div><slot /></div>' },
  DropdownMenuTrigger: { template: '<div><slot /></div>' },
  DropdownMenuContent: { template: '<div><slot /></div>' },
  DropdownMenuLabel: { template: '<div><slot /></div>' },
  DropdownMenuItem: { template: '<div><slot /></div>' },
  DropdownMenuShortcut: { template: '<span><slot /></span>' },
  DropdownMenuSeparator: true,
  Icon: { props: ['name'], template: '<span data-testid="fallback-team-icon" :data-name="name" />' },
}

beforeEach(() => {
  vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
  vi.stubGlobal('useRuntimeConfig', () => ({ app: { baseURL: '/dashboard/' } }))
  vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({}))
})

// eslint-disable-next-line test/prefer-lowercase-title
describe('SidebarNavHeader branding', () => {
  it('keeps the existing team icon without a primary logo', () => {
    const wrapper = mount(SidebarNavHeader, { props: { teams }, global: { stubs } })
    expect(wrapper.find('[data-testid="sidebar-brand-logo"]').exists()).toBe(false)
    expect(wrapper.find('[data-name="i-lucide-gallery-vertical-end"]').exists()).toBe(true)
  })

  it('renders the saved primary logo in the workspace avatar', () => {
    const { branding } = useTenantBranding()
    branding.value = {
      ...branding.value,
      primaryLogo: { name: 'logo.png', type: 'image/png', size: 1, dataUrl: 'data:image/png;base64,AA==' },
    }
    const wrapper = mount(SidebarNavHeader, { props: { teams }, global: { stubs } })
    expect(wrapper.get('[data-testid="sidebar-brand-logo"]').attributes('src')).toBe(branding.value.primaryLogo!.dataUrl)
  })
})
