// Vitest — sürətli unit testləri (tests/unit). E2E testləri Playwright-dadır.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js'],
    environment: 'node',
  },
})
