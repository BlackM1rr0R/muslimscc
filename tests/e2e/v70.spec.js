// ═══════════════════════════════════════════════════════
// v7.0: halal yerlər (OSM diet:halal), stikerlər, əbru, uşaq təbrik kartı,
// sədəqə gündəliyində "Kimə" və illər üzrə cəm
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

// DeferRender — bölmə ekrana yaxınlaşanda yüklənir: addım-addım aşağı
async function reach(page, testId) {
  const el = page.getByTestId(testId)
  for (let i = 0; i < 60 && !(await el.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(150)
  }
  await el.scrollIntoViewIfNeeded()
  return el
}

const axe = async (page, sel) => {
  const { violations } = await new AxeBuilder({ page }).include(sel)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
}

test('halal yerlər: OSM nəticəsi məsafəyə görə, teq dəyəri və yoxlama tarixi, qeyri-halal süzülür', async ({ page, context, consoleProblems }) => {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 40.4093, longitude: 49.8671 })
  let query = ''
  await page.route(/overpass/, (r) => {
    query = decodeURIComponent(new URL(r.request().url()).searchParams.get('data') || '')
    return r.fulfill({ json: { elements: [
      { type: 'node', id: 1, lat: 40.43, lon: 49.87, tags: { name: 'Uzaq Kafe', amenity: 'cafe', 'diet:halal': 'yes' } },
      { type: 'way', id: 2, center: { lat: 40.41, lon: 49.868 }, tags: { name: 'Yaxın Qəssab', shop: 'butcher', 'diet:halal': 'only', check_date: '2025-04-12' } },
      { type: 'node', id: 3, lat: 40.411, lon: 49.869, tags: { name: 'Halal deyil', amenity: 'restaurant', 'diet:halal': 'no' } },
    ] } })
  })
  await page.goto('/halal-check')
  await settle(page)
  const box = page.getByTestId('halal-places')
  await box.scrollIntoViewIfNeeded()
  await box.getByRole('button', { name: 'Yerimə görə axtar' }).click()
  await expect(box.locator('.hp-row')).toHaveCount(2)
  expect(query).toContain('diet:halal')
  await expect(box.locator('.hp-row').first()).toContainText('Yaxın Qəssab')
  await expect(box.locator('.hp-row').first()).toContainText('Yalnız halal')
  await expect(box.locator('.hp-row').first()).toContainText('2025-04-12')
  await expect(box.locator('.hp-row').nth(1)).toContainText('Halal seçim var')
  await expect(box.locator('.hp-row').first().getByRole('link', { name: 'OSM-də bax' })).toHaveAttribute('href', 'https://www.openstreetmap.org/way/2')
  await expect(box.locator('.hp-map__dot')).toHaveCount(2)
  await expect(box.getByRole('note')).toContainText('sertifikat deyil')
  expect(await axe(page, '[data-testid="halal-places"]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('stikerlər: 10 stiker çəkilir, xətt və rəng dəyişir, yükləmə PNG verir', async ({ page, consoleProblems }) => {
  await page.goto('/quotes')
  await settle(page)
  const pack = await reach(page, 'sticker-pack')
  await expect(pack.locator('canvas.stk-canvas')).toHaveCount(10)
  // kətan boş deyil (mərkəzdə qeyri-şəffaf piksel)
  const filled = async () => pack.locator('canvas.stk-canvas').first().evaluate((c) => c.getContext('2d').getImageData(256, 236, 1, 1).data[3])
  await expect.poll(filled).toBeGreaterThan(0)
  await pack.getByRole('button', { name: 'Kufi' }).click()
  await pack.getByRole('button', { name: /Lacivərd/ }).click()
  await expect(pack.getByRole('button', { name: /Lacivərd/ })).toHaveAttribute('aria-pressed', 'true')
  const dl = page.waitForEvent('download')
  await pack.getByRole('button', { name: /^Yüklə: Cümə mübarək/ }).click()
  expect((await dl).suggestedFilename()).toBe('muslims-cc-jumua.png')
  expectCleanConsole(consoleProblems)
})

test('əbru: toxunuş damcı əlavə edir, hazır naxış qurulur', async ({ page, consoleProblems }) => {
  await page.goto('/quotes')
  await settle(page)
  const e = await reach(page, 'ebru')
  const cv = e.getByTestId('ebru-canvas')
  const before = Number(await e.getAttribute('data-drops'))
  const b = await cv.boundingBox()
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 3)
  await expect.poll(async () => Number(await e.getAttribute('data-drops'))).toBeGreaterThan(before)
  await e.locator('[data-preset="flower"]').click()
  await expect.poll(async () => Number(await e.getAttribute('data-drops'))).toBeGreaterThan(3)
  expectCleanConsole(consoleProblems)
})

test('uşaq təbrik kartı: ad + nailiyyət → kart şəkli, yükləmə', async ({ page, consoleProblems }) => {
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Təbrik kartı' }).click()
  const kc = page.getByTestId('kids-certificate')
  await kc.getByLabel('Uşağın adı').fill('Aişə')
  await kc.getByRole('button', { name: 'Fatihə surəsini əzbərlədi' }).click()
  await kc.getByRole('button', { name: 'Kartı yarat' }).click()
  const img = kc.locator('img.kc-img')
  await expect(img).toBeVisible()
  await expect(img).toHaveAttribute('alt', 'Aişə üçün təbrik kartı')
  expect(await img.evaluate((i) => i.naturalWidth)).toBe(1600)
  const dl = page.waitForEvent('download')
  await kc.getByRole('button', { name: 'Şəkli yüklə' }).click()
  expect((await dl).suggestedFilename()).toMatch(/^muslims-cc-.*\.png$/)
  expect(await axe(page, '[data-testid="kids-certificate"]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('sədəqə gündəliyi: "Kimə" saxlanır, illər üzrə cəm', async ({ page, consoleProblems }) => {
  // Səhifə skriptlərindən ƏVVƏL yaz (goto → setItem → reload ardıcıllığında açıq səhifə
  // reload zamanı öz boş vəziyyətini yaza bilir — CI-da yarış, 2026-11-25)
  await page.addInitScript(() => {
    if (!localStorage.getItem('charity_log')) localStorage.setItem('charity_log', JSON.stringify([
      { id: 1, date: '2025-03-01', type: 'money', amount: 20, description: '' },
      { id: 2, date: '2025-07-09', type: 'food', amount: null, description: '' },
    ]))
  })
  await page.goto('/charity')
  await settle(page)
  await page.getByLabel('Məbləğ (istəyə bağlı)').fill('10')
  await page.getByLabel('Kimə (istəyə bağlı)').fill('Qonşu')
  await page.getByRole('button', { name: 'Əlavə et' }).click()
  await expect(page.locator('.ch-entry-to').first()).toContainText('Qonşu')
  const years = page.getByTestId('charity-years')
  await expect(years.locator('.ch-year')).toHaveCount(2)
  await expect(years.locator('.ch-year').nth(1)).toContainText('2025')
  await expect(years.locator('.ch-year').nth(1)).toContainText('2 əməl')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('charity_log')).find(e => e.to)?.to)
  expect(saved).toBe('Qonşu')
  expectCleanConsole(consoleProblems)
})

test('məşrəbiyyə: sürgü vaxtı dəyişir, zöhr işarəsi günəşi ən yüksəyə qaldırır', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  const m = await reach(page, 'mashrabiya')
  await expect(m.getByTestId('mashrabiya-canvas')).toBeVisible()
  await m.locator('[data-prayer="dhuhr"]').click()
  const noon = Number(await m.getAttribute('data-alt'))
  await m.locator('[data-prayer="asr"]').click()
  await expect.poll(async () => Number(await m.getAttribute('data-alt'))).toBeLessThan(noon)
  expect(noon).toBeGreaterThan(0)
  expectCleanConsole(consoleProblems)
})

test('fil saatı: kasa səviyyəsi real vaxtla, mexanizm düyməsi buraxılışı oynadır', async ({ page, consoleProblems }) => {
  await page.goto('/history#elm')
  await settle(page)
  const c = await reach(page, 'elephant-clock')
  const lvl = Number(await c.getAttribute('data-level'))
  expect(lvl).toBeGreaterThanOrEqual(0)
  expect(lvl).toBeLessThanOrEqual(1)
  await c.getByTestId('jzc-xray').click()
  await c.getByTestId('jzc-play').click()
  await expect(c).toHaveAttribute('data-phase', 'release')
  expectCleanConsole(consoleProblems)
})
