// ═══════════════════════════════════════════════════════
// /quran-prophets — Quranda peyğəmbərlər: 25 dairə (sahə = adın keçmə sayı)
//   • ilk render — seçim yoxdur, 25 düymə, Musa (136) ən böyük dairə
//   • toxunuş → panel: ad, say, 114 surəlik zolaq, ayə linkləri; status (aria-live)
//   • Muhəmməd ﷺ — Əhməd (61:6) ayrıca forma; Hud — qeyd; #musa ilə açılış
//   • ox düymələri qonşu dairəyə keçir; ayə linki Quran oxuyucusunu açır
//   • Quran səhifəsində keçid kartı; axe (açıq + tünd), ərəbcə RTL, 360px
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole, reach } from './fixtures.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

async function open(page, path = '/en/quran-prophets') {
  await page.goto(path)
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('[data-testid^="qpr-b-"]')).toHaveCount(25)
}

test('ilk render: seçim yoxdur; Musa ən böyük dairədir; cəmi say', async ({ page, consoleProblems }) => {
  await open(page)
  await expect(page.getByTestId('qpr-hint')).toBeVisible()
  await expect(page.locator('[data-testid^="qpr-b-"][aria-pressed="true"]')).toHaveCount(0)
  const sizes = await page.locator('[data-testid^="qpr-b-"]').evaluateAll(els => els.map(el => ({ id: el.dataset.testid, w: el.getBoundingClientRect().width })))
  const biggest = sizes.reduce((a, b) => (b.w > a.w ? b : a))
  expect(biggest.id).toBe('qpr-b-musa')
  await expect(page.getByRole('button', { name: 'Musa (Moses): 136 times in the Quran', exact: true })).toHaveAttribute('data-testid', 'qpr-b-musa')
  await expect(page.getByTestId('qpr-total')).toContainText('509 times')
  await expect(page.getByTestId('qpr-source')).toContainText('Quranic Arabic Corpus')
  expectCleanConsole(consoleProblems)
})

test('dairəyə toxunuş → panel: say, zolaq, ayə linkləri, status', async ({ page }) => {
  await open(page)
  const musa = page.getByTestId('qpr-b-musa')
  await musa.click()
  await expect(musa).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('qpr-name')).toHaveText('Musa (Moses)')
  await expect(page.getByTestId('qpr-count')).toHaveText('136 times in the Quran')
  await expect(page.getByTestId('qpr-status')).toHaveText('Musa (Moses): 136 times in the Quran.')
  // 114 surəlik zolaq: yalnız adın keçdiyi surələrdə sütun var
  const bars = page.getByTestId('qpr-strip').locator('rect.qpr-strip__bar')
  expect(await bars.count()).toBeGreaterThan(20)
  await expect(page.getByTestId('qpr-strip').locator('rect.qpr-strip__bar[data-s="1"]')).toHaveCount(0)
  await expect(page.getByTestId('qpr-strip').locator('rect.qpr-strip__bar[data-s="20"]')).toHaveCount(1)
  await expect(page.getByTestId('qpr-ayahs').getByRole('link', { name: '20:9', exact: true })).toHaveAttribute('href', /^\/en\/quran\/20-[a-z-]+\?a=9$/)
  await expect(page).toHaveURL(/#musa$/)

  // Muhəmməd ﷺ: 4 dəfə + Əhməd (61:6) ayrıca forma
  await page.getByTestId('qpr-b-muhammad').click()
  await expect(page.getByTestId('qpr-count')).toHaveText('4 times in the Quran')
  await expect(page.getByTestId('qpr-ayahs').getByTestId('qpr-ref')).toHaveCount(4)
  await expect(page.getByTestId('qpr-variant-ahmad')).toContainText('once in the Quran')
  await expect(page.getByTestId('qpr-ayahs-ahmad').getByRole('link', { name: '61:6', exact: true })).toBeVisible()

  // Hud: «yəhudilər» mənasındakı yerlər sayılmır — qeyd
  await page.getByTestId('qpr-b-hud').click()
  await expect(page.getByTestId('qpr-count')).toHaveText('7 times in the Quran')
  await expect(page.getByTestId('qpr-note')).toContainText('2:111')
  await expect(page.getByTestId('qpr-b-musa')).toHaveAttribute('aria-pressed', 'false')
})

test('#yahya ilə açılış (mount-dan sonra); ayə linki oxuyucunu açır', async ({ page }) => {
  await open(page, '/en/quran-prophets#yahya')
  await expect(page.getByTestId('qpr-b-yahya')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('qpr-count')).toHaveText('5 times in the Quran')
  await expect(page.getByTestId('qpr-note')).toContainText('8:42')
  const link = page.getByTestId('qpr-ayahs').getByRole('link', { name: '19:7', exact: true })
  await link.click()
  await expect(page).toHaveURL(/\/en\/quran\/19-[a-z-]+\?a=7/)
})

test('klaviatura: Tab dairəyə, ox düyməsi qonşuya keçir, Enter seçir', async ({ page }) => {
  await open(page)
  const musa = page.getByTestId('qpr-b-musa')
  await musa.focus()
  const before = await page.evaluate(() => document.activeElement?.dataset.testid)
  expect(before).toBe('qpr-b-musa')
  let moved = null
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
    await musa.focus()
    await page.keyboard.press(key)
    const now = await page.evaluate(() => document.activeElement?.dataset.testid)
    if (now && now !== 'qpr-b-musa') { moved = now; break }
  }
  expect(moved).toMatch(/^qpr-b-/)
  await page.keyboard.press('Enter')
  await expect(page.locator(`[data-testid="${moved}"]`)).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('qpr-name')).toBeVisible()
})

test('Quran səhifəsində keçid kartı', async ({ page }) => {
  test.slow()
  await page.goto('/en/quran')
  await settle(page)
  const card = (await reach(page, page.locator('main a[href="/en/quran-prophets"]'))).first()
  await card.click()
  await expect(page).toHaveURL(/\/en\/quran-prophets$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Prophets in the Quran' })).toBeVisible()
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): ingiliscə və ərəbcə (RTL), panel açıq`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => { localStorage.setItem('muslim_cc_theme', th) }, theme)
    for (const base of ['/en', '/ar']) {
      await open(page, `${base}/quran-prophets`)
      if (base === '/ar') {
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('heading', { level: 1 })).toContainText('الأنبياء في القرآن')
      }
      await page.getByTestId('qpr-b-isa').click()
      await expect(page.getByTestId('qpr-variant-masih')).toBeVisible()
      expect(await serious(page, ['.qpr-page']), `${base} (${theme})`).toEqual([])
    }
  })
}

test('360px: üfüqi daşma yoxdur, ən kiçik dairə ≥ 28px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const path of ['/en/quran-prophets', '/ar/quran-prophets', '/quran-prophets']) {
    await open(page, path)
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, path).toBeLessThanOrEqual(1)
    const min = await page.locator('[data-testid^="qpr-b-"]').evaluateAll(els => Math.min(...els.map(el => el.getBoundingClientRect().width)))
    expect(min, path).toBeGreaterThanOrEqual(28)
  }
})
