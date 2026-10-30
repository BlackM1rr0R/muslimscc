// ═══════════════════════════════════════════════════════
// Yeni versiya: açıq sayt / ana ekrandakı tətbiq ön plana qayıdanda yenilənir
// (src/utils/appUpdate.js). version.json-u saxta "yeni build" ilə əvəz edib
// tətbiqin arxa plandan qayıtmasını (visibilitychange) təqlid edirik.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

const NEW_BUILD = JSON.stringify({ build: 'test-new-build' })

async function resume(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

test('yeni versiya varsa — ön plana qayıdanda səhifə özü yenilənir (bir dəfə)', async ({ page }) => {
  await page.goto('/about')
  await settle(page)
  let htmlLoads = 0
  page.on('request', (r) => { if (r.resourceType() === 'document') htmlLoads++ })
  await page.route(/\/version\.json/, (route) => route.fulfill({ contentType: 'application/json', body: NEW_BUILD }))
  await resume(page)
  await expect.poll(() => htmlLoads).toBe(1)
  await settle(page)
  // Eyni yeni versiyaya görə ikinci dəfə yenilənmir (döngü yoxdur) — bildiriş çıxır
  await resume(page)
  await page.waitForTimeout(800)
  expect(htmlLoads).toBe(1)
})

test('istifadəçi yazırsa — yeniləmə kəsmir, "Yenilə" bildirişi çıxır', async ({ page }) => {
  await page.goto('/about')
  await settle(page)
  await page.route(/\/version\.json/, (route) => route.fulfill({ contentType: 'application/json', body: NEW_BUILD }))
  await page.evaluate(() => {
    const i = document.createElement('input'); i.type = 'text'; i.id = 'typing'; document.body.appendChild(i); i.focus()
  })
  await resume(page)
  const toast = page.locator('.qm-update-toast')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Saytın yeni versiyası hazırdır')
  await expect(page.locator('#typing')).toBeAttached()   // səhifə yenilənmədi
})

test('versiya eynidirsə — heç nə olmur', async ({ page }) => {
  await page.goto('/about')
  await settle(page)
  let htmlLoads = 0
  page.on('request', (r) => { if (r.resourceType() === 'document') htmlLoads++ })
  await resume(page)
  await page.waitForTimeout(800)
  expect(htmlLoads).toBe(0)
  await expect(page.locator('.qm-update-toast')).toHaveCount(0)
})
