<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const router = useRouter()

const aiStatusIcon: Record<string, string> = {
  active: 'lucide:bot',
  paused: 'lucide:bot-off',
  not_set: 'lucide:bot-off',
}

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

const activePhotoIndex = ref(0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="sm" class="h-8 gap-1.5 pl-2" @click="router.push('/listings')">
        <Icon name="lucide:arrow-left" class="size-4" />
        Back
      </Button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
      <div class="flex flex-col gap-3">
        <div class="relative overflow-hidden rounded-lg aspect-[4/3] bg-muted">
          <img
            :src="listing.photos[activePhotoIndex]"
            :alt="listing.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div v-if="listing.photos.length > 1" class="flex gap-2">
          <button
            v-for="(photo, index) in listing.photos"
            :key="index"
            class="shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-colors"
            :class="activePhotoIndex === index ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'"
            @click="activePhotoIndex = index"
          >
            <img :src="photo" :alt="`Photo ${index + 1}`" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <h1 class="text-2xl font-bold tracking-tight">{{ listing.name }}</h1>
          <Badge
            :variant="listing.aiStatus === 'active' ? 'default' : 'secondary'"
            class="text-xs shrink-0"
          >
            <Icon :name="aiStatusIcon[listing.aiStatus] || 'lucide:bot'" class="size-3 mr-1" />
            {{ aiStatusLabel[listing.aiStatus] || listing.aiStatus }}
          </Badge>
        </div>
        <div class="flex items-center gap-2 text-muted-foreground">
          <Icon name="lucide:map-pin" class="size-4" />
          <span class="text-sm">{{ listing.location }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
