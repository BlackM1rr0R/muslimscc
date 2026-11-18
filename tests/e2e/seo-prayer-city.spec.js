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

// J1: statik HTML (SEO, məzhəb bilinmir) əsri 1× yazır və brauzerin yenidən hesablaması üçün
// data-city / data-ym daşıyır (src/seo/staticPrayerAsr.js — unit: tests/unit/static-prayer-asr.test.js).
// React kökü createRoot ilə dərhal əvəz edir, ona görə ekranda qalan cədvəl tətbiqinkidir —
// Hənəfi seçilibsə şəhər səhifəsinin əsri 2× olmalıdır.
test('şəhər səhifəsi: HTML-də əsr 1×; Hənəfi seçilibsə səhifədə əsr 2×', async ({ page, request }) => {
  const { computeTimes, tzOffsetHours, withAsr, CALC_METHODS } = await import('../../src/utils/prayCalc.js')
  const { prayerCity } = await import('../../src/seo/prayerCity.js')
  const c = prayerCity('ganja')
  const html = await (await request.get('/prayer/ganja/')).text()
  const ym = /<table class="seo-static__table" data-city="ganja" data-ym="(\d{4})-(\d{1,2})">/.exec(html)
  expect(ym).not.toBeNull()
  const [y, m] = [Number(ym[1]), Number(ym[2])]
  const asrAt = (yy, mm, dd, f) => computeTimes({ year: yy, month: mm, day: dd }, c.lat, c.lng, tzOffsetHours(c.tz, yy, mm, dd), withAsr(CALC_METHODS.abubakr, f)).asr
  expect(html).toContain('<th scope="col" data-k="asr">')
  expect(html).toContain(`<td>${asrAt(y, m, 1, 1)}</td>`)
  expect(html).not.toContain('data-asr-note')

  const p = {}
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())) p[x.type] = x.value
  const hanafi = asrAt(+p.year, +p.month, +p.day, 2)
  expect(hanafi > asrAt(+p.year, +p.month, +p.day, 1)).toBe(true)
  await page.addInitScript(() => { try { localStorage.setItem('muslim_cc_madhab', 'hanafi') } catch { /* */ } })
  await page.goto('/prayer/ganja')
  await settle(page)
  await expect(page.getByTestId('prayer-h1')).toHaveText('Gəncə namaz vaxtları')
  await expect(page.locator('.prayer-times-list').first().getByText(hanafi, { exact: true })).toBeVisible()
})
