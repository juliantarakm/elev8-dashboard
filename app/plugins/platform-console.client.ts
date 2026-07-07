export default defineNuxtPlugin(() => {
  // Run pricing override expiry + 7-day warning sweeps AND banner scheduling sweep every 60s.
  const interval = setInterval(() => {
    try {
      const { runExpirySweep, run7DayWarningSweep } = usePricingOverrides()
      runExpirySweep()
      run7DayWarningSweep()
    }
    catch (e) {
      // composable not yet loaded; safe to ignore
    }
    try {
      const { runSchedulingSweep } = usePlatformBanners()
      runSchedulingSweep()
    }
    catch (e) {
      // composable not yet loaded; safe to ignore
    }
  }, 60_000)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => clearInterval(interval))
  }
})