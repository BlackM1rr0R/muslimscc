// ═══════════════════════════════════════════════════════
// P4: Kəbənin tarixi — zaman səyahəti (/holyplaces) və avtomobil səfərində namaz vaxtları (/prayer)
//   • Kəbə: 6 mərhələ, tab klaviaturası (← →, Home/End; RTL-də tərsinə), Bəqərə 2:127 (public/data/kaaba-ayah),
//     hər faktın mənbəsi, hədis kitabxanasına keçid; axe (açıq + tünd), ərəbcə RTL, 360px daşma yoxdur
//   • Səfər: Bakı → Gəncə, çıxış 10:00 → yolda zöhr; səhv sürət → xəta (role="alert" yalnız mətn olanda);
//     dünyada axtarış (Open-Meteo geocoding — saxta cavab); "Səfər namazı" dərsinə keçid
// Şəbəkə: yeni /api endpoint YOXDUR. Geocoding bu faylda saxtadır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function reach(page, testId) {
  const el = page.getByTestId(testId)
  for (let i = 0; i < 80 && !(await el.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(150)
  }
  await el.scrollIntoViewIfNeeded()
  return el
}

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const over = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

const SAMARKAND = { id: 1216265, name: 'Samarkand', latitude: 39.6542, longitude: 66.9597, timezone: 'Asia/Samarkand', country_code: 'UZ', country: 'Uzbekistan', admin1: 'Samarqand', feature_code: 'PPLA' }

// ── Kəbənin tarixi ──
test('Kəbənin tarixi: mərhələlər, ayə, mənbələr, klaviatura', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/en/holyplaces')
  await settle(page)
  const kh = await reach(page, 'kaaba-history')
  await expect(kh).toHaveAttribute('data-stage', 'ibrahim')
  await expect(kh.getByTestId('kh-ayah')).toContainText('2:127')
  await expect(kh.getByTestId('kh-ayah').locator('[lang="ar"]')).toContainText('ٱلْقَوَاعِدَ')
  await expect(kh.getByTestId('kh-summary')).toContainText('9 cubits')

  await kh.getByTestId('kh-next').click()
  await expect(kh).toHaveAttribute('data-stage', 'quraysh')
  await expect(kh.getByTestId('kh-summary')).toContainText('18 cubits')
  await expect(kh.getByTestId('kh-hadith-link').first()).toHaveAttribute('href', /\/hadith-library#bukhari\/25\/158\d$/)
  // Hər faktın mənbəsi var
  const facts = kh.getByTestId('kh-fact')
  const n = await facts.count()
  expect(n).toBeGreaterThan(2)
  for (let i = 0; i < n; i++) await expect(facts.nth(i).locator('.kh__src').first()).toBeVisible()

  // Tab klaviaturası
  await kh.getByRole('tab', { selected: true }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(kh).toHaveAttribute('data-stage', 'zubayr')
  await expect(kh.getByRole('tab', { selected: true })).toBeFocused()
  await expect(kh.getByTestId('kh-summary')).toContainText('18 + 10 cubits')
  await page.keyboard.press('End')
  await expect(kh).toHaveAttribute('data-stage', 'modern')
  await page.keyboard.press('Home')
  await expect(kh).toHaveAttribute('data-stage', 'ibrahim')

  expectCleanConsole(consoleProblems)
  // Hədis keçidi saytın kitabxanasını açır (mətn orada yüklənir — fixtures hadith-api-ni kəsir)
  await kh.getByRole('tab').nth(3).click()
  await expect(kh).toHaveAttribute('data-stage', 'hajjaj')
  await kh.getByTestId('kh-hadith-link').first().click()
  await expect(page).toHaveURL(/\/hadith-library#muslim\/15\/3245$/)
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): Kəbənin tarixi və səfər planlayıcısı, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => localStorage.setItem('muslim_cc_theme', th), theme)
    for (const base of ['/en', '/ar']) {
      await page.goto(`${base}/holyplaces`)
      await settle(page)
      if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      const kh = await reach(page, 'kaaba-history')
      expect(await serious(page, ['[data-testid="kaaba-history"]']), `${base} kaaba`).toEqual([])
      if (base === '/ar') {
        // RTL: ← növbəti mərhələ
        await kh.getByRole('tab', { selected: true }).focus()
        await page.keyboard.press('ArrowLeft')
        await expect(kh).toHaveAttribute('data-stage', 'quraysh')
      }
      await page.goto(`${base}/prayer`)
      await settle(page)
      const rt = await reach(page, 'road-trip-prayer')
      await expect(rt).toHaveAttribute('data-ready', '1')
      expect(await serious(page, ['[data-testid="road-trip-prayer"]']), `${base} road trip`).toEqual([])
    }
  })
}

test('360px: Kəbənin tarixi və səfər planlayıcısı üfüqi daşmır', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 360, height: 740 })
  for (const base of ['/en', '/ar']) {
    await page.goto(`${base}/holyplaces`)
    await settle(page)
    const kh = await reach(page, 'kaaba-history')
    await kh.getByTestId('kh-next').click()
    expect(await over(page), `${base} kaaba`).toBeLessThanOrEqual(1)
    await page.goto(`${base}/prayer`)
    await settle(page)
    const rt = await reach(page, 'road-trip-prayer')
    await expect(rt).toHaveAttribute('data-ready', '1')
    await rt.getByTestId('rtp-to').fill('Ganj')
    await rt.locator('.rtp__sugg button').first().click()
    await rt.getByTestId('rtp-go').click()
    await expect(rt.getByTestId('rtp-result')).toBeVisible()
    expect(await over(page), `${base} road trip`).toBeLessThanOrEqual(1)
  }
})

// ── Səfər planlayıcısı ──
test('səfər: Bakı → Gəncə 10:00 — zöhr yolda, dərsə keçid; səhv sürət → xəta', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/en/prayer')
  await settle(page)
  const rt = await reach(page, 'road-trip-prayer')
  await expect(rt).toHaveAttribute('data-ready', '1')
  await expect(rt.locator('[role="alert"]')).toHaveCount(0)

  await rt.getByTestId('rtp-from').fill('Bak')
  await rt.locator('.rtp__sugg button').first().click()
  await rt.getByTestId('rtp-to').fill('Ganj')
  await rt.locator('.rtp__sugg button').first().click()
  await rt.getByTestId('rtp-dep').fill('2026-06-01T10:00')
  await rt.getByTestId('rtp-speed').fill('5')
  await rt.getByTestId('rtp-go').click()
  await expect(rt.getByTestId('rtp-err')).toContainText('10')

  await rt.getByTestId('rtp-speed').fill('80')
  await rt.getByTestId('rtp-road').fill('360')
  await rt.getByTestId('rtp-go').click()
  await expect(rt.locator('[role="alert"]')).toHaveCount(0)
  await expect(rt.getByTestId('rtp-result')).toBeFocused()
  await expect(rt.locator('[data-testid="rtp-event"][data-event="dhuhr"]')).toHaveCount(1)
  await expect(rt.locator('[data-testid="rtp-event"][data-event="dhuhr"]')).toContainText('km')
  await expect(rt.getByTestId('rtp-count')).toContainText('prayer time')
  await expect(rt.getByTestId('rtp-lesson')).toHaveAttribute('href', /\/learn\/travel-prayer$/)
  expectCleanConsole(consoleProblems)
})

test('səfər: siyahıda olmayan şəhər — dünyada axtarış (saxta geocoding)', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.route(/geocoding-api\.open-meteo\.com\/v1\/search/, route => route.fulfill({ json: { results: [SAMARKAND] } }))
  await page.goto('/en/prayer')
  await settle(page)
  const rt = await reach(page, 'road-trip-prayer')
  await expect(rt).toHaveAttribute('data-ready', '1')
  await rt.getByTestId('rtp-to').fill('Samarkand')
  await rt.getByTestId('rtp-to-world').click()
  const opt = rt.locator('.rtp__sugg button', { hasText: 'Uzbekistan' })
  await expect(opt).toBeVisible()
  await opt.click()
  await expect(rt.getByTestId('rtp-to')).toHaveValue(/Samarkand/)
  await rt.getByTestId('rtp-go').click()
  await expect(rt.getByTestId('rtp-result')).toBeVisible()
  await expect.poll(async () => (await rt.getAttribute('data-events')) !== '').toBe(true)
  expectCleanConsole(consoleProblems)
})
