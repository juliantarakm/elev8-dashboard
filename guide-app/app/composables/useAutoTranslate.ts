/**
 * Auto-translate composable for the public guest guide.
 *
 * Phase 1: cache-based mock — returns the input unchanged.
 * Phase 5: replaces `translate()` body with a real API call (e.g. Google Translate).
 *
 * The `translate()` function is intentionally async to allow swapping in a real
 * translation provider later without changing call sites.
 */

interface TranslateCacheEntry {
  // Keyed by `${lang}:${text}` so different target languages cache independently.
}

const cache = new Map<string, string>()

export function useAutoTranslate() {
  const config = useRuntimeConfig()
  // Phase 1: derive language from query param or default to 'en'.
  // The component reads `currentLang` from the page and updates via watchEffect
  // would be the Phase 5 wiring. For now we expose a simple getter.
  const currentLang = useState<string>('guest-guide-lang', () => 'en')

  async function translate(text: string, targetLang?: string): Promise<string> {
    if (!text) return ''
    const lang = targetLang ?? currentLang.value
    if (lang === 'en') return text // no-op for source language

    const key = `${lang}:${text}`
    if (cache.has(key)) return cache.get(key)!

    // Phase 1 mock: just return the input. Phase 5 hits a real translation API.
    // Avoid spamming the cache with empty/identity translations.
    const translated = text
    cache.set(key, translated)
    return translated
  }

  function setLanguage(lang: string) {
    currentLang.value = lang
  }

  function clearCache() {
    cache.clear()
  }

  return {
    currentLang: readonly(currentLang),
    translate,
    setLanguage,
    clearCache,
  }
}