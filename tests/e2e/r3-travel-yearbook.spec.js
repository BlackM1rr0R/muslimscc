// ═══════════════════════════════════════════════════════
// R3: Müsəlman səyyahın dəsti (/traveller-kit) və "Mənim ilim" çap kitabı (/my-year-book)
//   • Səyyah: siyahıdan təyinat (İstanbul) → qiblə bucağı, 6 vaxt, saat fərqi, dərs keçidi (öz hökmü yoxdur);
//     "Səfərlərim" — saxla, yenidən açılışda qalır, aç, sil; "namaz şəhərim et"; dünyada axtarış (saxta geocoding) →
//     Səmərqənd: İbn Bəttutə qeydi + mənbə; London — tarixi bölmə yoxdur (mənbəli məlumat yoxdur)
//   • Kitab: boş il — yumşaq boş bölmələr, paylaşma düyməsi yoxdur, "cihazda qalır" qeydi; qeydlərlə — bölmələr dolur,
//     sədəqə məbləğləri susmaya görə gizli, bölməni çıxarmaq; çap düyməsi window.print; çap mediası — yalnız kitab, ağ fon
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// Şəbəkə: yeni /api endpoint YOXDUR. Open-Meteo geocoding bu faylda saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const over = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

const SAMARKAND = { id: 1216265, name: 'Samarkand', latitude: 39.6542, longitude: 66.9597, timezone: 'Asia/Samarkand', country_code: 'UZ', country: 'Uzbekistan', admin1: 'Samarqand', feature_code: 'PPLA' }
const LONDON = { id: 2643743, name: 'London', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London', country_code: 'GB', country: 'United Kingdom', admin1: 'England', feature_code: 'PPLC' }

async function pickListed(page, query, label) {
  await page.getByTestId('tk-dest').fill(query)
  const opt = page.getByRole('option', { name: new RegExp(label) }).first()
  await expect(opt).toBeVisible()
  await opt.click()
  await expect(page.getByTestId('tk-result')).toBeVisible()
}

// ── Səyyahın dəsti ──
test('səyyah: İstanbul — qiblə, vaxtlar, saat fərqi, dərs; öz hökmü yoxdur', async ({ page, consoleProblems }) => {
  await page.goto('/en/traveller-kit')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Muslim traveller kit')
  await expect(page.getByTestId('tk-empty')).toBeVisible()
  await pickListed(page, 'Istan', 'Istanbul')
  await expect(page.getByTestId('tk-dest-name')).toBeFocused()
  const deg = Number(await page.getByTestId('tk-dial').getAttribute('data-deg'))
  expect(deg).toBeGreaterThan(145)
  expect(deg).toBeLessThan(155)
  await expect(page.getByTestId('tk-qibla-deg')).toContainText('south-east')
  for (const k of ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']) await expect(page.getByTestId(`tk-t-${k}`)).toHaveText(/^\d\d:\d\d$/)
  await expect(page.getByTestId('tk-pray')).toContainText('Diyanet')
  await expect(page.getByTestId('tk-diff')).toHaveText(/ahead of|behind|Same time as/)
  // Səfər namazı — yalnız "alimlər fərqli rəydədir" + dərs
  await expect(page.getByTestId('tk-lesson')).toContainText('Scholars differ')
  await expect(page.getByTestId('tk-lesson').getByRole('link')).toHaveAttribute('href', /\/en\/learn\/travel-prayer$/)
  await expect(page.getByTestId('tk-near')).toContainText('not around the city you picked here')
  await expect(page.getByTestId('tk-osm')).toHaveAttribute('href', /openstreetmap\.org\/\?mlat=41\.0/)
  // Tarix: İstanbul (Konstantinopol) — İbn Bəttutənin dayanacağı, mənbə ilə
  await expect(page.getByTestId('tk-hist')).toContainText('Ibn Battuta')
  await expect(page.getByTestId('tk-hist')).toContainText('Source: Ibn Battuta')
  // Başqa tarix → vaxtlar yenilənir
  await page.getByTestId('tk-date').fill('2026-12-21')
  await expect(page.getByTestId('tk-t-fajr')).toHaveText(/^0[5-7]:\d\d$/)
  expectCleanConsole(consoleProblems)
})

test('səyyah: Səfərlərim — saxla, yenidən açılışda qalır, aç, sil; namaz şəhərim et', async ({ page, consoleProblems }) => {
  await page.goto('/en/traveller-kit')
  await settle(page)
  await pickListed(page, 'Istan', 'Istanbul')
  await page.getByTestId('tk-save').click()
  await expect(page.getByTestId('tk-trips')).toHaveAttribute('data-count', '1')
  expect((await store(page, 'traveller_trips_v1')).l[0]).toMatchObject({ tz: 'Europe/Istanbul', cc: 'TR' })
  await page.getByTestId('tk-save').click()                      // eyni yer təkrarlanmır
  await expect(page.getByTestId('tk-trips')).toHaveAttribute('data-count', '1')

  await page.reload()
  await settle(page)
  await expect(page.getByTestId('tk-trips')).toHaveAttribute('data-count', '1')
  await page.getByTestId('tk-trip').click()
  await expect(page.getByTestId('tk-dest-name')).toContainText('Istanbul')

  await page.getByTestId('tk-usecity').click()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('muslim_cc_selected_city'))).toBe('Istanbul')
  await expect(page.getByTestId('tk-diff')).toHaveText(/Same time as Istanbul/)

  await page.getByTestId('tk-trip-del').click()
  await expect(page.getByTestId('tk-trips')).toHaveAttribute('data-count', '0')
  expect(await store(page, 'traveller_trips_v1')).toBe(null)
  expectCleanConsole(consoleProblems)
})

test('səyyah: dünyada axtarış (saxta geocoding) — Səmərqənd tarixi qeyd, London — tarix bölməsi yoxdur', async ({ page, consoleProblems }) => {
  await page.route(/geocoding-api\.open-meteo\.com\/v1\/search/, (route) => {
    const q = new URL(route.request().url()).searchParams.get('name') || ''
    return route.fulfill({ json: { results: /lond/i.test(q) ? [LONDON] : [SAMARKAND] } })
  })
  await page.goto('/en/traveller-kit')
  await settle(page)
  await page.getByTestId('tk-dest').fill('Samarkand')
  await page.getByTestId('tk-world').click()
  await page.getByRole('option', { name: /Uzbekistan/ }).click()
  await expect(page.getByTestId('tk-dest-name')).toContainText('Samarkand')
  await expect(page.getByTestId('tk-hist')).toContainText('Ibn Battuta')

  await page.getByTestId('tk-dest').fill('Londonderryx')
  await page.getByTestId('tk-world').click()
  await page.getByRole('option', { name: /United Kingdom/ }).click()
  await expect(page.getByTestId('tk-dest-name')).toContainText('London')
  await expect(page.getByTestId('tk-qibla')).toBeVisible()
  await page.waitForTimeout(400)                                  // tarixi data modulları yüklənsin
  await expect(page.getByTestId('tk-hist')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('səyyah: klaviatura ilə seçim (↓ Enter)', async ({ page }) => {
  await page.goto('/en/traveller-kit')
  await settle(page)
  const input = page.getByTestId('tk-dest')
  await input.fill('Mecca')
  await expect(page.getByRole('listbox')).toBeVisible()
  await input.press('ArrowDown')
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/)
  await input.press('Enter')
  await expect(page.getByTestId('tk-result')).toBeVisible()
})

// ── "Mənim ilim" kitabı ──
test('kitab: boş il — yumşaq boş bölmələr, cihazda qalır qeydi, paylaşma yoxdur', async ({ page, consoleProblems }) => {
  await page.goto('/en/my-year-book')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('My year — a book for you')
  await expect(page.getByTestId('yb-device')).toContainText('This book stays on your device.')
  const book = page.getByTestId('yb-book')
  await expect(book).toHaveAttribute('data-empty', '1')
  await expect(page.locator('#yb-cover-h')).toHaveText(/^My year \d{4} AH$/)
  await expect(page.getByTestId('yb-empty-all')).toBeVisible()
  await expect(page.getByTestId('yb-sec-duas')).toContainText('Nothing recorded here this year')
  await expect(page.getByTestId('yb-closing')).toBeVisible()
  await expect(page.getByRole('button', { name: /share/i })).toHaveCount(0)
  await page.getByTestId('yb-mode-greg').click()
  await expect(page.locator('#yb-cover-h')).toHaveText(/^My year \d{4}$/)
  expectCleanConsole(consoleProblems)
})

test('kitab: qeydlərlə — bölmələr, gizli məbləğlər, bölməni çıxarmaq, çap düyməsi', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => {
    const d = new Date()
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const J = JSON.stringify
    localStorage.setItem('dua_journal', J({ duas: [{ id: 'a', text: 'For my parents', category: 'family', date: day, answered: false }] }))
    localStorage.setItem('quran_notes_v1', J({ '2:255': { c: 'gold', t: 'My note on Ayat al-Kursi', u: Date.now(), d: Date.now() } }))
    localStorage.setItem('charity_log', J([{ id: 1, date: day, type: 'food', amount: '2575', description: 'Neighbours', to: '' }]))
    localStorage.setItem('hifz_progress', J({ 112: 2 }))
    localStorage.setItem('hifz_dates_v1', J({ 112: day }))
    localStorage.setItem('muslim_cc_passport_v1', J({ hifz_surah: day }))
    window.__printed = 0
    window.print = () => { window.__printed++ }
  })
  await page.goto('/en/my-year-book')
  await settle(page)
  await page.getByTestId('yb-mode-greg').click()
  const book = page.getByTestId('yb-book')
  await expect(book).toHaveAttribute('data-empty', '0')
  await expect(page.getByTestId('yb-sec-duas')).toContainText('For my parents')
  await expect(page.getByTestId('yb-sec-notes')).toContainText('My note on Ayat al-Kursi')
  await expect(page.getByTestId('yb-sec-notes')).toContainText('2:255')
  await expect(page.getByTestId('yb-sec-hifz')).toContainText('1 surah memorised')
  await expect(page.getByTestId('yb-sec-stamps')).toContainText('1 stamp')
  await expect(page.getByTestId('yb-sec-charity')).toContainText('Private')
  await expect(page.getByTestId('yb-sec-charity')).not.toContainText('2,575')
  await page.getByTestId('yb-amounts').check()
  await expect(page.getByTestId('yb-sec-charity')).toContainText('2,575')
  await expect(page.getByTestId('yb-status')).toContainText('The book is ready')

  await page.getByTestId('yb-inc-notes').uncheck()
  await expect(page.getByTestId('yb-sec-notes')).toHaveCount(0)
  await expect(page.getByTestId('yb-toc')).not.toContainText('Quran notes')

  await page.getByTestId('yb-print').click()
  expect(await page.evaluate(() => window.__printed)).toBe(1)
  expectCleanConsole(consoleProblems)
})

test('kitab: çap mediası — yalnız kitab, tünd mövzuda da ağ fon', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('muslim_cc_theme', 'dark'))
  await page.goto('/en/my-year-book')
  await settle(page)
  await expect(page.getByTestId('yb-book')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.yb-controls')).toBeHidden()
  await expect(page.locator('.ui-page-hero')).toBeHidden()
  await expect(page.getByTestId('yb-cover')).toBeVisible()
  const bg = await page.getByTestId('yb-toc').evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(bg).toBe('rgb(255, 255, 255)')
  await page.emulateMedia({ media: 'screen' })
})

// ── Əlçatanlıq: açıq + tünd; ərəbcə RTL; 360px ──
for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): səyyahın dəsti və kitab, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => localStorage.setItem('muslim_cc_theme', th), theme)
    for (const base of ['/en', '/ar']) {
      await page.goto(`${base}/traveller-kit`)
      await settle(page)
      if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await pickListed(page, base === '/ar' ? 'المدينة' : 'Medina', base === '/ar' ? 'المدينة' : 'Medina')
      expect(await serious(page, ['.tk-page']), `${base} traveller-kit`).toEqual([])
      await page.goto(`${base}/my-year-book`)
      await settle(page)
      await expect(page.getByTestId('yb-book')).toBeVisible()
      expect(await serious(page, ['.yb-page']), `${base} year book`).toEqual([])
    }
  })
}

test('360px: səyyahın dəsti (nəticə ilə) və kitab — üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const base of ['/en', '/ar']) {
    await page.goto(`${base}/traveller-kit`)
    await settle(page)
    await pickListed(page, base === '/ar' ? 'المدينة' : 'Medina', base === '/ar' ? 'المدينة' : 'Medina')
    expect(await over(page), `${base} traveller-kit`).toBeLessThanOrEqual(1)
    await page.goto(`${base}/my-year-book`)
    await settle(page)
    await expect(page.getByTestId('yb-book')).toBeVisible()
    expect(await over(page), `${base} year book`).toBeLessThanOrEqual(1)
  }
})
