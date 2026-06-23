import { vi } from 'vitest'
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
