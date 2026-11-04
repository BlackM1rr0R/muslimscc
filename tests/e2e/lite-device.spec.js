// ═══════════════════════════════════════════════════════
// Zəif cihaz (≤4 nüvə) → avtomatik yüngül rejim (utils/liteDevice, wow.css §11)
//   • html: a11y-reduce-motion + wow-lite; ağır dekor qatları gizlidir
//   • istifadəçi "full" seçibsə — tam rejim
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

async function asWeak(page, override = '') {
  // fixtures.js "full" yazır — bu test onu dəyişir (init skriptləri ardıcıl işləyir)
  await page.addInitScript((o) => {
    try { if (o) localStorage.setItem('muslim_cc_motion', o); else localStorage.removeItem('muslim_cc_motion') } catch { /* */ }
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 4 })
  }, override)
}

test('4 nüvəli cihaz: yüngül rejim, ağır dekor gizli', async ({ page }) => {
  await asWeak(page)
  await page.goto('/zakat')
  await settle(page)
  const html = page.locator('html')
  await expect(html).toHaveClass(/\bwow-lite\b/)
  await expect(html).toHaveClass(/\ba11y-reduce-motion\b/)
  const aurora = page.locator('.wow-aurora').first()
  if (await aurora.count()) await expect(aurora).toBeHidden()
})

test('istifadəçi "full" seçibsə — zəif cihazda da tam rejim', async ({ page }) => {
  await asWeak(page, 'full')
  await page.goto('/zakat')
  await settle(page)
  await expect(page.locator('html')).not.toHaveClass(/\bwow-lite\b/)
})
