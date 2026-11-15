// ═══════════════════════════════════════════════════════
// v6.9: hədisin rəsmi az tərcüməsi + şərh, ravi → səhabə, səhabənin rəvayətləri,
// hədis əzbərləmə, İsra və Merac, zikr mozaikası
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

const axe = async (page, sel) => {
  const { violations } = await new AxeBuilder({ page }).include(sel)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
}

test('tam mətn: rəsmi az tərcüməsi və şərh (HadeethEnc), ravi keçidi səhabəyə aparır', async ({ page, consoleProblems }) => {
  await page.goto('/hadith/14')
  await settle(page)
  const card = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await card.getByTestId('hadith-full-btn').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg.locator('.hfull__tr').first()).toContainText('qəzəb zamanı')
  await expect(dlg.locator('.hfull__expl')).toBeVisible()
  await expect(dlg.getByRole('link', { name: 'Mənbədə aç' })).toHaveAttribute('href', /hadeethenc\.com\/az\/browse\/hadith\/\d+/)
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  await card.getByRole('link', { name: 'Əbu Hureyrə' }).click()
  await expect(page).toHaveURL(/\/sahaba\/abu-hurairah$/)
  const n = page.getByTestId('sahaba-narrations')
  await n.scrollIntoViewIfNeeded()
  await expect(n.locator('li')).toHaveCount(6)
  await n.getByRole('button', { name: /Hamısını göstər/ }).click()
  expect(await n.locator('li').count()).toBeGreaterThan(100)
  expectCleanConsole(consoleProblems)
})

test('hədis əzbərləmə: sevimlilər → kart, ərəbcə, "Bildim" növbəni azaldır', async ({ page }) => {
  await page.goto('/hadith')
  await page.evaluate(() => { localStorage.setItem('hadith_favs', '[1,3]'); localStorage.removeItem('hadith_srs_v1') })
  await page.reload()
  await settle(page)
  await page.locator('.hadith-chip-fav').click()
  const bar = page.getByTestId('hadith-mem-bar')
  await expect(bar).toContainText('2 təkrar gözləyir')
  await bar.getByRole('button', { name: 'Əzbərlə' }).click()
  const dlg = page.getByRole('dialog')
  await expect(dlg).toContainText('2 qaldı')
  await dlg.getByRole('button', { name: 'Ərəbcəni göstər' }).click()
  await expect(dlg.getByTestId('hmem-ar')).toBeVisible()
  expect(await axe(page, '[role=dialog]')).toEqual([])
  await dlg.getByRole('button', { name: 'Bildim' }).click()
  await expect(dlg).toContainText('1 qaldı')
  await dlg.getByRole('button', { name: 'Ərəbcəni göstər' }).click()
  await dlg.getByRole('button', { name: 'Bildim' }).click()
  await expect(dlg.getByTestId('hmem-done')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(bar).toContainText('Bu gün təkrar yoxdur')
})

for (const theme of ['light', 'dark']) {
  test(`İsra və Merac: ayə, 7 səma, əlçatanlıq (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/history')
    await settle(page)
    await page.locator('.history-maps-pair').scrollIntoViewIfNeeded()
    const j = page.getByTestId('isra-journey')
    // DeferRender — bölmə ekrana yaxınlaşanda yüklənir: addım-addım aşağı
    for (let i = 0; i < 30 && !(await j.count()); i++) {
      await page.evaluate(() => window.scrollBy(0, 500))
      await page.waitForTimeout(200)
    }
    await j.scrollIntoViewIfNeeded()
    await expect(j.locator('.isj__stop')).toHaveCount(9)
    await expect(j.locator('.isj__ar')).toContainText('ٱلْمَسْجِدِ ٱلْأَقْصَا')
    await expect(j.locator('.isj__stop').nth(8)).toContainText('İbrahim')
    expect(await axe(page, '[data-testid=isra-journey]')).toEqual([])
  })

  test(`Nur mozaikası (zikr): say və əlçatanlıq (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/dhikr')
    await page.evaluate(() => localStorage.setItem('dhikr_count_total', '245'))
    await page.reload()
    await settle(page)
    const m = page.getByTestId('nur-mosaic')
    await m.scrollIntoViewIfNeeded()
    await expect(m).toContainText('47')
    await expect(m.locator('.nm__tile.is-lit')).toHaveCount(47)
    expect(await axe(page, '[data-testid=nur-mosaic]')).toEqual([])
  })
}

test('isnad zənciri, kartın şərh üzü və Story düyməsi', async ({ page, consoleProblems }) => {
  await page.goto('/hadith/1')
  await settle(page)
  const card = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await expect(card.getByRole('link', { name: 'Kart yarat' })).toHaveAttribute('href', /\/quotes\?.*hadith=1/)
  await card.getByTestId('hadith-full-btn').click()
  const chain = page.getByRole('dialog').getByTestId('isnad-chain')
  await expect(chain.locator('.isn__node')).toHaveCount(6)   // Buxari + 4 ravi + Peyğəmbər ﷺ
  await expect(chain.locator('.isn__node').last()).toContainText('Peyğəmbər')
  expect(await axe(page, '[role=dialog]')).toEqual([])
  await page.keyboard.press('Escape')
  await page.goto('/hadith/14')
  await settle(page)
  const c14 = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await c14.getByTestId('hadith-flip-btn').click()
  await expect(c14).toHaveClass(/is-flipped/)
  await expect(c14.locator('.hadith-back__x')).toContainText('qəzəb')
  await c14.getByRole('button', { name: 'Hədisə qayıt' }).click()
  await expect(c14).not.toHaveClass(/is-flipped/)
  expectCleanConsole(consoleProblems)
})

test('fon səsi: 4 təbiət səsi seçilir, söndürülür, xəta yoxdur', async ({ page, consoleProblems }) => {
  await page.goto('/dhikr')
  await settle(page)
  const btn = page.getByTestId('ambient-btn')
  await btn.click()
  const panel = page.getByTestId('ambient-panel')
  for (const name of ['Yağış', 'Külək', 'Dəniz', 'Gecə']) {
    await panel.getByRole('button', { name }).click()
    await expect(panel.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    await page.waitForTimeout(300)
  }
  await expect(btn).toContainText('Gecə')
  expect(await axe(page, '[data-testid=ambient-panel]')).toEqual([])
  await panel.getByRole('button', { name: 'Söndür' }).click()
  await expect(btn).toContainText('Fon səsi')
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`planetari: göy çəkilir, vaxt sürgüsü, əlçatanlıq (${theme})`, async ({ page, consoleProblems }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T19:30:00Z'))
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/qibla')
    await settle(page)
    const s = page.getByTestId('sky-planetarium')
    for (let i = 0; i < 40 && !(await s.count()); i++) { await page.evaluate(() => window.scrollBy(0, 600)); await page.waitForTimeout(150) }
    await s.scrollIntoViewIfNeeded()
    await expect(s.locator('canvas')).toBeVisible()
    const label = s.locator('.skyp__time b')
    const before = await label.textContent()
    await s.locator('input[type=range]').fill('3')
    await expect(label).not.toHaveText(before)
    await s.getByRole('button', { name: 'İndi' }).click()
    await expect(label).toHaveText(before)
    expect(await axe(page, '[data-testid=sky-planetarium]')).toEqual([])
    expectCleanConsole(consoleProblems)
  })
}
