// ═══════════════════════════════════════════════════════
// /prayerguide — Namaz necə qılınır:
//   • addımlar irəliləyir/geri gedir, fiqur mövqeyi dəyişir
//   • 4 rükətli namazın bütün ardıcıllığı data ilə üst-üstə düşür
//   • səs düyməsi yalnız səsi olan zikrdə görünür
//   • "Kağızla namaz" (?mode=paper) toxunuşla irəliləyir, Esc/Geri bağlayır
//   • ərəbcə (RTL): ox düymələri güzgülənir, transliterasiya göstərilmir
//   • dəstəmaz: 8 addım → dəstəmazdan sonrakı dua
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { buildSequence, ACTIONS } from '../../src/data/prayerGuide.js'

// Fatihə / İxlas mənası (alquran.cloud, tək nəşr) — sabit cavab
test.beforeEach(async ({ page }) => {
  await page.route(/api\.alquran\.cloud\/v1\/surah\/(\d+)\/[a-z]{2}\.[a-z]+/, route => {
    const s = Number(route.request().url().match(/surah\/(\d+)\//)[1])
    const n = s === 112 ? 4 : 7
    route.fulfill({ json: { code: 200, data: { edition: { name: 'Test' }, ayahs: Array.from({ length: n }, (_, i) => ({ text: `[məna ${i + 1}]` })) } } })
  })
})

async function openPrayer(page, url, key) {
  await page.goto(url)
  await settle(page)
  await page.locator(`[data-prayer="${key}"]`).click()
  await expect(page.locator('.pg-step-card')).toBeVisible()
}

test('addımlar irəliləyir, geri gedir və fiqur mövqeyi dəyişir', async ({ page, consoleProblems }) => {
  await openPrayer(page, '/prayerguide', 'dhuhr')
  const card = page.locator('.pg-step-card')
  await expect(page.locator('.pg-progress-count')).toContainText('Addım 1/35')
  await expect(card).toHaveAttribute('data-step', 'niyyah')
  await expect(card.locator('svg[data-pose]')).toHaveAttribute('data-pose', 'stand')
  await expect(card.locator('.pg-ref').first()).toBeVisible()

  await page.getByRole('button', { name: 'Növbəti' }).click()
  await expect(card).toHaveAttribute('data-step', 'takbir')
  await expect(card.locator('svg[data-pose]')).toHaveAttribute('data-pose', 'takbir')
  // Təkbirin açıq lisenziyalı səsi var — "Dinlə" düyməsi görünür
  await expect(card.locator('[data-zikr="takbir"] .pg-audio')).toBeVisible()

  await page.getByRole('button', { name: 'Əvvəlki' }).click()
  await expect(card).toHaveAttribute('data-step', 'niyyah')

  // Rüku: təsbihin səsi yoxdur — düymə göstərilmir; keçid təkbirində var
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Növbəti' }).click()
  await expect(card).toHaveAttribute('data-step', 'ruku')
  await expect(card.locator('[data-zikr="ruku"] .pg-audio')).toHaveCount(0)
  await expect(card.locator('[data-zikr="ruku"]')).toContainText('3 dəfə')
  await expect(card.locator('[data-zikr="takbir"] .pg-audio')).toHaveCount(1)

  // İxtilaflı addımda "imamınızdan soruşun" qeydi
  await page.getByRole('button', { name: 'Növbəti' }).click()
  await expect(card).toHaveAttribute('data-step', 'itidal')
  await expect(card.locator('.pg-note--ask')).toContainText('İmamınızdan soruşun')
  expectCleanConsole(consoleProblems)
})

test('4 rükətli namazın ardıcıllığı düzgündür (35 addım)', async ({ page, consoleProblems }) => {
  const expected = buildSequence(4)
  await openPrayer(page, '/prayerguide', 'isha')
  const card = page.locator('.pg-step-card')
  const next = page.getByRole('button', { name: 'Növbəti' })
  for (let i = 0; i < expected.length; i++) {
    await expect(card, `addım ${i + 1}`).toHaveAttribute('data-step', expected[i].id)
    await expect(card.locator('svg[data-pose]')).toHaveAttribute('data-pose', expected[i].pose)
    await expect(page.locator('.pg-step-eyebrow')).toContainText(`Rükət ${expected[i].rakat}`)
    await next.click()
  }
  await expect(page.getByRole('heading', { name: 'Namaz tamamlandı' })).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('3 rükətli (axşam) namazda birinci təşəhhüddən sonra 3-cü rükətə qalxılır', async ({ page }) => {
  await openPrayer(page, '/prayerguide', 'maghrib')
  const seq = buildSequence(3)
  const idx = seq.findIndex(s => s.id === 'tashahhud1')
  // addımlar siyahısından birbaşa keçid
  await page.locator('.pg-outline summary').click()
  await page.locator('.pg-outline-btn').nth(idx).click()
  await expect(page.locator('.pg-step-card')).toHaveAttribute('data-step', 'tashahhud1')
  await expect(page.locator('.pg-progress-count')).toContainText(`Addım ${idx + 1}/29`)
  await page.getByRole('button', { name: 'Növbəti' }).click()
  await expect(page.locator('.pg-step-card')).toHaveAttribute('data-step', 'rise3')
  await expect(page.locator('.pg-step-name')).toHaveText(ACTIONS.rise3.name.az)
})

test('Kağızla namaz: toxunuşla irəliləyir, Esc ilə bağlanır', async ({ page, consoleProblems }) => {
  await page.goto('/prayerguide')
  await settle(page)
  await page.locator('.pg-paper-open').click()
  await expect(page).toHaveURL(/[?&]mode=paper/)
  const dlg = page.getByRole('dialog', { name: 'Kağızla namaz' })
  await expect(dlg).toBeVisible()
  // Sahibin göstərişi: başlanğıcda qeyd
  await expect(dlg.getByRole('note')).toContainText('imamınızdan soruşun')

  await dlg.getByRole('button', { name: /İşa/ }).click()
  await dlg.getByRole('button', { name: /Başla/ }).click()
  await expect(dlg.locator('.pm-count')).toContainText('Addım 1/35')
  await expect(dlg.locator('.pm-action')).toHaveText(ACTIONS.niyyah.name.az)

  // Ekranın istənilən yerinə toxunuş — növbəti addım
  const body = dlg.locator('.pm-body')
  await body.click()
  await expect(dlg.locator('.pm-count')).toContainText('Addım 2/35')
  await expect(dlg.locator('.pm-tl').first()).toHaveText('Allahu əkbər')
  await dlg.locator('.pm-foot').click()
  await expect(dlg.locator('.pm-count')).toContainText('Addım 3/35')
  await expect(dlg.locator('.pm-next')).toContainText(ACTIONS.fatiha.name.az)
  // "Əvvəlki" düyməsi toxunuşu "növbəti" saymır
  await dlg.getByRole('button', { name: 'Əvvəlki' }).click()
  await expect(dlg.locator('.pm-count')).toContainText('Addım 2/35')

  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await expect(page).not.toHaveURL(/mode=paper/)
  expectCleanConsole(consoleProblems)
})

test('Kağızla namaz birbaşa ünvanla açılır və Geri ilə bağlanır', async ({ page }) => {
  await page.goto('/prayerguide')
  await settle(page)
  await page.locator('.pg-paper-open').click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/prayerguide?mode=paper')
  await expect(page.getByRole('dialog', { name: 'Kağızla namaz' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Çıx' }).first().click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/prayerguide$/)
})

test('ərəbcə (RTL): ox düymələri güzgülənir, transliterasiya yoxdur', async ({ page, consoleProblems }) => {
  await openPrayer(page, '/ar/prayerguide', 'fajr')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  const card = page.locator('.pg-step-card')
  await expect(page.locator('.pg-progress-count')).toContainText('1/22')
  // RTL-də "irəli" — sol ox
  await page.keyboard.press('ArrowLeft')
  await expect(card).toHaveAttribute('data-step', 'takbir')
  await page.keyboard.press('ArrowRight')
  await expect(card).toHaveAttribute('data-step', 'niyyah')
  await page.keyboard.press('ArrowLeft')
  await expect(card.locator('.pg-zikr-ar').first()).toHaveText('اللَّهُ أَكْبَرُ')
  await expect(card.locator('.pg-zikr-tl')).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 2, name: 'تكبيرة الإحرام' })).toBeVisible()

  // Kağız rejimi RTL-də də toxunuşla irəliləyir
  await page.goto('/ar/prayerguide?mode=paper')
  const dlg = page.getByRole('dialog')
  await dlg.locator('.pm-start').click()
  await expect(dlg.locator('.pm-count')).toContainText('1/22')
  await dlg.locator('.pm-body').click()
  await expect(dlg.locator('.pm-count')).toContainText('2/22')
  await expect(dlg.locator('.pm-tl')).toHaveCount(0)
  await expect(dlg.locator('.pm-ar').first()).toHaveText('اللَّهُ أَكْبَرُ')
  expectCleanConsole(consoleProblems)
})

test('dəstəmaz: 8 addım, sonda dua və istinad', async ({ page, consoleProblems }) => {
  await page.goto('/prayerguide')
  await settle(page)
  await page.getByRole('button', { name: 'Dəstəmaz' }).click()
  const card = page.locator('.pg-step-card')
  await expect(card).toHaveAttribute('data-step', 'intent')
  await expect(card.locator('svg[data-pose]')).toHaveAttribute('data-pose', 'jug')
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Növbəti' }).click()
  await expect(page.getByRole('heading', { name: 'Dəstəmaz tamamlandı' })).toBeVisible()
  await expect(page.locator('.pg-complete [data-zikr="wuduDua"]')).toBeVisible()
  await expect(page.locator('.pg-complete .pg-ref').first()).toContainText('Müslim 234')
  expectCleanConsole(consoleProblems)
})

test('qunut bölməsi göstərilmir', async ({ page }) => {
  await page.goto('/prayerguide')
  await settle(page)
  await expect(page.getByRole('button', { name: 'Dəstəmaz' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Qunut' })).toHaveCount(0)
})

// Əlçatanlıq (axe-core, WCAG 2.1 AA + best-practice): addım kartı və kağız rejimi,
// işıqlı və qaranlıq rejimdə — critical/serious pozuntu olmamalıdır
for (const theme of ['light', 'dark']) {
  test(`əlçatanlıq (${theme}): addım kartı və kağız rejimi`, async ({ page }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright')
    const serious = async () => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze())
      .violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
      .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* yox */ } }, theme)
    await openPrayer(page, '/prayerguide', 'dhuhr')
    for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Növbəti' }).click()
    expect(await serious()).toEqual([])
    await page.locator('.pg-paper-open').click()
    await page.getByRole('dialog').locator('.pm-start').click()
    await page.getByRole('dialog').locator('.pm-body').click()
    expect(await serious()).toEqual([])
  })
}
