export default defineNuxtPlugin(() => {
  // Phase 1: no-op. Phase 2 adds usePricingOverrides.runExpirySweep + run7DayWarningSweep.
  // Phase 3 adds usePlatformBanners.runSchedulingSweep.
  // Sweeps are wired in later phases to avoid importing composables that don't exist yet.
})