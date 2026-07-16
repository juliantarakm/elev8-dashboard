<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  latestChangelogEntry,
  changelogBadgeVariant,
  changelogBadgeLabel,
} from '~/components/changelog/data/changelog'

const changelog = useChangelog()

const isOpen = ref(false)

// Open the popup after mount only if the user has an unseen version.
// Wrapped in <ClientOnly> so SSR never renders the open state — that would
// otherwise cause a hydration mismatch (server has no localStorage).
onMounted(() => {
  if (changelog.hasNewVersion.value) {
    isOpen.value = true
  }
})

function handleOpenChange(open: boolean) {
  isOpen.value = open
  // Mark as seen on any close interaction (X, escape, outside click, "Got it").
  if (!open && changelog.hasNewVersion.value) {
    changelog.markAsSeen()
  }
}
</script>

<template>
  <ClientOnly>
    <Dialog v-model:open="isOpen" @update:open="handleOpenChange">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
        <DialogTitle class="text-base">
          What's new in ELEV8 Suite
        </DialogTitle>
        <DialogDescription class="text-xs">
          v{{ latestChangelogEntry.version }} · {{ latestChangelogEntry.date }}
        </DialogDescription>
      </DialogHeader>

        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <Badge v-if="latestChangelogEntry.badge" variant="default" class="text-[10px] px-1.5 py-0 h-5">
              {{ latestChangelogEntry.badge }}
            </Badge>
            <span class="text-sm font-medium">
              {{ latestChangelogEntry.changes.length }} updates
            </span>
          </div>

          <ul class="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
            <li
              v-for="(change, i) in latestChangelogEntry.changes"
              :key="i"
              class="flex items-start gap-2 text-sm"
            >
              <Badge
                :variant="changelogBadgeVariant(change.type)"
                class="shrink-0 text-[10px] px-1.5 py-0 h-5 mt-0.5 min-w-[52px] text-center"
              >
                {{ changelogBadgeLabel(change.type) }}
              </Badge>
              <span class="text-foreground">{{ change.description }}</span>
            </li>
          </ul>
        </div>

        <DialogFooter class="flex-row justify-between gap-2 sm:justify-between">
          <NuxtLink
            to="/changelog"
            class="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View full changelog
            <Icon name="lucide:arrow-right" class="size-3.5" />
          </NuxtLink>
          <Button @click="handleOpenChange(false)">
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </ClientOnly>
</template>