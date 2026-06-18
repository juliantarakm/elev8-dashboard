<script setup lang="ts">
import type { GuestOption } from './data/payment-requests'
import { computed, ref } from 'vue'
import { useInbox } from '~/composables/useInbox'
import { usePaymentRequests } from '~/composables/usePaymentRequests'

const modelValue = defineModel<string>('modelValue')
const selectedGuest = defineModel<GuestOption | null>('guest')

const open = ref(false)
const search = ref('')

const { conversations } = useInbox()
const { requests } = usePaymentRequests()

const guestOptions = computed<GuestOption[]>(() => {
  const options: GuestOption[] = []
  const seen = new Set<string>()

  for (const conv of conversations.value) {
    const key = conv.guestName.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      options.push({
        id: `inbox-${conv.id}`,
        name: conv.guestName,
        email: conv.guestEmail ?? '',
        avatar: conv.guestAvatar,
        source: 'inbox',
        lastStay: conv.reservation ? new Date(conv.reservation.checkIn).toLocaleDateString() : undefined,
        listingName: conv.listingName,
      })
    }
  }

  for (const req of requests.value) {
    const key = req.guestName.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      options.push({
        id: `pr-${req.id}`,
        name: req.guestName,
        email: req.guestEmail,
        phone: req.guestPhone,
        source: 'payment_request',
      })
    }
  }

  return options
})

const filteredOptions = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query)
    return guestOptions.value
  return guestOptions.value.filter(g =>
    g.name.toLowerCase().includes(query)
    || g.email.toLowerCase().includes(query)
    || (g.phone?.toLowerCase().includes(query) ?? false),
  )
})

const inboxGuests = computed(() => filteredOptions.value.filter(g => g.source === 'inbox'))
const previousGuests = computed(() => filteredOptions.value.filter(g => g.source === 'payment_request'))

function selectGuest(guest: GuestOption) {
  modelValue.value = guest.name
  selectedGuest.value = guest
  search.value = ''
  open.value = false
}

function selectManual() {
  const name = search.value.trim()
  if (!name)
    return
  const guest: GuestOption = {
    id: `manual-${Date.now()}`,
    name,
    email: '',
    source: 'manual',
  }
  modelValue.value = name
  selectedGuest.value = guest
  search.value = ''
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button variant="outline" class="w-full justify-between">
        {{ modelValue || 'Search guest...' }}
        <Icon name="lucide:chevrons-up-down" class="size-4 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[380px] p-0" align="start">
      <Command>
        <CommandInput v-model="search" placeholder="Search guest by name or email..." />
        <CommandEmpty>No guest found.</CommandEmpty>
        <CommandGroup v-if="inboxGuests.length" heading="Recent Guests">
          <CommandItem
            v-for="guest in inboxGuests"
            :key="guest.id"
            @select="selectGuest(guest)"
          >
            <div class="flex items-center gap-2">
              <Avatar v-if="guest.avatar" class="size-6">
                <AvatarImage :src="guest.avatar" />
              </Avatar>
              <div v-else class="flex size-6 items-center justify-center rounded-full bg-muted text-[10px]">
                {{ guest.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium">
                  {{ guest.name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ guest.email }}
                </p>
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandGroup v-if="previousGuests.length" heading="Previous Requests">
          <CommandItem
            v-for="guest in previousGuests"
            :key="guest.id"
            @select="selectGuest(guest)"
          >
            <div class="flex items-center gap-2">
              <div class="flex size-6 items-center justify-center rounded-full bg-muted text-[10px]">
                {{ guest.name.charAt(0) }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium">
                  {{ guest.name }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ guest.email }}
                </p>
              </div>
            </div>
          </CommandItem>
        </CommandGroup>
        <CommandGroup v-if="search.trim()">
          <CommandItem @select="selectManual">
            <Icon name="lucide:plus" class="mr-2 size-4" />
            Add new guest "{{ search.trim() }}"
          </CommandItem>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</template>
