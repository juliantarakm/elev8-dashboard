<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()
const router = useRouter()

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

const showPhotoDialog = ref(false)
const activePhotoIndex = ref(0)

function selectPhoto(index: number) {
  // Move selected photo to front
  const photos = [...props.listing.photos]
  const [selected] = photos.splice(index, 1)
  photos.unshift(selected!)
  emit('update', { ...props.listing, photos })
  showPhotoDialog.value = false
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const scheduleSummary = computed(() => {
  const s = props.listing.aiSchedule
  if (props.listing.aiStatus !== 'active' || !s.enabled) return null
  const days = [...s.activeDays].sort((a, b) => a - b).map(d => dayNames[d]).join(', ')
  return { days: days || 'No days', hours: `${s.activeHours.start}–${s.activeHours.end}` }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="h-8 w-fit gap-1.5 pl-2" @click="router.push('/listings')">
      <Icon name="lucide:arrow-left" class="size-4" />
      Back
    </Button>

    <div class="flex items-center gap-4">
      <!-- Editable Photo -->
      <div class="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted group cursor-pointer" @click="showPhotoDialog = true">
        <img :src="listing.photos[0]" :alt="listing.name" class="size-full object-cover" />
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Icon name="lucide:pencil" class="size-4 text-white" />
        </div>
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
          <span class="text-muted-foreground/50">·</span>
          <Badge variant="outline" class="text-xs">
            <Icon :name="listing.unitType === 'multi' ? 'lucide:building-2' : 'lucide:home'" class="size-3 mr-1" />
            {{ listing.unitType === 'multi' ? 'Multi-Unit' : 'Single Unit' }}
          </Badge>
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

        <div v-if="scheduleSummary" class="flex items-center gap-3 text-xs text-muted-foreground">
          <span class="flex items-center gap-1.5">
            <Icon name="lucide:calendar-clock" class="size-3.5 text-[#C8A84B]" />
            {{ scheduleSummary.days }}
          </span>
          <span class="flex items-center gap-1.5">
            <Icon name="lucide:clock" class="size-3.5 text-[#C8A84B]" />
            {{ scheduleSummary.hours }}
          </span>
        </div>
      </div>
    </div>

    <!-- Photo Selection Dialog -->
    <Dialog v-model:open="showPhotoDialog">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Cover Photo</DialogTitle>
        </DialogHeader>
        <div class="grid grid-cols-3 gap-3 py-4">
          <button
            v-for="(photo, index) in listing.photos"
            :key="index"
            class="aspect-[4/3] overflow-hidden rounded-lg border-2 transition-colors"
            :class="index === 0 ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'"
            @click="selectPhoto(index)"
          >
            <img :src="photo" :alt="`Photo ${index + 1}`" class="size-full object-cover" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
