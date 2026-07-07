export default defineNuxtPlugin(() => {
  // Phase 2: run pricing override expiry + 7-day warning sweeps every 60s.
  // Phase 3 will add usePlatformBanners.runSchedulingSweep.
  const interval = setInterval(() => {
    try {
      const { runExpirySweep, run7DayWarningSweep } = usePricingOverrides()
      runExpirySweep()
      run7DayWarningSweep()
    }
    catch (e) {
      // composable not yet loaded; safe to ignore
    }
  }, 60_000)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => clearInterval(interval))
  }
})