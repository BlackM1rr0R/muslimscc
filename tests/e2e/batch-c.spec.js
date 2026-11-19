// ═══════════════════════════════════════════════════════
// C dəstəsi: Quranda məna ilə axtarış (/quran-meaning), yeni müsəlmanın yolu (/new-muslim),
// sədəqeyi-cariyə gündəliyi (/sadaqah-jariyah).
//   • axtarış: POST /api/quran-meaning (CSRF başlığı, dil), nəticələr saytın Quran mənbəyindən
//     (fixtures.js → alquran "s:a" saxtası); modelin əlavə sahələri GÖSTƏRİLMİR; ?q= ünvanda;
//     boş nəticə və 429 → aydın mesaj (role="alert" yalnız mətnlə)
//   • yol: 14 addım, işarə → new_muslim_path_v1, yenidən yükləmədə qalır, götürülür; keçidlər
//   • gündəlik: əlavə et / redaktə / sil (təsdiqlə), sadaqah_jariyah_v1, noindex, hədis (Muslim 1631)
//   • axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
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
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)

// ── 1. Quranda məna ilə axtarış ──
test('məna ilə axtarış: istinadlar serverdən, mətn Quran mənbəyindən; model mətni göstərilmir', async ({ page, consoleProblems }) => {
  const seen = []
  await page.route((u) => u.pathname === '/api/quran-meaning', (route) => {
    const req = route.request()
    seen.push({ body: req.postDataJSON(), xrw: req.headers()['x-requested-with'] })
    return route.fulfill({ json: { results: [
      { s: 2, a: 153, topic: 'MODEL-TOPIC', text: 'MODEL-WRITTEN TEXT' },
      { s: 94, a: 5 },
    ], cached: false, reply: 'MODEL-WRITTEN TEXT' } })
  })
  await page.goto('/en/quran-meaning')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Search the Quran by meaning')
  await expect(page.getByText('AI chose the verses', { exact: false })).toBeVisible()

  await page.getByLabel('What would you like to read about?').fill('about patience')
  await page.locator('.qmn-form').getByRole('button', { name: 'Search', exact: true }).click()
  const items = page.locator('.qmn-result')
  await expect(items).toHaveCount(2)
  expect(seen[0]).toEqual({ body: { q: 'about patience', lang: 'en' }, xrw: 'fetch' })
  const first = items.first()
  await expect(first).toHaveAttribute('data-ref', '2:153')
  await expect(first.locator('.qmn-result__ar')).toHaveText('[test 2:153 quran-uthmani]')
  await expect(first.locator('.qmn-result__ar')).toHaveAttribute('dir', 'rtl')
  await expect(first.locator('.qmn-result__tr')).toHaveText('[test 2:153 en.asad]')
  await expect(first.getByRole('link', { name: /Read in context/ })).toHaveAttribute('href', /^\/en\/quran\/2-[a-z-]+\?a=153$/)
  await expect(page.locator('.qmn-result__topic')).toHaveCount(0)
  await expect(page.locator('body')).not.toContainText('MODEL-TOPIC')
  await expect(page.getByText('2 ayahs found').first()).toBeAttached()
  await expect(page.locator('body')).not.toContainText('MODEL-WRITTEN TEXT')
  await expect(page).toHaveURL(/\/en\/quran-meaning\?q=about%20patience$/)
  // fokus nəticələrin başlığına keçir (ekran oxuyucusu)
  await expect(page.locator('#qmn-results-title')).toBeFocused()
  expectCleanConsole(consoleProblems)
})

test('məna ilə axtarış: nümunə düyməsi, ?q= ünvanla açılış, boş nəticə, 429', async ({ page, consoleProblems }) => {
  let mode = 'empty'
  await page.route((u) => u.pathname === '/api/quran-meaning', (route) => (mode === 'rate'
    ? route.fulfill({ status: 429, json: { error: 'Limit' } })
    : route.fulfill({ json: { results: [], cached: false } })))
  await page.goto('/en/quran-meaning?q=weather%20tomorrow')
  await settle(page)
  await expect(page.getByLabel('What would you like to read about?')).toHaveValue('weather tomorrow')
  await expect(page.locator('.qmn-out__none')).toHaveText('No matching ayahs were found. Try different words.')
  await expect(page.locator('[role="alert"]')).toHaveCount(0)

  mode = 'rate'
  await page.getByRole('button', { name: 'gratitude' }).click()
  await expect(page.locator('[role="alert"]')).toHaveText(/Too many searches/)
  await expect(page.getByLabel('What would you like to read about?')).toHaveValue('gratitude')
  // 429 brauzer konsoluna "Failed to load resource" yazır — gözlənilən, UI özü göstərir
  expectCleanConsole(consoleProblems.filter((p) => !/status of 429/.test(p)))
})

// ── 2. Yeni müsəlmanın yolu ──
test('yeni müsəlmanın yolu: 14 addım, işarə yadda qalır, götürülür; keçidlər mövcud səhifələrə', async ({ page, consoleProblems }) => {
  await page.goto('/en/new-muslim')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('New Muslim path — the first 40 days')
  await expect(page.locator('.nmp-step')).toHaveCount(14)
  await expect(page.getByTestId('nmp-summary')).toContainText('0 of 14 steps marked')

  const step1 = page.locator('#nmp-step-shahada')
  await expect(step1.getByRole('link', { name: 'Lesson: First steps for a new Muslim' })).toHaveAttribute('href', '/en/learn/new-muslim')
  await expect(step1.getByRole('link', { name: 'Glossary: shahadah' })).toHaveAttribute('href', '/en/glossary/shahadah')
  await expect(page.locator('#nmp-step-fatiha').getByRole('link', { name: 'Surah Al-Fatiha' })).toHaveAttribute('href', /^\/en\/quran\/1-/)
  await expect(page.locator('#nmp-step-fatiha').getByRole('link', { name: 'Arabic course: reading' })).toHaveAttribute('href', '/en/learn-arabic#reading')

  const cb = step1.getByRole('checkbox', { name: 'I have done this step' })
  await cb.check()
  await expect(cb).toBeChecked()
  await expect(page.getByTestId('nmp-summary')).toContainText('1 of 14 steps marked')
  await expect(page.getByTestId('nmp-summary').getByRole('link')).toContainText('Ghusl and wudu')
  const v = await store(page, 'new_muslim_path_v1')
  expect(v.v).toBe(1)
  expect(Object.keys(v.d)).toEqual(['shahada'])
  expect(v.d.shahada).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  await page.reload()
  await settle(page)
  await expect(page.locator('#nmp-step-shahada').getByRole('checkbox')).toBeChecked()
  await page.locator('#nmp-step-shahada').getByRole('checkbox').uncheck()
  await expect(page.getByTestId('nmp-summary')).toContainText('0 of 14 steps marked')
  expect(await store(page, 'new_muslim_path_v1')).toBeNull()

  // keçid SPA ilə açılır
  await page.locator('#nmp-step-words').getByRole('link', { name: 'Glossary' }).click()
  await expect(page).toHaveURL(/\/en\/glossary$/)
  expectCleanConsole(consoleProblems)
})

// ── 3. Sədəqeyi-cariyə gündəliyi ──
test('sədəqeyi-cariyə: əlavə et, redaktə, təsdiqlə sil; noindex; cəm yoxdur; hədis mənbəsi ilə', async ({ page, consoleProblems }) => {
  await page.goto('/en/sadaqah-jariyah')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sadaqah jariyah journal')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  await expect(page.getByText('No entries yet.', { exact: false })).toBeVisible()

  await page.getByRole('radio', { name: 'Tree planted' }).check()
  await page.getByLabel('On behalf of (optional)').fill('My father')
  await page.getByLabel('Note (optional)').fill('An olive tree in the village')
  await page.locator('.jrj-form').getByRole('button', { name: 'Save', exact: true }).click()
  const items = page.locator('.jrj-item')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toContainText('Tree planted')
  await expect(items.first()).toContainText('On behalf of My father')
  await expect(items.first()).toContainText('An olive tree in the village')
  let v = await store(page, 'sadaqah_jariyah_v1')
  expect(v.l).toHaveLength(1)
  expect(v.l[0]).toMatchObject({ k: 'tree', on: 'My father', no: 'An olive tree in the village' })

  // ikinci qeyd: əvvəlki ad datalist-də təklif olunur
  await expect(page.locator('#jrj-names option')).toHaveCount(1)
  await page.getByRole('radio', { name: 'Water / well' }).check()
  await page.locator('.jrj-form').getByRole('button', { name: 'Save', exact: true }).click()
  await expect(items).toHaveCount(2)

  // redaktə
  await items.filter({ hasText: 'Tree planted' }).getByRole('button', { name: /^Edit/ }).click()
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible()
  await page.getByLabel('Note (optional)').fill('Two olive trees')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(items.filter({ hasText: 'Two olive trees' })).toHaveCount(1)
  v = await store(page, 'sadaqah_jariyah_v1')
  expect(v.l).toHaveLength(2)

  // sil — təsdiq ilə; "Xeyr" heç nə silmir
  const water = items.filter({ hasText: 'Water / well' })
  await water.getByRole('button', { name: /^Delete/ }).click()
  await water.getByRole('button', { name: 'No' }).click()
  await expect(items).toHaveCount(2)
  await water.getByRole('button', { name: /^Delete/ }).click()
  await water.getByRole('button', { name: 'Yes, delete' }).click()
  await expect(items).toHaveCount(1)
  await expect(page.locator('#jrj-list-title')).toBeFocused()

  // cəm / müqayisə yoxdur
  await expect(page.locator('.jrj-list-wrap')).not.toContainText(/total|[0-9]+ entries/i)

  // hədis — saytın bazasından, mənbəsi ilə
  await page.getByRole('button', { name: 'Show the hadith about sadaqah jariyah' }).click()
  const h = page.getByTestId('jrj-hadith')
  await expect(h).toContainText('ongoing charity')
  await expect(h).toContainText('Muslim 1631')
  await expect(h.getByRole('link', { name: 'Full hadith' })).toHaveAttribute('href', /^\/en\/hadith\/\d+$/)
  expectCleanConsole(consoleProblems)
})

// ── 4. Əlçatanlıq: açıq + tünd; ərəbcə RTL ──
for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): üç səhifə, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => {
      localStorage.setItem('muslim_cc_theme', th)
      localStorage.setItem('sadaqah_jariyah_v1', JSON.stringify({ v: 1, l: [{ id: 'ja1b2c3', k: 'quran', d: '2026-11-01', on: 'Grandmother', no: 'Mosque', u: 1 }] }))
      localStorage.setItem('new_muslim_path_v1', JSON.stringify({ v: 1, d: { shahada: '2026-11-01' } }))
    }, theme)
    for (const base of ['/en', '/ar']) {
      await page.goto(`${base}/quran-meaning`)
      await settle(page)
      if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await page.locator('#qmn-q').fill('patience')
      await page.locator('.qmn-form button[type="submit"]').click()
      await expect(page.locator('.qmn-result')).toHaveCount(2)
      await expect(page.locator('.qmn-result__ar').first()).toBeVisible()
      expect(await serious(page, ['.qmn-page'])).toEqual([])

      await page.goto(`${base}/new-muslim`)
      await settle(page)
      await expect(page.locator('#nmp-step-shahada input[type="checkbox"]')).toBeChecked()
      expect(await serious(page, ['.nmp-page'])).toEqual([])

      await page.goto(`${base}/sadaqah-jariyah`)
      await settle(page)
      await expect(page.locator('.jrj-item')).toHaveCount(1)
      expect(await serious(page, ['.jrj-page'])).toEqual([])
    }
  })
}

// ── 5. 360px: üfüqi daşma yoxdur ──
test('360px: üç səhifədə üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const path of ['/en/quran-meaning', '/en/new-muslim', '/ar/sadaqah-jariyah']) {
    await page.goto(path)
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(1)
  }
})
