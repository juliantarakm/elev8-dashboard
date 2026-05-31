<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{ listing: Listing }>()
const emit = defineEmits<{ update: [listing: Listing] }>()
const router = useRouter()

function otaIcon(ota: string) {
  return ota === 'Airbnb' ? 'logos:airbnb' : 'simple-icons:bookingdotcom'
}

// Photo editing
const showPhotoDialog = ref(false)

function selectPhoto(index: number) {
  const photos = [...props.listing.photos]
  const [selected] = photos.splice(index, 1)
  photos.unshift(selected!)
  emit('update', { ...props.listing, photos })
  showPhotoDialog.value = false
}

// AI Schedule
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const schedule = computed(() => props.listing.aiSchedule)
const showScheduleDialog = ref(false)

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

const scheduleSummary = computed(() => {
  const s = schedule.value
  if (props.listing.aiStatus !== 'active' || !s.enabled) return null
  const days = [...s.activeDays].sort((a, b) => a - b).map(d => dayNames[d]).join(', ')
  return `${days || 'No days'} · ${s.activeHours.start}–${s.activeHours.end}`
})

function toggleAi() {
  const newStatus = props.listing.aiStatus === 'active' ? 'paused' : 'active'
  emit('update', { ...props.listing, aiStatus: newStatus, aiSchedule: { ...schedule.value, enabled: newStatus === 'active' } })
}

function updateSchedule(patch: Partial<typeof schedule.value>) {
  emit('update', { ...props.listing, aiSchedule: { ...schedule.value, ...patch } })
}

function toggleDay(day: number) {
  const days = schedule.value.activeDays.includes(day)
    ? schedule.value.activeDays.filter(d => d !== day)
    : [...schedule.value.activeDays, day]
  updateSchedule({ activeDays: days })
}
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

          <!-- AI Status Button -->
          <button
            class="flex items-center gap-2 rounded-full border px-3 py-1 transition-colors hover:bg-accent"
            :class="listing.aiStatus === 'active' ? 'border-[#C8A84B]/40 bg-[#C8A84B]/10' : 'border-border'"
            @click="showScheduleDialog = true"
          >
            <Icon
              :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'"
              class="size-3.5"
              :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'"
            />
            <div class="flex flex-col items-start leading-tight">
              <span class="text-xs font-medium">{{ aiStatusLabel[listing.aiStatus] }}</span>
              <span v-if="scheduleSummary" class="text-[10px] text-muted-foreground">by schedule</span>
            </div>
            <Icon name="lucide:chevron-down" class="size-3 text-muted-foreground" />
          </button>
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

    <!-- AI Schedule Dialog -->
    <Dialog v-model:open="showScheduleDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>ElevAI Schedule</DialogTitle>
        </DialogHeader>

        <div class="flex flex-col gap-5 py-2">
          <!-- Toggle -->
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="flex items-center gap-3">
              <div class="flex size-9 items-center justify-center rounded-full" :class="listing.aiStatus === 'active' ? 'bg-[#C8A84B]/10' : 'bg-muted'">
                <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-4" :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'" />
              </div>
              <div>
                <p class="text-sm font-medium">{{ aiStatusLabel[listing.aiStatus] }}</p>
                <p class="text-xs text-muted-foreground">Automated guest messaging</p>
              </div>
            </div>
            <Switch :checked="listing.aiStatus === 'active'" @update:checked="toggleAi" />
          </div>

          <template v-if="schedule.enabled">
            <!-- Active Days -->
            <div class="flex flex-col gap-2">
              <Label>Active Days</Label>
              <div class="flex flex-wrap gap-1.5">
                <Button
                  v-for="(day, index) in dayNames"
                  :key="index"
                  variant="outline"
                  size="sm"
                  class="h-8 w-11 text-xs"
                  :class="schedule.activeDays.includes(index) ? 'border-primary text-primary bg-primary/5' : ''"
                  @click="toggleDay(index)"
                >{{ day }}</Button>
              </div>
            </div>

            <!-- Active Hours -->
            <div class="flex flex-col gap-2">
              <Label>Active Hours</Label>
              <div class="flex items-center gap-3">
                <Select :model-value="schedule.activeHours.start" @update:model-value="(val) => updateSchedule({ activeHours: { ...schedule.activeHours, start: val as string } })">
                  <SelectTrigger class="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
                <span class="text-sm text-muted-foreground">to</span>
                <Select :model-value="schedule.activeHours.end" @update:model-value="(val) => updateSchedule({ activeHours: { ...schedule.activeHours, end: val as string } })">
                  <SelectTrigger class="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </template>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
