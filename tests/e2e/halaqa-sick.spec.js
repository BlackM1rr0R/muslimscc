// ═══════════════════════════════════════════════════════
// R2: /family-halaqa (həftəlik ailə halqası) və /visiting-the-sick (xəstəni ziyarət)
//   • halqa: ?week= ilə eyni dəst (ayə + hədis mənbəsi + dərs + suallar + uşaq keçidi), "Başqa dəst" variantı
//     family_halaqa_v1-də qalır və yenidən yükləmədə qayıdır, keçiddə &v=, "keçirdik" işarəsi, həftə sürüşməsi,
//     çap düyməsi window.print çağırır
//   • xəstə: dərs blokları və Hisn 51/125 mənbə ilə, ziyarət əlavə et → sick_visits_v1, "ziyarət etdim", sil
//   • heç bir yeni /api sorğusu yoxdur; axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
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
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
// /api/content/announcements — saytın ümumi elan bildirişi (App → AnnouncementToast), bu səhifənin sorğusu deyil
const ownApi = (list) => list.filter((u) => !/\/api\/(a|client-error|csp-report|content\/announcements)\b/.test(u))
const kitLoaded = async (page) => {
  await expect(page.getByTestId('hq-kit')).toBeVisible()
  await expect(page.getByTestId('hq-ayah')).toBeVisible()
  await expect(page.getByTestId('hq-hadith')).toBeVisible()
  await expect(page.getByTestId('hq-lesson').locator('.hq-wait')).toHaveCount(0)
}

test('halqa: ?week= dəsti, başqa dəst yadda qalır, keçid, işarə, həftə sürüşməsi, çap', async ({ page, consoleProblems }) => {
  const api = []
  page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) api.push(r.url()) })
  await page.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed += 1 } })
  await page.goto('/en/family-halaqa?week=2026-W48')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Weekly family halaqa')
  await kitLoaded(page)
  await expect(page.getByTestId('hq-week')).toHaveText('Week 48 of 2026')
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-week', '2026-W48')
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-v', '0')
  // Hədis: mənbə Buxari/Müslim, dərəcə səhih; ayə: tərcüməçi
  await expect(page.getByTestId('hq-hadith').locator('cite')).toContainText(/Bukhari|Muslim/)
  await expect(page.getByTestId('hq-hadith')).toContainText('Grade: sahih')
  await expect(page.getByTestId('hq-ayah')).toContainText('Translation: Muhammad Asad')
  await expect(page.getByTestId('hq-q')).toHaveCount(4)
  await expect(page.getByTestId('hq-kids-link')).toHaveAttribute('href', /\/en\/kids\?section=[a-z]+$/)
  const ayah1 = await page.getByTestId('hq-ayah').locator('.hq-ar').textContent()

  // Başqa dəst → variant 1, yadda qalır, keçiddə &v=1
  await page.getByTestId('hq-shuffle').click()
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-v', '1')
  await kitLoaded(page)
  expect(await page.getByTestId('hq-ayah').locator('.hq-ar').textContent()).not.toBe(ayah1)
  expect((await store(page, 'family_halaqa_v1')).s).toEqual({ '2026-W48': 1 })
  await expect(page.locator('#hq-link')).toHaveValue(/\/en\/family-halaqa\?week=2026-W48&v=1$/)

  // Keçirdik işarəsi
  await page.getByTestId('hq-done').check()
  await expect(page.getByTestId('hq-done')).toBeChecked()
  expect(Object.keys((await store(page, 'family_halaqa_v1')).d)).toEqual(['2026-W48'])

  // Çap
  await page.getByTestId('hq-print').click()
  expect(await page.evaluate(() => window.__printed)).toBe(1)

  // Yenidən yükləmə: variant və işarə qayıdır
  await page.reload()
  await settle(page)
  await kitLoaded(page)
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-v', '1')
  await expect(page.getByTestId('hq-done')).toBeChecked()

  // Həftə sürüşməsi + əsas dəstə qayıt
  await page.getByTestId('hq-next').click()
  await expect(page.getByTestId('hq-week')).toHaveText('Week 49 of 2026')
  await expect(page.getByTestId('hq-done')).not.toBeChecked()
  await page.getByTestId('hq-prev').click()
  await expect(page.getByTestId('hq-week')).toHaveText('Week 48 of 2026')
  await page.getByTestId('hq-standard').click()
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-v', '0')
  expect((await store(page, 'family_halaqa_v1')).s).toEqual({})

  expect(ownApi(api)).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('halqa: paylaşılan keçid (?week=&v=) eyni dəsti verir', async ({ page, consoleProblems }) => {
  await page.goto('/en/family-halaqa?week=2026-W10&v=3')
  await settle(page)
  await kitLoaded(page)
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-week', '2026-W10')
  await expect(page.getByTestId('hq-kit')).toHaveAttribute('data-v', '3')
  const a = await page.getByTestId('hq-kit').locator('.hq-ar').allTextContents()
  await page.goto('/ru/family-halaqa?week=2026-W10&v=3')
  await settle(page)
  await kitLoaded(page)
  expect(await page.getByTestId('hq-kit').locator('.hq-ar').allTextContents()).toEqual(a)
  expectCleanConsole(consoleProblems)
})

test('xəstə: dərs və Hisn mənbə ilə; ziyarət əlavə et → sick_visits_v1, ziyarət etdim, sil', async ({ page, consoleProblems }) => {
  const api = []
  page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/api/')) api.push(r.url()) })
  await page.goto('/en/visiting-the-sick')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Visiting the sick')
  await expect(page.getByText('This page is not medical advice.', { exact: false })).toBeVisible()
  await expect(page.getByTestId('sv-virtue')).toContainText('Muslim 2568')
  await expect(page.getByTestId('sv-duas')).toContainText('al-Bukhari 3616')
  await expect(page.getByTestId('sv-hisn-51').locator('cite')).toContainText('Tirmidhi')
  await expect(page.getByTestId('sv-hisn-125').locator('cite')).toContainText('Muslim')

  await expect(page.getByTestId('sv-empty')).toBeVisible()
  await page.getByTestId('sv-add').click()
  await page.getByTestId('sv-save').click()
  await expect(page.getByRole('alert')).toHaveText('Please enter a name.')
  await page.getByLabel('Whom will you visit').fill('Aunt Leyla')
  await page.getByLabel('Day of the visit').fill('2030-01-15')
  await page.getByLabel('Note (optional)').fill('City hospital, room 12')
  await page.getByTestId('sv-save').click()
  await expect(page.getByTestId('sv-item')).toHaveCount(1)
  await expect(page.getByTestId('sv-item')).toContainText('Aunt Leyla')
  const v = await store(page, 'sick_visits_v1')
  expect(v.l[0]).toMatchObject({ n: 'Aunt Leyla', d: '2030-01-15', no: 'City hospital, room 12' })

  await page.getByTestId('sv-visited').check()
  await expect(page.getByTestId('sv-tag')).toHaveText('Visited')
  expect((await store(page, 'sick_visits_v1')).l[0].x).toBe(true)
  await page.reload()
  await settle(page)
  await expect(page.getByTestId('sv-visited')).toBeChecked()

  await page.getByTestId('sv-del').click()
  await page.getByTestId('sv-del-yes').click()
  await expect(page.getByTestId('sv-empty')).toBeVisible()
  expect(await store(page, 'sick_visits_v1')).toBeNull()

  expect(ownApi(api)).toEqual([])
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): halqa və xəstə, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => {
      localStorage.setItem('muslim_cc_theme', th)
      localStorage.setItem('sick_visits_v1', JSON.stringify({ v: 1, l: [{ id: 'sabc1234', n: 'Leyla', d: '2030-01-15', u: 1 }] }))
    }, theme)
    for (const base of ['/en', '/ar']) {
      await page.goto(`${base}/family-halaqa?week=2026-W48`)
      await settle(page)
      if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await kitLoaded(page)
      expect(await serious(page, ['.hq-page']), `${base} halaqa`).toEqual([])
      await page.goto(`${base}/visiting-the-sick`)
      await settle(page)
      await expect(page.getByTestId('sv-item')).toHaveCount(1)
      await expect(page.getByTestId('sv-hisn-51').locator('.hq-wait')).toHaveCount(0)
      expect(await serious(page, ['.sv-page']), `${base} sick`).toEqual([])
    }
  })
}

test('360px: iki səhifədə üfüqi daşma yoxdur (en + ar)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.addInitScript(() => localStorage.setItem('sick_visits_v1', JSON.stringify({ v: 1, l: [{ id: 'sabc1234', n: 'ليلى', d: '2030-01-15', no: 'المستشفى', u: 1 }] })))
  for (const url of ['/en/family-halaqa?week=2026-W48', '/ar/family-halaqa?week=2026-W48', '/en/visiting-the-sick', '/ar/visiting-the-sick']) {
    await page.goto(url)
    await settle(page)
    if (url.includes('halaqa')) await kitLoaded(page)
    expect(await noOverflow(page), url).toBe(true)
  }
})
