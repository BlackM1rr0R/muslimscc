// v6.6: /prayer/<şəhər> — Azərbaycan şəhərlərinin namaz vaxtları səhifələri (SEO)
import { test, expect, settle } from './fixtures.js'

const raw = async (request, p) => (await request.get(p)).text()

test('statik HTML: title, h1, aylıq cədvəl, canonical, digər şəhərlərə keçidlər', async ({ request }) => {
  const h = await raw(request, '/prayer/ganja/')
  expect(h).toContain('<title>Gəncə namaz vaxtları — bu gün və aylıq cədvəl')
  expect(h).toContain('<h1>Gəncə namaz vaxtları</h1>')
  expect(h).toContain('<link rel="canonical" href="https://muslims.cc/prayer/ganja"')
  expect(h).toContain('hreflang="ru" href="https://muslims.cc/ru/prayer/ganja"')
  expect((h.match(/<tr><th scope="row">/g) || []).length).toBeGreaterThanOrEqual(28)
  expect(h).toContain('href="/prayer/baku"')
  expect(h).toContain('"@type":"Place"')
  const ru = await raw(request, '/ru/prayer/ganja/')
  expect(ru).toContain('<h1>Время намаза: Гянджа</h1>')
  const list = await raw(request, '/prayer/')
  expect((list.match(/href="\/prayer\/[a-z-]+"/g) || []).length).toBe(94)   // 75 AZ + 19 dünya şəhəri
  const sm = await raw(request, '/sitemap.xml')
  expect(sm).toContain('https://muslims.cc/sitemap-prayer.xml')
  const sp = await raw(request, '/sitemap-prayer.xml')
  expect((sp.match(/<loc>/g) || []).length).toBe(94 * 5)
})

test('tətbiq: şəhər səhifəsi öz şəhərini göstərir, istifadəçinin seçiminə toxunmur', async ({ page }) => {
  await page.goto('/prayer/sheki')
  await settle(page)
  await expect(page.getByTestId('prayer-h1')).toHaveText('Şəki namaz vaxtları')
  await expect(page).toHaveTitle(/Şəki namaz vaxtları/)
  expect(await page.evaluate(() => localStorage.getItem('muslim_cc_selected_city'))).toBeNull()
  await page.goto('/prayer')
  await settle(page)
  await expect(page.getByTestId('prayer-h1')).not.toContainText('Şəki')
})

test('naməlum şəhər — səhifə tapılmadı; əlavə dildə canonical → /en', async ({ page, request }) => {
  // nginx naməlum ünvana 404 verir (404.html); yerli preview SPA kimi 200 qaytarır — burada məzmunu yoxlayırıq
  await page.goto('/prayer/atlantis')
  await settle(page)
  await expect(page.getByTestId('prayer-h1')).toHaveCount(0)
  const id = await (await request.get('/id/prayer/baku/')).text()
  expect(id).toContain('<link rel="canonical" href="https://muslims.cc/en/prayer/baku"')
})

test('dünya şəhəri: /en/prayer/london — başlıq, H1, statik cədvəl, canlı səhifə', async ({ page }) => {
  await page.goto('/en/prayer/london')
  await settle(page)
  await expect(page).toHaveTitle(/Prayer times in London/)
  await expect(page.getByTestId('prayer-h1')).toHaveText('Prayer times in London')
})
