<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

defineProps<{ listing: Listing }>()
const router = useRouter()

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="h-8 w-fit gap-1.5 pl-2" @click="router.push('/listings')">
      <Icon name="lucide:arrow-left" class="size-4" />
      Back
    </Button>

    <div class="flex items-center gap-4">
      <div class="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        <img :src="listing.photos[0]" :alt="listing.name" class="size-full object-cover" />
      </div>

      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-semibold tracking-tight">{{ listing.name }}</h1>
          <Badge :variant="listing.aiStatus === 'active' ? 'default' : 'secondary'" class="text-xs shrink-0">
            <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-3 mr-1" />
            {{ aiStatusLabel[listing.aiStatus] }}
          </Badge>
        </div>

        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon name="lucide:map-pin" class="size-3.5" />
          <span>{{ listing.location }}</span>
          <span class="text-muted-foreground/50">·</span>
          <span>{{ listing.property }}</span>
        </div>

        <div class="flex items-center gap-2">
          <div
            v-for="ota in listing.otaConnected"
            :key="ota"
            class="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5"
          >
            <Icon :name="otaIcon(ota)" class="size-3" />
            <span class="text-xs">{{ ota }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
