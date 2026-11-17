// ═══════════════════════════════════════════════════════
// vE: Ramazan albomu, ömürlük dua bağçası, məscid kolleksiyası, sədəqə hesabatı
//   • əkilmiş məlumat (oruclar, dualar, zikr) → /ramadan-da "Ramazan 1447" fəsli, müqayisə, PNG
//   • dua gündəliyində "Qəbul oldu" → ömürlük bağçada çiçək
//   • məscid: "Buradayam" (saxta geolokasiya + saxta Overpass) → xəritədə nöqtə, siyahıda; axtarış
//     nəticəsindən "Ziyarət etdim"
//   • sədəqə hesabatı: məbləğləri gizlət → ekranda / CSV-də məbləğ yoxdur
//   • /account-da 4 bölmə; /en-də azərbaycanca yazı yoxdur; axe (açıq + tünd, ərəbcə RTL)
// Overpass mock-u /overpass/ — yeni modulların adında "overpass" YOXDUR (chunk adı ilə toqquşmasın).
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { fakeUserSession } from './userAuth.js'

async function reach(page, testId) {
  const el = page.getByTestId(testId).first()
  for (let i = 0; i < 90 && !(await el.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 700))
    await page.waitForTimeout(120)
  }
  await el.scrollIntoViewIfNeeded()
  return el
}
const seed = (page, data) => page.addInitScript((d) => {
  if (sessionStorage.getItem('ve-seeded')) return
  sessionStorage.setItem('ve-seeded', '1')
  for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
}, data)
// Web Share yoxdur → PNG yüklənir (masaüstü / CI eyni davransın)
const noShare = (page) => page.addInitScript(() => {
  try { Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }) } catch { /* */ }
  try { Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined, configurable: true }) } catch { /* */ }
})

const J = JSON.stringify
// Ramazan 1447 = 18.02.2026 – 19.03.2026 (Ümmül-Qura)
const fasts = {}
for (let d = 1; d <= 20; d++) fasts[d] = 1
fasts[21] = 2
const RAMADAN_DATA = {
  muslim_cc_ramadan_fasts_v1: J({ 1447: fasts }),
  dua_journal: J({ duas: [
    { id: 'r1', text: 'Ailəm üçün sağlamlıq', category: 'family', priority: 'high', date: '2026-02-20', answered: true, answeredDate: '2026-03-10' },
    { id: 'r2', text: 'Elm üçün dua', category: 'personal', priority: 'medium', date: '2026-03-01', answered: false, answeredDate: null },
  ] }),
  muslim_cc_iftar_log_v1: J({ '2026-03-05': 2 }),
  ramadan_album_v1: J({ v: 1, y: { 1446: { s: '2025-03-01', e: '2025-03-29', f: 15, du: 1, fin: 1 } } }),
}
// Gəncə yaxınlığı — 110m sərhədlərdə də Azərbaycanın içidir
const MOSQUES = { elements: [
  { type: 'node', id: 701, lat: 40.6821, lon: 46.3612, tags: { name: 'Şah Abbas məscidi' } },
  { type: 'way', id: 702, center: { lat: 40.6835, lon: 46.3630 }, tags: { name: 'Cümə məscidi' } },
] }
const geo = (page) => page.addInitScript(() => {
  navigator.geolocation.getCurrentPosition = (ok) => setTimeout(() => ok({ coords: { latitude: 40.6822, longitude: 46.3613, accuracy: 10 } }), 20)
})
const CHARITY = J([
  { id: 1, date: '2026-01-10', type: 'money', amount: 50, description: '', to: 'Qonşu ailə' },
  { id: 2, date: '2026-02-25', type: 'food', amount: 20, description: '', to: '' },
  { id: 3, date: '2026-03-12', type: 'money', amount: 137.5, description: '', to: 'Məscid' },
  { id: 4, date: '2026-06-01', type: 'smile', amount: null, description: '', to: '' },
])

test('Ramazan albomu: əkilmiş məlumat → "1447" fəsli, müqayisə, PNG kart', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await noShare(page)
  await seed(page, RAMADAN_DATA)
  await page.goto('/ramadan')
  await settle(page)
  const ra = await reach(page, 'ramadan-album')
  await expect(ra).toHaveAttribute('data-chapters', '2')
  const ch = ra.getByTestId('ra-chapter')
  await expect(ch).toHaveAttribute('data-year', '1447')
  await expect(ch).toContainText('Ramazan 1447')
  await expect(ch.locator('[data-metric="f"] dd')).toContainText('20')
  await expect(ch.locator('[data-metric="f"] dd')).toContainText('üzrlü: 1')
  await expect(ch.locator('[data-metric="du"] dd')).toContainText('2')
  await expect(ch.locator('[data-metric="da"] dd')).toContainText('1')
  await expect(ch.locator('[data-metric="ii"] dd')).toContainText('2')
  await expect(ch.locator('[data-metric="q"] dd')).toContainText('ölçülməyib')
  // müqayisə: 20 − 15 = +5
  await expect(ra.locator('table caption')).toContainText('1446')
  await expect(ra.locator('tr', { hasText: 'Oruc' })).toContainText('+5')
  // əvvəlki fəsil
  await ra.getByRole('button', { name: /1446/ }).click()
  await expect(ra.getByTestId('ra-chapter')).toHaveAttribute('data-year', '1446')
  await ra.getByRole('button', { name: /1447/ }).click()
  const dl = page.waitForEvent('download')
  await ra.getByTestId('ra-card').click()
  expect((await dl).suggestedFilename()).toBe('ramadan-1447.png')
  // fəsil yaddaşa yazılıb (snapshot)
  const al = await page.evaluate(() => JSON.parse(localStorage.getItem('ramadan_album_v1')))
  expect(al.y['1447']).toMatchObject({ f: 20, x: 1, du: 2, da: 1, ii: 2, fin: 1 })
  expectCleanConsole(consoleProblems)
})

test('dua gündəliyi: "Qəbul oldu" → ömürlük bağçada çiçək', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await seed(page, { dua_journal: J({ duas: [{ id: 'k1', text: 'Yeni iş üçün dua', category: 'work', priority: 'medium', date: '2026-11-01', answered: false, answeredDate: null }] }) })
  await page.goto('/duajournal')
  await settle(page)
  const g = await reach(page, 'dua-garden-life')
  await expect(g).toHaveAttribute('data-flowers', '0')
  await page.getByRole('button', { name: 'Qəbul oldu' }).first().click()
  await expect(g).toHaveAttribute('data-flowers', '1', { timeout: 8000 })
  const garden = await page.evaluate(() => JSON.parse(localStorage.getItem('dua_garden_v1')))
  expect(garden.b[0][0]).toBe('k1')
  expect(garden.b[0][2]).toBe(3)   // work
  // pillə klaviatura ilə açılır → duanın mətni
  const row = g.locator('.dgl__row').first()
  await row.focus()
  await page.keyboard.press('Enter')
  await expect(g.locator('.dgl__list')).toContainText('Yeni iş üçün dua')
  expectCleanConsole(consoleProblems)
})

test('məscid kolleksiyası: "Buradayam" → xəritə + siyahı; axtarış nəticəsindən "Ziyarət etdim"', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await geo(page)
  const queries = []
  await page.route(/overpass/, (r) => { queries.push(decodeURIComponent(r.request().url())); return r.fulfill({ json: MOSQUES }) })
  await page.goto('/mosques')
  await settle(page)
  const mc = await reach(page, 'mosque-collection')
  await expect(mc).toHaveAttribute('data-count', '0')
  await mc.getByTestId('mc-here').click()
  const form = mc.getByTestId('mc-form')
  await expect(form.getByRole('radio')).toHaveCount(2)
  await expect(form.getByRole('radio').first()).toBeChecked()
  expect(queries.some((q) => q.includes('around:300'))).toBe(true)
  await form.getByLabel('Qeyd (istəyə bağlı)').fill('Cümə namazı')
  await form.getByTestId('mc-add').click()
  await expect(mc).toHaveAttribute('data-count', '1')
  await expect(mc).toHaveAttribute('data-countries', '1')
  await expect(mc.getByTestId('mc-map')).toHaveAttribute('data-points', '1')
  await expect(mc.getByTestId('mc-item')).toContainText('Şah Abbas məscidi')
  await expect(mc.getByTestId('mc-item')).toContainText('Cümə namazı')
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('mosque_visits_v1')))
  expect(st.l[0]).toMatchObject({ i: 'n701', la: 40.6821, lo: 46.3612, cc: '031', no: 'Cümə namazı', c: 1 })
  // axtarış: ilk məscid artıq kolleksiyadadır, ikincini nəticədən əlavə et
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('.mosque-search-btn').click()
  await expect(page.locator('.mosque-row')).toHaveCount(2)
  await expect(page.getByTestId('mosque-in-collection')).toHaveCount(1)
  await page.getByTestId('mosque-checkin').first().click()
  await expect(page.getByTestId('mosque-in-collection')).toHaveCount(2)
  await expect(page.locator('.mosque-checkin-msg')).toContainText('Kolleksiyaya əlavə olundu')
  await expect(mc).toHaveAttribute('data-count', '2')
  expectCleanConsole(consoleProblems)
})

test('sədəqə hesabatı: Ramazan payı, məbləğləri gizlət → ekranda və CSV-də yoxdur', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await noShare(page)
  await seed(page, { charity_log: CHARITY })
  await page.goto('/charity')
  await settle(page)
  const cr = await reach(page, 'charity-report')
  await expect(cr.getByTestId('cr-count')).toHaveText('4')
  await expect(cr.getByTestId('cr-amount')).toContainText('207,5')
  // Ramazan 1447: 25.02 və 12.03 → 2 / 4 = 50%
  await expect(cr.getByTestId('cr-ramadan')).toContainText('50%')
  await expect(cr).toContainText('Qonşu ailə')
  await cr.getByTestId('cr-hide').check()
  await expect(cr).toHaveAttribute('data-hidden', '1')
  await expect(cr.getByTestId('cr-amount')).toHaveText('gizlədilib')
  await expect(cr).not.toContainText('207')
  await expect(cr).not.toContainText('Qonşu ailə')
  const dl = page.waitForEvent('download')
  await cr.getByTestId('cr-csv').click()
  const file = await dl
  expect(file.suggestedFilename()).toBe('charity-report-2026.csv')
  const fs = await import('node:fs')
  const csv = fs.readFileSync(await file.path(), 'utf8')
  expect(csv).toContain('Bölmə,Göstərici,Say\r\n')
  expect(csv).not.toContain('137')
  expect(csv).not.toContain('Məscid')
  const png = page.waitForEvent('download')
  await cr.getByTestId('cr-png').click()
  expect((await png).suggestedFilename()).toBe('charity-report-2026.png')
  expectCleanConsole(consoleProblems)
})

test('/account: albom, bağça, məscidlər, hesabat', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await fakeUserSession(page, { signedIn: true })
  await seed(page, {
    mcc_logged_in: '1', ...RAMADAN_DATA, charity_log: CHARITY,
    mosque_visits_v1: J({ v: 1, l: [{ i: 'n701', n: 'Şah Abbas məscidi', la: 40.6821, lo: 46.3612, cc: '031', d: '2026-11-01', ld: '2026-11-01', c: 1 }] }),
  })
  await page.goto('/account')
  await settle(page)
  const ra = await reach(page, 'acc-ramadan-album')
  await expect(ra.getByTestId('ra-chapter')).toContainText('Ramazan 1447')
  const dg = await reach(page, 'acc-dua-garden')
  // jurnaldakı qəbul olunan dua bağçaya köçür
  await expect(dg.getByTestId('dua-garden-life')).toHaveAttribute('data-flowers', '1')
  const ms = await reach(page, 'acc-mosques')
  await expect(ms.getByTestId('mosque-collection')).toHaveAttribute('data-count', '1')
  await expect(ms.getByTestId('mc-item')).toContainText('Şah Abbas məscidi')
  const ch = await reach(page, 'acc-charity')
  await expect(ch.getByTestId('cr-count')).toHaveText('4')
  expectCleanConsole(consoleProblems)
})

test('/en: yeni bölmələrdə azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await seed(page, {
    ...RAMADAN_DATA, charity_log: CHARITY.replace('Qonşu ailə', 'Neighbours').replace('Məscid', 'Mosque'),
    mosque_visits_v1: J({ v: 1, l: [{ i: 'n701', n: 'Mosque', la: 40.6821, lo: 46.3612, cc: '031', d: '2026-11-01', ld: '2026-11-01', c: 2, no: 'note' }] }),
  })
  const AZ = /[əƏ]|Ramazan|oruc|məscid|Məscid|Sədəqə|gizlət|ölçülməyib|çiçək/
  await page.goto('/en/ramadan')
  await settle(page)
  const ra = await reach(page, 'ramadan-album')
  await expect(ra).toContainText('Ramadan 1447')
  await expect(ra).not.toContainText(AZ)
  await page.goto('/en/duajournal')
  await settle(page)
  const g = await reach(page, 'dua-garden-life')
  await expect(g).toContainText('Lifetime dua garden')
  await expect(g).not.toContainText(/[əƏ]|bağça|çiçək|pillə/)
  await page.goto('/en/mosques')
  await settle(page)
  const mc = await reach(page, 'mosque-collection')
  await expect(mc).toContainText('My mosque collection')
  await expect(mc).not.toContainText(AZ)
  await page.goto('/en/charity')
  await settle(page)
  const cr = await reach(page, 'charity-report')
  await expect(cr).toContainText('Charity report')
  await expect(cr).not.toContainText(AZ)
  expectCleanConsole(consoleProblems)
})

// ── Əlçatanlıq (ciddi/kritik pozuntu olmamalıdır) ──
async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .flatMap((v) => v.nodes.map((n) => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): albom, bağça, məscid kolleksiyası (forma), hesabat; ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(150_000)
    await geo(page)
    await page.route(/overpass/, (r) => r.fulfill({ json: MOSQUES }))
    await page.addInitScript(({ theme, data }) => {
      localStorage.setItem('muslim_cc_theme', theme)
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
    }, {
      theme,
      data: {
        ...RAMADAN_DATA, charity_log: CHARITY,
        dua_garden_v1: J({ v: 1, b: [['r1', '2026-03-10', 1], ['x2', '2025-05-01', 4]] }),
        mosque_visits_v1: J({ v: 1, l: [{ i: 'n702', n: 'Cümə məscidi', la: 40.6835, lo: 46.363, cc: '031', d: '2026-11-01', ld: '2026-11-02', c: 2, no: 'Qeyd' }] }),
      },
    })
    for (const base of ['', '/ar']) {
      await page.goto(`${base}/ramadan`)
      await settle(page)
      await reach(page, 'ramadan-album')
      expect(await serious(page, ['[data-testid="ramadan-album"]'])).toEqual([])
      await page.goto(`${base}/duajournal`)
      await settle(page)
      const g = await reach(page, 'dua-garden-life')
      await g.locator('.dgl__row').first().click()
      expect(await serious(page, ['[data-testid="dua-garden-life"]'])).toEqual([])
      await page.goto(`${base}/mosques`)
      await settle(page)
      const mc = await reach(page, 'mosque-collection')
      await mc.getByTestId('mc-here').click()
      await expect(mc.getByTestId('mc-form')).toBeVisible()
      expect(await serious(page, ['[data-testid="mosque-collection"]'])).toEqual([])
      await page.goto(`${base}/charity`)
      await settle(page)
      await reach(page, 'charity-report')
      expect(await serious(page, ['[data-testid="charity-report"]'])).toEqual([])
    }
  })
}
