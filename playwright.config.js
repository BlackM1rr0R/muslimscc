// ═══════════════════════════════════════════════════════
// Playwright — e2e testləri (tests/e2e)
//
// İstehsal build-inə (dist/) qarşı işləyir: əvvəl `npm run build`, sonra
// `npm run test:e2e`. Server: vite preview (dist-i olduğu kimi verir).
// Lokalda preview artıq işləyirsə, təkrar başladılmır.
//
// Xarici API-lər (aladhan, alquran.cloud) tests/e2e/fixtures.js-də sabit
// məlumatla əvəzlənir — testlər internet və vaxtdan asılı olmasın.
// ═══════════════════════════════════════════════════════
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const CI = Boolean(process.env.CI)

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 4 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Animasiyalar testləri ləngitməsin (dizayn özü "reduce"-a hörmət edir)
    reducedMotion: 'reduce',
    // Service worker sorğuları özü edir və page.route() onları TUTMUR — test
    // fikstürləri (sabit namaz vaxtları) yan keçilib real API-yə gedirdi
    serviceWorkers: 'block',
    locale: 'az-AZ',
    timezoneId: 'Asia/Baku',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
})
