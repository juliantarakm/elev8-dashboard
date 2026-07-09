<script setup lang="ts">
import HeroSection from '~/components/sections/HeroSection.vue'
import WelcomeSection from '~/components/sections/WelcomeSection.vue'
import CheckinSection from '~/components/sections/CheckinSection.vue'
import CheckoutSection from '~/components/sections/CheckoutSection.vue'
import HouseRulesSection from '~/components/sections/HouseRulesSection.vue'
import AmenitiesSection from '~/components/sections/AmenitiesSection.vue'
import WifiSection from '~/components/sections/WifiSection.vue'
import LocalTipsSection from '~/components/sections/LocalTipsSection.vue'
import DocumentsSection from '~/components/sections/DocumentsSection.vue'
import UpsellsSection from '~/components/sections/UpsellsSection.vue'
import SmartLockSection from '~/components/sections/SmartLockSection.vue'
import PreArrivalSection from '~/components/sections/PreArrivalSection.vue'
import CustomRichSection from '~/components/sections/CustomRichSection.vue'

import PreArrivalForm from '~/components/forms/PreArrivalForm.vue'
import SmartLockPanel from '~/components/forms/SmartLockPanel.vue'
import LanguageSwitcher from '~/components/forms/LanguageSwitcher.vue'

const route = useRoute()
const token = computed(() => route.params.token as string)

const { fetchGuide, markOpened } = usePublicGuestGuide()
const { currentLang, setLanguage } = useAutoTranslate()

const { data, pending, error } = await useAsyncData(
  `guide-${token.value}`,
  async () => {
    const result = await fetchGuide(token.value)
    await markOpened(token.value)
    return result
  },
)

// Push the language into the composable when the user switches.
watch(currentLang, (lang) => {
  setLanguage(lang)
})

// Display sections, sorted and filtered.
const visibleSections = computed(() => {
  if (!data.value?.guide?.sections) return []
  return data.value.guide.sections
    .filter((s: any) => s.enabled)
    .sort((a: any, b: any) => a.order - b.order)
})

const sectionComponentMap: Record<string, any> = {
  hero: HeroSection,
  welcome: WelcomeSection,
  checkin: CheckinSection,
  checkout: CheckoutSection,
  house_rules: HouseRulesSection,
  amenities: AmenitiesSection,
  wifi: WifiSection,
  local_tips: LocalTipsSection,
  documents: DocumentsSection,
  upsells: UpsellsSection,
  smart_lock: SmartLockSection,
  pre_arrival: PreArrivalSection,
  custom_rich: CustomRichSection,
}

function resolveSection(type: string) {
  // pre_arrival is handled inline (form is appended under the heading).
  if (type === 'pre_arrival') return PreArrivalSection
  return sectionComponentMap[type]
}

function handleUpsellAdd(serviceId: string) {
  // Phase 4 placeholder — wire to upsell order creation in a later phase.
  // eslint-disable-next-line no-alert
  alert(`Added upsell ${serviceId} (Phase 4 placeholder)`)
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-4 md:p-6">
    <div v-if="pending" class="py-12 text-center text-muted-foreground">
      Loading your guide...
    </div>
    <div v-else-if="error" class="py-12 text-center">
      <h1 class="text-xl font-semibold">
        We couldn't find your guide
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        Please check the link or contact your host.
      </p>
    </div>
    <div v-else-if="data">
      <header class="mb-4 flex items-center justify-between">
        <div>
          <p class="text-xs uppercase tracking-wider text-muted-foreground">
            Guest guide
          </p>
          <h1 class="text-xl font-bold">
            {{ data.guide.title }}
          </h1>
        </div>
        <LanguageSwitcher v-model="currentLang" />
      </header>

      <p class="mb-6 text-sm text-muted-foreground">
        Welcome, {{ data.link.guestName }}!
      </p>

      <div class="space-y-6">
        <template v-for="section in visibleSections" :key="section.id">
          <!-- Pre-arrival section: render heading + inline form -->
          <div v-if="section.type === 'pre_arrival'" class="space-y-4">
            <PreArrivalSection :data="section.data" />
            <div class="rounded-xl border bg-card p-6">
              <PreArrivalForm :token="token" :fields="section.data?.fields" />
            </div>
          </div>

          <!-- Smart lock section: render heading + lock panel -->
          <div v-else-if="section.type === 'smart_lock'" class="space-y-4">
            <SmartLockSection :data="section.data" :token="token" />
            <SmartLockPanel :token="token" />
          </div>

          <!-- Upsells: pass add handler down -->
          <UpsellsSection
            v-else-if="section.type === 'upsells'"
            :data="section.data"
            :token="token"
            @add="handleUpsellAdd"
          />

          <!-- Default: section renderer -->
          <component
            :is="resolveSection(section.type)"
            v-else
            :data="section.data"
            :token="token"
          />
        </template>
      </div>
    </div>
  </div>
</template>