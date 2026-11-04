// ═══════════════════════════════════════════════════════
// Namaz bağçası (components/prayer/PrayerGarden) — /prayer-tracker
//   • 30 bitki; tam gün çiçəkli, üzrlü gün "dincəlir"; xülasə mətni
//   • bitkiyə toxunanda həmin gün redaktə kartında açılır
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'
import { PAGES } from '../../src/seo/routes.js'

const HAS_ROUTE = PAGES.some(p => p.key === 'tracker')

test('bağça: bitkilər, çiçək, üzrlü gün, bitkiyə toxunuş günü açır', async ({ page }) => {
  test.skip(!HAS_ROUTE, 'marşrut yoxdur')
  await page.addInitScript(() => {
    const key = (n) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date(Date.now() - n * 86400000))
    const stats = {}
    for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) { stats[`${key(1)}_${p}`] = true; stats[`${key(2)}_${p}`] = true }
    stats[`${key(3)}_Fajr`] = true
    localStorage.setItem('muslim_cc_prayer_stats', JSON.stringify(stats))
    localStorage.setItem('muslim_cc_hayd', JSON.stringify({ enabled: true, periods: [{ id: 'h', type: 'hayd', start: key(6), end: key(5) }] }))
  })
  await page.goto('/prayer-tracker')
  await settle(page)
  const garden = page.locator('.pg')
  await garden.scrollIntoViewIfNeeded()
  await expect(garden.locator('.pg-plant')).toHaveCount(30)
  await expect(garden.locator('.pg-plant--complete')).toHaveCount(2)
  await expect(garden.locator('.pg-plant--excused')).toHaveCount(2)
  await expect(garden.locator('.pg-flower')).toHaveCount(2)
  await expect(garden.locator('.pg-svg')).toHaveAttribute('aria-label', /2 tam gün, 1 yarımçıq, 2 üzrlü\. Ardıcıl: 2 gün/)
  // 3 gün əvvəlki (1/5) bitkiyə toxun → həmin gün açılır
  await garden.locator('.pg-plant--partial').first().click()
  await expect(page.locator('.pt-main')).toContainText('Bu günə qayıt')
})
