import { beforeEach, vi } from 'vitest'
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'

globalThis.toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}

// Nuxt auto-imports these in the app; expose them globally in tests for convenience.
globalThis.ref = ref
globalThis.computed = computed
globalThis.shallowRef = shallowRef
globalThis.reactive = reactive
globalThis.watch = watch
globalThis.onMounted = onMounted

// Lightweight useState shim — keyed on a global Map so multiple composables
// can share state across calls. Mirrors Nuxt's useState API just enough
// for unit tests of composables that read/write shared state.
const useStateStore = new Map<string, { value: unknown }>()

globalThis.useState = <T>(keyOrInit?: string | (() => T), init?: () => T) => {
  // Match Nuxt's signature: useState(key, init) OR useState(init, key)
  let key: string
  let initializer: (() => T) | undefined
  if (typeof keyOrInit === 'string') {
    key = keyOrInit
    initializer = init
  }
  else if (typeof keyOrInit === 'function') {
    // useState(init) — auto key not used here; caller must pass key for sharing
    key = `__auto_${Math.random().toString(36).slice(2, 9)}`
    initializer = keyOrInit
  }
  else {
    key = `__auto_${Math.random().toString(36).slice(2, 9)}`
    initializer = undefined
  }
  if (!useStateStore.has(key)) {
    useStateStore.set(key, { value: initializer ? initializer() : undefined as unknown as T })
  }
  return useStateStore.get(key) as { value: T }
}

// Reset shared useState store between tests so each test starts with a clean slate.
beforeEach(() => {
  useStateStore.clear()
})
