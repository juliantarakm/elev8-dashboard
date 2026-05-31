<script setup lang="ts">
import type { Listing } from '~/components/listings/data/listings'

const props = defineProps<{
  listing: Listing
}>()

const emit = defineEmits<{
  update: [listing: Listing]
}>()

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const schedule = computed(() => props.listing.aiSchedule)

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

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

const previewHours = computed(() => {
  const start = parseInt(schedule.value.activeHours.start.split(':')[0])
  const end = parseInt(schedule.value.activeHours.end.split(':')[0])
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    active: start <= end ? (i >= start && i < end) : (i >= start || i < end),
  }))
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between rounded-lg border p-5">
      <div class="flex items-center gap-3">
        <div class="flex size-10 items-center justify-center rounded-full" :class="listing.aiStatus === 'active' ? 'bg-[#C8A84B]/10' : 'bg-muted'">
          <Icon :name="listing.aiStatus === 'active' ? 'lucide:bot' : 'lucide:bot-off'" class="size-5" :class="listing.aiStatus === 'active' ? 'text-[#C8A84B]' : 'text-muted-foreground'" />
        </div>
        <div>
          <p class="text-sm font-semibold">ElevAI {{ listing.aiStatus === 'active' ? 'Active' : 'Paused' }}</p>
          <p class="text-xs text-muted-foreground">Automated guest messaging</p>
        </div>
      </div>
      <Switch :checked="listing.aiStatus === 'active'" @update:checked="toggleAi" />
    </div>

    <div v-if="schedule.enabled" class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Repeat</h3>
        <Select :model-value="schedule.repeatType" @update:model-value="(val: string) => updateSchedule({ repeatType: val as 'weekly' | 'monthly' })">
          <SelectTrigger class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Active Days</h3>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="(day, index) in dayNames"
            :key="index"
            variant="outline"
            size="sm"
            class="h-9 w-12 text-xs"
            :class="schedule.activeDays.includes(index) ? 'border-primary text-primary bg-primary/5' : ''"
            @click="toggleDay(index)"
          >
            {{ day }}
          </Button>
        </div>
      </div>

      <div class="flex flex-col gap-4 rounded-lg border p-5">
        <h3 class="text-sm font-semibold">Active Hours</h3>
        <div class="flex items-center gap-3">
          <Select :model-value="schedule.activeHours.start" @update:model-value="(val: string) => updateSchedule({ activeHours: { ...schedule.activeHours, start: val } })">
            <SelectTrigger class="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
            </SelectContent>
          </Select>
          <span class="text-sm text-muted-foreground">to</span>
          <Select :model-value="schedule.activeHours.end" @update:model-value="(val: string) => updateSchedule({ activeHours: { ...schedule.activeHours, end: val } })">
            <SelectTrigger class="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="h in hours" :key="h" :value="h">{{ h }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="mt-2">
          <p class="text-xs text-muted-foreground mb-2">24h Preview</p>
          <div class="flex gap-0.5">
            <div
              v-for="item in previewHours"
              :key="item.hour"
              class="flex-1 h-6 rounded-sm transition-colors"
              :class="item.active ? 'bg-[#C8A84B]' : 'bg-muted'"
              :title="`${String(item.hour).padStart(2, '0')}:00`"
            />
          </div>
          <div class="flex justify-between mt-1">
            <span class="text-[10px] text-muted-foreground">00:00</span>
            <span class="text-[10px] text-muted-foreground">12:00</span>
            <span class="text-[10px] text-muted-foreground">23:00</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
      <Icon name="lucide:clock" class="size-8 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">Activate AI to configure schedule</p>
    </div>
  </div>
</template>
