<script setup lang="ts">
import {
  changelogEntries,
  changelogBadgeVariant,
  changelogBadgeLabel,
} from '~/components/changelog/data/changelog'
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div class="flex flex-col gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">
          Changelog
        </h2>
        <p class="text-muted-foreground">
          Track every update, feature, and improvement to Elev8.
        </p>
      </div>

      <div class="relative mt-4">
        <!-- Timeline line -->
        <div class="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div class="space-y-8">
          <div
            v-for="entry in changelogEntries"
            :key="entry.version"
            class="relative pl-8"
          >
            <!-- Timeline dot -->
            <div class="absolute left-0 top-1.5 flex items-center justify-center">
              <div class="size-[15px] rounded-full border-[3px] border-primary bg-background" />
            </div>

            <!-- Version header -->
            <div class="mb-1 flex items-baseline gap-3">
              <h3 class="text-lg font-semibold tracking-tight">
                v{{ entry.version }}
              </h3>
              <span class="text-xs text-muted-foreground">{{ entry.date }}</span>
              <Badge
                v-if="entry.badge"
                variant="default"
                class="text-[10px] px-1.5 py-0 h-5"
              >
                {{ entry.badge }}
              </Badge>
            </div>

            <!-- Changes list -->
            <ul class="space-y-2">
              <li
                v-for="(change, i) in entry.changes"
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
        </div>
      </div>
    </div>
  </div>
</template>