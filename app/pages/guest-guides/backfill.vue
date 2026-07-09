<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { toast } from 'vue-sonner'

const { guides } = useGuestGuides()
const selectedGuideId = ref<string | null>(null)
const result = ref<{ count: number; skipped: number; links?: any[] } | null>(null)
const running = ref(false)

async function runBackfill(dryRun: boolean) {
  if (!selectedGuideId.value) return
  running.value = true
  try {
    const res = await $fetch<{ count: number; skipped: number; links?: any[] }>(
      '/api/guest-guides/backfill',
      {
        method: 'POST',
        body: { guideId: selectedGuideId.value, dryRun },
      },
    )
    result.value = res
    toast.success(
      dryRun
        ? `Would generate ${res.count} links (${res.skipped} already issued)`
        : `Generated ${res.count} links (${res.skipped} skipped)`,
    )
  } catch (err: any) {
    toast.error(err?.statusMessage ?? err?.message ?? 'Backfill failed')
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="container mx-auto max-w-2xl p-6">
    <div class="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
      <NuxtLink to="/guest-guides" class="hover:underline">
        Guest Guides
      </NuxtLink>
      <span>/</span>
      <span>Backfill</span>
    </div>

    <h1 class="mb-2 text-2xl font-bold tracking-tight">
      Backfill Guest Guides
    </h1>
    <p class="mb-6 text-sm text-muted-foreground">
      Generate guide links for all upcoming reservations in the next 30 days. Existing links are preserved (skipped).
    </p>

    <Card>
      <CardHeader>
        <CardTitle>Run backfill</CardTitle>
        <CardDescription>Select a guide and run a dry-run first to preview changes.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium">Guide</label>
          <select
            v-model="selectedGuideId"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option :value="null">
              Select a guide...
            </option>
            <option v-for="g in guides" :key="g.id" :value="g.id">
              {{ g.title }}
            </option>
          </select>
        </div>

        <div class="flex gap-2">
          <Button
            variant="outline"
            :disabled="!selectedGuideId || running"
            @click="runBackfill(true)"
          >
            Dry run
          </Button>
          <Button
            :disabled="!selectedGuideId || running"
            @click="runBackfill(false)"
          >
            <Icon v-if="running" name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
            {{ running ? 'Running...' : 'Generate links' }}
          </Button>
        </div>

        <div v-if="result" class="rounded-md bg-muted p-4">
          <p class="text-sm font-medium">
            {{ result.count }} link(s) {{ result.links ? 'would be' : 'were' }} generated.
          </p>
          <p v-if="result.skipped" class="text-sm text-muted-foreground">
            {{ result.skipped }} reservation(s) skipped (already had a link).
          </p>
          <details v-if="result.links && result.links.length > 0" class="mt-2">
            <summary class="cursor-pointer text-xs text-muted-foreground">
              Preview {{ result.links.length }} links
            </summary>
            <ul class="mt-2 space-y-1 text-xs">
              <li v-for="link in result.links" :key="link.id" class="font-mono">
                {{ link.token }} — {{ link.guestName }} ({{ link.reservationId }})
              </li>
            </ul>
          </details>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
