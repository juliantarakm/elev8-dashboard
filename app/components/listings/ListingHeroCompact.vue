<script setup lang="ts">
import type { Listing, AiSchedule, DateOverride } from '~/components/listings/data/listings'
import { toast } from 'vue-sonner'

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
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const showScheduleSheet = ref(false)
const scheduleTab = ref<'weekly' | 'overrides'>('weekly')
const schedule = computed(() => props.listing.aiSchedule)

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

const summary = computed(() => {
  if (props.listing.aiStatus !== 'active') return null
  if (schedule.value.always) return '24/7'
  const count = schedule.value.days.filter(d => d.enabled).length
  return count > 0 ? `${count} day${count > 1 ? 's' : ''}` : 'Off'
})

function patchSchedule(patch: Partial<AiSchedule>) {
  emit('update', { ...props.listing, aiSchedule: { ...schedule.value, ...patch } })
}

function setAlways(val: boolean) {
  patchSchedule({ always: val })
}

function updateDay(index: number, patch: Partial<AiSchedule['days'][number]>) {
  const days = schedule.value.days.map((d, i) => i === index ? { ...d, ...patch } : d)
  patchSchedule({ days })
}

function clearAll() {
  patchSchedule({ days: schedule.value.days.map(d => ({ ...d, enabled: false })) })
}

function copyToProperties() {
  toast.success('Schedule copied to all properties')
}

function saveSchedule() {
  toast.success('Schedule saved')
  showScheduleSheet.value = false
}

// Date overrides
function addOverride() {
  const o: DateOverride = {
    id: `do-${Date.now()}`,
    date: new Date().toISOString().split('T')[0]!,
    enabled: true,
    start: '09:00',
    end: '21:00',
  }
  patchSchedule({ dateOverrides: [...schedule.value.dateOverrides, o] })
}

function updateOverride(id: string, patch: Partial<DateOverride>) {
  patchSchedule({ dateOverrides: schedule.value.dateOverrides.map(o => o.id === id ? { ...o, ...patch } : o) })
}

function removeOverride(id: string) {
  patchSchedule({ dateOverrides: schedule.value.dateOverrides.filter(o => o.id !== id) })
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
            @click="showScheduleSheet = true"
          >
            <Icon
              :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'"
              class="size-3.5"
              :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'"
            />
            <div class="flex flex-col items-start leading-tight">
              <span class="text-xs font-medium">{{ aiStatusLabel[listing.aiStatus] }}</span>
              <span v-if="summary" class="text-[10px] text-muted-foreground">{{ summary }}</span>
            </div>
            <Icon name="lucide:chevron-right" class="size-3 text-muted-foreground" />
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

    <!-- AI Schedule Sheet -->
    <Sheet v-model:open="showScheduleSheet">
      <SheetContent class="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Schedule</SheetTitle>
          <SheetDescription>{{ listing.name }}</SheetDescription>
        </SheetHeader>

        <div class="flex flex-col gap-5 px-4 pb-6">
          <Tabs v-model="scheduleTab">
            <TabsList class="w-full">
              <TabsTrigger value="weekly" class="flex-1">Weekly Schedule</TabsTrigger>
              <TabsTrigger value="overrides" class="flex-1">Date Overrides</TabsTrigger>
            </TabsList>

            <!-- Weekly Schedule -->
            <TabsContent value="weekly" class="mt-5 flex flex-col gap-5">
              <p class="text-xs text-muted-foreground">
                Set the hours when ElevAI is active for guests, repeated every week. Turn on 24/7 for always-on coverage, or customize by day.
              </p>

              <!-- 24/7 Toggle -->
              <div class="flex items-start justify-between gap-3 rounded-lg border p-4">
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">24/7 Availability</span>
                  <span class="text-xs text-muted-foreground">ElevAI will be on 24/7, ready to respond to any guest message at any time.</span>
                </div>
                <Switch :checked="schedule.always" @update:checked="setAlways" />
              </div>

              <!-- Custom Schedule -->
              <div v-if="!schedule.always" class="flex flex-col gap-3">
                <span class="text-sm font-medium">Custom Schedule</span>
                <div
                  v-for="(day, index) in schedule.days"
                  :key="index"
                  class="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Switch :checked="day.enabled" class="shrink-0" @update:checked="(val: boolean) => updateDay(index, { enabled: val })" />
                  <span class="w-9 shrink-0 text-sm font-medium">{{ dayNames[index] }}</span>
                  <div v-if="day.enabled" class="flex items-center gap-1.5 flex-1">
                    <Input type="time" :model-value="day.start" class="h-8 text-xs" @update:model-value="(val) => updateDay(index, { start: String(val) })" />
                    <span class="text-xs text-muted-foreground">to</span>
                    <Input type="time" :model-value="day.end" class="h-8 text-xs" @update:model-value="(val) => updateDay(index, { end: String(val) })" />
                  </div>
                  <span v-else class="flex-1 text-xs text-muted-foreground">Unavailable</span>
                </div>

                <div class="flex items-center justify-between gap-2 pt-1">
                  <Button variant="ghost" size="sm" class="text-xs text-muted-foreground" @click="clearAll">Clear All</Button>
                  <div class="flex items-center gap-2">
                    <Button variant="outline" size="sm" class="text-xs gap-1" @click="copyToProperties">
                      <Icon name="lucide:copy" class="size-3" />
                      Copy to Properties
                    </Button>
                    <Button size="sm" class="text-xs" @click="saveSchedule">Save Schedule</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <!-- Date Overrides -->
            <TabsContent value="overrides" class="mt-5 flex flex-col gap-3">
              <p class="text-xs text-muted-foreground">
                Override the weekly schedule for specific dates (holidays, events, etc.).
              </p>

              <div
                v-for="o in schedule.dateOverrides"
                :key="o.id"
                class="flex items-center gap-3 rounded-lg border p-3"
              >
                <Switch :checked="o.enabled" class="shrink-0" @update:checked="(val: boolean) => updateOverride(o.id, { enabled: val })" />
                <Input type="date" :model-value="o.date" class="h-8 w-32 text-xs" @update:model-value="(val) => updateOverride(o.id, { date: String(val) })" />
                <div v-if="o.enabled" class="flex items-center gap-1.5 flex-1">
                  <Input type="time" :model-value="o.start" class="h-8 text-xs" @update:model-value="(val) => updateOverride(o.id, { start: String(val) })" />
                  <span class="text-xs text-muted-foreground">to</span>
                  <Input type="time" :model-value="o.end" class="h-8 text-xs" @update:model-value="(val) => updateOverride(o.id, { end: String(val) })" />
                </div>
                <span v-else class="flex-1 text-xs text-muted-foreground">Unavailable</span>
                <Button variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground hover:text-destructive" @click="removeOverride(o.id)">
                  <Icon name="lucide:trash-2" class="size-4" />
                </Button>
              </div>

              <p v-if="schedule.dateOverrides.length === 0" class="text-sm text-muted-foreground text-center py-6">
                No date overrides yet.
              </p>

              <Button variant="outline" class="w-full gap-1.5" @click="addOverride">
                <Icon name="lucide:plus" class="size-4" />
                Add Date Override
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
