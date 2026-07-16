import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    // In Nuxt, `import.meta.client` is true when running in the browser.
    // Tests use jsdom which simulates a browser environment.
    'import.meta.client': 'true',
  },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      // `~/server/...` resolves to root-level `server/...` (Nuxt server
      // utilities). Listed BEFORE the broader `~` alias so it wins the
      // longest-match for `~/server/...` imports.
      '~/server': fileURLToPath(new URL('./server', import.meta.url)),
      '~': fileURLToPath(new URL('./app', import.meta.url)),
    },
  },
})
