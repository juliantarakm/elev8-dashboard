<script setup lang="ts">
import type { Listing, AiScheduleEntry } from '~/components/listings/data/listings'

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

// AI Schedules
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
const monthDays = Array.from({ length: 31 }, (_, i) => i + 1)

const showScheduleSheet = ref(false)
const repeatTab = ref<'weekly' | 'monthly'>('weekly')

const aiStatusLabel: Record<string, string> = {
  active: 'AI Active',
  paused: 'AI Paused',
  not_set: 'AI Not Set',
}

const enabledCount = computed(() => props.listing.aiSchedules.filter(s => s.enabled).length)
const filteredSchedules = computed(() => props.listing.aiSchedules.filter(s => s.repeatType === repeatTab.value))

function commit(schedules: AiScheduleEntry[]) {
  emit('update', { ...props.listing, aiSchedules: schedules })
}

function toggleAi() {
  const newStatus = props.listing.aiStatus === 'active' ? 'paused' : 'active'
  emit('update', { ...props.listing, aiStatus: newStatus })
}

function updateSchedule(id: string, patch: Partial<AiScheduleEntry>) {
  commit(props.listing.aiSchedules.map(s => s.id === id ? { ...s, ...patch } : s))
}

function toggleDay(s: AiScheduleEntry, day: number) {
  const days = s.activeDays.includes(day) ? s.activeDays.filter(d => d !== day) : [...s.activeDays, day]
  updateSchedule(s.id, { activeDays: days })
}

function addSchedule() {
  const entry: AiScheduleEntry = {
    id: `sch-${Date.now()}`,
    name: 'New Schedule',
    repeatType: repeatTab.value,
    activeDays: [],
    activeHours: { start: '09:00', end: '21:00' },
    enabled: true,
  }
  commit([...props.listing.aiSchedules, entry])
}

function removeSchedule(id: string) {
  commit(props.listing.aiSchedules.filter(s => s.id !== id))
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
              <span v-if="listing.aiStatus === 'active' && enabledCount > 0" class="text-[10px] text-muted-foreground">
                {{ enabledCount }} schedule{{ enabledCount > 1 ? 's' : '' }}
              </span>
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
          <SheetTitle>ElevAI Schedules</SheetTitle>
          <SheetDescription>Manage automated guest messaging schedules</SheetDescription>
        </SheetHeader>

        <div class="flex flex-col gap-5 px-4 pb-6">
          <!-- Master Toggle -->
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div class="flex items-center gap-3">
              <div class="flex size-9 items-center justify-center rounded-full" :class="listing.aiStatus === 'active' ? 'bg-[#C8A84B]/10' : 'bg-muted'">
                <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-4" :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'" />
              </div>
              <div>
                <p class="text-sm font-medium">{{ aiStatusLabel[listing.aiStatus] }}</p>
                <p class="text-xs text-muted-foreground">Master switch</p>
              </div>
            </div>
            <Switch :checked="listing.aiStatus === 'active'" @update:checked="toggleAi" />
          </div>

          <!-- Weekly / Monthly Tabs -->
          <Tabs v-model="repeatTab">
            <TabsList class="w-full">
              <TabsTrigger value="weekly" class="flex-1">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" class="flex-1">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          <!-- Schedule List -->
          <div class="flex flex-col gap-3">
            <div
              v-for="s in filteredSchedules"
              :key="s.id"
              class="flex flex-col gap-3 rounded-lg border p-4"
            >
              <div class="flex items-center justify-between gap-2">
                <Input :model-value="s.name" class="h-8 text-sm font-medium" @update:model-value="(val) => updateSchedule(s.id, { name: String(val) })" />
                <Switch :checked="s.enabled" @update:checked="(val: boolean) => updateSchedule(s.id, { enabled: val })" />
                <Button variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground hover:text-destructive" @click="removeSchedule(s.id)">
                  <Icon name="lucide:trash-2" class="size-4" />
                </Button>
              </div>

              <!-- Weekly day selector -->
              <div v-if="s.repeatType === 'weekly'" class="flex flex-wrap gap-1.5">
                <Button
                  v-for="(day, index) in dayNames"
                  :key="index"
                  variant="outline"
                  size="sm"
                  class="h-8 w-10 text-xs"
                  :class="s.activeDays.includes(index) ? 'border-primary text-primary bg-primary/5' : ''"
                  @click="toggleDay(s, index)"
                >{{ day }}</Button>
              </div>

              <!-- Monthly day selector -->
              <div v-else class="flex flex-wrap gap-1">
                <Button
                  v-for="d in monthDays"
                  :key="d"
                  variant="outline"
                  size="sm"
                  class="h-7 w-7 p-0 text-[10px]"
                  :class="s.activeDays.includes(d) ? 'border-primary text-primary bg-primary/5' : ''"
                  @click="toggleDay(s, d)"
                >{{ d }}</Button>
              </div>

              <!-- Hours -->
              <div class="flex items-center gap-2">
                <Select :model-value="s.activeHours.start" @update:model-value="(val) => updateSchedule(s.id, { activeHours: { ...s.activeHours, start: val as string } })">
                  <SelectTrigger class="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
                <span class="text-xs text-muted-foreground">to</span>
                <Select :model-value="s.activeHours.end" @update:model-value="(val) => updateSchedule(s.id, { activeHours: { ...s.activeHours, end: val as string } })">
                  <SelectTrigger class="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p v-if="filteredSchedules.length === 0" class="text-sm text-muted-foreground text-center py-6">
              No {{ repeatTab }} schedules yet.
            </p>

            <Button variant="outline" class="w-full gap-1.5" @click="addSchedule">
              <Icon name="lucide:plus" class="size-4" />
              Add {{ repeatTab === 'weekly' ? 'Weekly' : 'Monthly' }} Schedule
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
