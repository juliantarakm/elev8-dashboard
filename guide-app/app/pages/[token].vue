<script setup lang="ts">
const route = useRoute()
const token = computed(() => route.params.token as string)
const { fetchGuide, markOpened } = usePublicGuestGuide()

const { data, pending, error } = await useAsyncData(
  `guide-${token.value}`,
  async () => {
    const result = await fetchGuide(token.value)
    await markOpened(token.value)
    return result
  },
)
</script>

<template>
  <div class="mx-auto max-w-3xl p-6">
    <div v-if="pending" class="py-12 text-center text-muted-foreground">
      Loading your guide...
    </div>
    <div v-else-if="error" class="py-12 text-center">
      <h1 class="text-xl font-semibold">We couldn't find your guide</h1>
      <p class="mt-2 text-sm text-muted-foreground">Please check the link or contact your host.</p>
    </div>
    <div v-else-if="data">
      <h1 class="text-2xl font-bold">{{ data.guide.title }}</h1>
      <p class="mt-2 text-muted-foreground">Welcome, {{ data.link.guestName }}!</p>
      <div class="mt-8 space-y-4">
        <div v-for="section in data.guide.sections.filter(s => s.enabled)" :key="section.id">
          <div v-if="section.type === 'welcome'" class="prose">
            <p>{{ section.data.message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
