import type { OwnerReservation } from '~/components/owners/data/owner-reservations'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import PortalReservationCalendar from '~/components/owner-portal/PortalReservationCalendar.vue'

const ButtonStub = {
  props: ['variant', 'size', 'disabled', 'type'],
  emits: ['click'],
  template: '<button :type="type" :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
}
const IconStub = { props: ['name'], template: '<i />' }

const testListings = vi.hoisted(() => [
  { id: 'lst-1', name: 'Villa Sunset', property: 'Canggu', room: '5BR', location: 'Canggu', unitType: 'single', bookings: [], tags: [] },
  { id: 'lst-3', name: 'Bali Villa', property: 'Ubud', room: 'Villa', location: 'Ubud', unitType: 'multi', bookings: [], tags: [] },
  { id: 'lst-8', name: 'Beach House', property: 'Seminyak', room: 'House', location: 'Seminyak', unitType: 'multi', bookings: [], tags: [] },
])

vi.mock('~/components/listings/data/listings', () => ({
  listings: ref(testListings),
}))

const globalOptions = {
  stubs: {
    Button: ButtonStub,
    Icon: IconStub,
    Dialog: { template: '<div><slot /></div>' },
    DialogContent: { template: '<div><slot /></div>' },
    DialogDescription: { template: '<p><slot /></p>' },
    DialogFooter: { template: '<footer><slot /></footer>' },
    DialogHeader: { template: '<header><slot /></header>' },
    DialogTitle: { template: '<h2><slot /></h2>' },
  },
}

function makeReservation(partial: Partial<OwnerReservation> & { id: string, checkIn: string, checkOut: string }): OwnerReservation {
  return {
    type: 'guest',
    listingId: 'lst-1',
    guestName: 'Test Guest',
    channel: 'airbnb',
    status: 'confirmed',
    ...partial,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2025, 11, 15))
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('portalReservationCalendar', () => {
  it('renders day cells with the date number top-right', async () => {
    mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: {
        anchor: new Date(2025, 11, 1),
        reservations: [
          makeReservation({ id: 'r-seed', checkIn: '2025-12-10', checkOut: '2025-12-12' }),
        ],
      },
    })
    await vi.runOnlyPendingTimersAsync()

    const body = document.body.textContent ?? ''
    expect(body).toMatch(/Mon/)
    expect(body).toMatch(/Sun/)
    // In-month day numbers (Dec 1, 15, 31) appear in the body text.
    expect(body).toContain('1')
    expect(body).toContain('15')
    expect(body).toContain('31')
  })

  it('renders guest stays as emerald bars spanning the booking dates', async () => {
    const reservation = makeReservation({
      id: 'r-1',
      listingId: 'lst-1',
      type: 'guest',
      channel: 'airbnb',
      guestName: 'Amelia',
      checkIn: '2025-12-10',
      checkOut: '2025-12-15',
      status: 'confirmed',
    })
    mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: {
        anchor: new Date(2025, 11, 1),
        reservations: [reservation],
      },
    })
    await vi.runOnlyPendingTimersAsync()

    const bar = document.body.querySelector('button[aria-label*="Guest stay for Amelia"]')
    expect(bar).toBeTruthy()
    expect(bar?.className).toMatch(/bg-emerald-800/)
    // Channel badge + guest name rendered.
    expect(bar?.textContent).toMatch(/A/) // Airbnb → A
    expect(bar?.textContent).toMatch(/Amelia/)
  })

  it('renders owner blocks as amber bars with the note', async () => {
    const reservation = makeReservation({
      id: 'o-1',
      listingId: 'lst-1',
      type: 'owner_block',
      note: 'Family visit',
      checkIn: '2025-12-20',
      checkOut: '2025-12-23',
      status: 'confirmed',
    })
    mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: {
        anchor: new Date(2025, 11, 1),
        reservations: [reservation],
      },
    })
    await vi.runOnlyPendingTimersAsync()

    const bar = document.body.querySelector('button[aria-label*="Owner block"]')
    expect(bar).toBeTruthy()
    expect(bar?.className).toMatch(/bg-amber-400/)
    expect(bar?.textContent).toMatch(/Family visit/)
  })

  it('stacks overlapping owner blocks in separate rows (different top values)', async () => {
    const a = makeReservation({
      id: 'a',
      listingId: 'lst-1',
      type: 'owner_block',
      note: 'Block-A',
      checkIn: '2025-12-10',
      checkOut: '2025-12-15',
      status: 'confirmed',
    })
    const b = makeReservation({
      id: 'b',
      listingId: 'lst-1',
      type: 'owner_block',
      note: 'Block-B',
      checkIn: '2025-12-12',
      checkOut: '2025-12-18',
      status: 'confirmed',
    })
    mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: {
        anchor: new Date(2025, 11, 1),
        reservations: [a, b],
      },
    })
    await vi.runOnlyPendingTimersAsync()

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const barA = buttons.find(b => b.textContent?.includes('Block-A')) as HTMLElement | undefined
    const barB = buttons.find(b => b.textContent?.includes('Block-B')) as HTMLElement | undefined
    expect(barA).toBeTruthy()
    expect(barB).toBeTruthy()
    const styleA = barA?.parentElement?.getAttribute('style') ?? ''
    const styleB = barB?.parentElement?.getAttribute('style') ?? ''
    const topA = Number(styleA.match(/top:\s*(\d+)/)?.[1] ?? -1)
    const topB = Number(styleB.match(/top:\s*(\d+)/)?.[1] ?? -1)
    expect(topA).not.toBe(topB)
  })

  it('places a block 24-27 on the matching day cells, not Dec 3', async () => {
    const reservation = makeReservation({
      id: 'r-24-27', listingId: 'lst-1', type: 'owner_block',
      note: 'Range-24-27', checkIn: '2025-12-24', checkOut: '2025-12-27', status: 'confirmed',
    })
    mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: {
        anchor: new Date(2025, 11, 1),
        reservations: [reservation],
      },
    })
    await vi.runOnlyPendingTimersAsync()

    const button = document.body.querySelector('button[aria-label*="Owner block"]') as HTMLElement | null
    expect(button).toBeTruthy()
    // Find the bar wrapper (an ancestor whose inline style sets `left:`
    // and `width:` in percent). Search up to the document body.
    let cursor: HTMLElement | null = button
    let style: string | null = null
    while (cursor) {
      const attr = cursor.getAttribute('style') ?? ''
      if (attr.includes('left:') && attr.includes('width:')) {
        style = attr
        break
      }
      cursor = cursor.parentElement
    }
    expect(style).not.toBeNull()
    const leftPct = Number(style!.match(/left:\s*([\d.]+)%/)?.[1] ?? -1)
    const widthPct = Number(style!.match(/width:\s*([\d.]+)%/)?.[1] ?? -1)
    expect(leftPct).toBeGreaterThan(50)
    expect(widthPct).toBeGreaterThan(5)
  })

  it('emits update:anchor when Previous is clicked', async () => {
    const wrapper = mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: { anchor: new Date(2025, 11, 1), reservations: [] },
    })
    await vi.runOnlyPendingTimersAsync()

    const prev = Array.from(document.body.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Previous month') as HTMLElement | undefined
    expect(prev).toBeTruthy()
    prev!.click()
    await vi.runOnlyPendingTimersAsync()
    expect(wrapper.emitted('update:anchor')).toBeTruthy()
  })

  it('emits createOwnerReservation when the new reservation button is clicked', async () => {
    const wrapper = mount(PortalReservationCalendar, {
      attachTo: document.body,
      global: globalOptions,
      props: { anchor: new Date(2025, 11, 1), reservations: [] },
    })
    await vi.runOnlyPendingTimersAsync()

    const trigger = Array.from(document.body.querySelectorAll('button')).find(b => b.textContent?.includes('New owner reservation'))
    expect(trigger).toBeTruthy()
    trigger!.click()
    await vi.runOnlyPendingTimersAsync()
    expect(wrapper.emitted('createOwnerReservation')).toBeTruthy()
  })
})
