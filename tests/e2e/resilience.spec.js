// ═══════════════════════════════════════════════════════
// Dayanıqlıq: səhifə chunk-ı yüklənmədikdə sayt ağ ekran olmur.
//
// Deploydan sonra köhnə tabda hash-li fayl serverdə artıq yoxdur (404).
// Gözlənilən davranış (src/App.jsx → withChunkRetry + PageErrorBoundary):
//   1) chunk xətası → bir dəfə avtomatik location.reload();
//   2) yenə uğursuzdursa → yalnız səhifə hissəsində xəta kartı və
//      "Yenidən yüklə" düyməsi; başlıq və menyu işləməyə davam edir;
//   3) chunk bərpa olunanda (yeni deploy) — səhifə normal açılır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('səhifə chunk-ı 404 → bir dəfə yenilənir, sonra xəta kartı; başlıq görünür', async ({ page }) => {
  let hits = 0
  await page.route(/\/assets\/QuranPage-[\w-]+\.js$/, (route) => { hits++; route.fulfill({ status: 404, body: 'not found' }) })
  // Tam səhifə yüklənmələri (HTML sorğuları) — SPA daxili history dəyişmələri sayılmır
  const navs = []
  page.on('request', (r) => { if (r.resourceType() === 'document' && r.frame() === page.mainFrame()) navs.push(r.url()) })

  await page.goto('/quran')
  const card = page.locator('[data-page-error]')
  await expect(card).toBeVisible({ timeout: 15_000 })
  await expect(card.getByRole('button', { name: 'Yenidən yüklə' })).toBeVisible()
  // Avtomatik yeniləmə BİR dəfə oldu (sonsuz döngü yoxdur)
  expect(navs.length).toBe(2)
  expect(hits).toBeGreaterThanOrEqual(2)
  // Sayt ağ deyil: başlıq yerindədir
  await expect(page.locator('header').first()).toBeVisible()

  // Chunk bərpa olunub (yeni deploy) — "Yenidən yüklə" səhifəni açır
  await page.unroute(/\/assets\/QuranPage-[\w-]+\.js$/)
  await card.getByRole('button', { name: 'Yenidən yüklə' }).click()
  await settle(page)
  await expect(page.locator('[data-page-error]')).toHaveCount(0)
  await expect(page.locator('h1').first()).toBeVisible()
})

test('xəta kartından sayt daxili keçid işləyir (sərhəd sıfırlanır)', async ({ page }) => {
  await page.route(/\/assets\/QuranPage-[\w-]+\.js$/, (route) => route.fulfill({ status: 404, body: 'not found' }))
  await page.goto('/quran')
  await expect(page.locator('[data-page-error]')).toBeVisible({ timeout: 15_000 })
  // SPA keçidi (səhifə yenilənmədən) — react-router popstate-i dinləyir
  await page.evaluate(() => { history.pushState({}, '', '/hadith'); window.dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page).toHaveURL(/\/hadith$/)
  await expect(page.locator('[data-page-error]')).toHaveCount(0)
  await expect(page.locator('h1').first()).toBeVisible()
})
