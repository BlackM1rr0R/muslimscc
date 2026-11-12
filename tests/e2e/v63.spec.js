// v6.3: Rəsdül-qiblə, dünyada oruc müddəti, Surələr şəhəri 3D, adı mənası ilə cütlə,
// uşaqlar üçün dəstəmaz oyunu, rəvayət qalaktikası
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 70 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Rəsdül-qiblə: geri sayım, şəhər vaxtı, 4 növbəti an', async ({ page }) => {
  await page.goto('/qibla')
  await settle(page)
  const sec = page.getByTestId('rasd-qibla')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('rqb-countdown')).toContainText('gün')
  await expect(sec.getByTestId('rqb-local')).toContainText(/\d{2}:\d{2}/)
  await expect(sec.getByTestId('rqb-list').locator('li')).toHaveCount(4)
  await expect(sec.getByTestId('rqb-list')).toContainText('may')
  await expect(sec.getByTestId('rqb-list')).toContainText('iyul')
})

test('Oruc xəritəsi: Ramazan günü dəyişir, sizin şəhər və reytinq', async ({ page }) => {
  await page.goto('/ramadan')
  await settle(page)
  const sec = page.getByTestId('fasting-map')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('fwm-you')).toContainText('saat')
  await expect(sec.getByTestId('fwm-long').locator('li')).toHaveCount(5)
  await expect(sec.getByTestId('fwm-short').locator('li')).toHaveCount(5)
  await sec.getByTestId('fwm-range').fill('20')
  await expect(sec.getByTestId('fwm-day')).toHaveText('21')
  const box = await sec.getByTestId('fwm-canvas').boundingBox()
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.4)
  await expect(sec.getByTestId('fwm-pt')).toBeVisible()
})

test('Surələr şəhəri: siyahıdan surə seçilir, kart və "Surəni aç"', async ({ page }) => {
  await page.goto('/quran')
  await settle(page)
  const sec = page.getByTestId('surah-city')
  await scrollTo(page, sec)
  await sec.getByTestId('scy-select').selectOption('96')
  const card = sec.getByTestId('scy-card')
  await expect(card).toContainText('96.')
  await expect(card).toContainText('Məkki')
  await expect(card).toContainText('Nazil olma sırası: 1')
  await sec.getByTestId('scy-select').selectOption('2')
  await expect(card).toContainText('286')
  await expect(card).toContainText('Mədəni')
  await card.getByTestId('scy-open').click()
  await expect(page).toHaveURL(/\/quran\/2/)
})

test('Adı mənası ilə cütlə: cüt tapılır, səviyyə bitir', async ({ page }) => {
  await page.goto('/names')
  await settle(page)
  const g = page.getByTestId('names-match')
  await scrollTo(page, g)
  const cards = g.getByTestId('nmg-card')
  await expect(cards).toHaveCount(12)
  const meta = await cards.evaluateAll(bs => bs.map(b => ({ id: b.dataset.id, kind: b.dataset.kind })))
  // Bir səhv cəhd
  const wrong = meta.findIndex((m, i) => i > 0 && m.id !== meta[0].id)
  await cards.nth(0).click(); await cards.nth(wrong).click()
  await expect(g.getByTestId('nmg-moves')).toHaveText('1')
  await page.waitForTimeout(1000)
  // Hamısını düz cütlə
  const ids = [...new Set(meta.map(m => m.id))]
  for (const id of ids) {
    const a = meta.findIndex(m => m.id === id && m.kind === 'ar'), b = meta.findIndex(m => m.id === id && m.kind === 'm')
    await cards.nth(a).click(); await cards.nth(b).click()
  }
  await expect(g.getByTestId('nmg-won')).toBeVisible()
  await expect(g.getByTestId('nmg-moves')).toHaveText('7')
})

test('Dəstəmaz oyunu: səhv kart titrəyir, düz sıra ilə bitir', async ({ page }) => {
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Dəstəmaz oyunu' }).first().click()
  const w = page.getByTestId('wudu-order')
  await expect(w).toBeVisible()
  const n = await w.getByTestId('wdo-card').count()
  expect(n).toBe(8)
  await w.locator('[data-testid=wdo-card][data-step="3"]').click()
  await expect(w.getByTestId('wdo-mistakes')).toHaveText('1')
  for (let i = 0; i < n; i++) await w.locator(`[data-testid=wdo-card][data-step="${i}"]`).click()
  await expect(w.getByTestId('wdo-done')).toBeVisible()
  await expect(w).toContainText('Buxari 159')
})

test('Rəvayət qalaktikası: 9 ulduz, seçim kartı dəyişir, səhabə səhifəsinə keçid', async ({ page }) => {
  await page.goto('/sahaba')
  await settle(page)
  const g = page.getByTestId('narrator-galaxy')
  await scrollTo(page, g)
  await expect(g.getByTestId('ngx-star')).toHaveCount(9)
  await expect(g.getByTestId('ngx-count')).toContainText('5 374')
  await g.getByTestId('ngx-bar').nth(2).click()
  await expect(g.getByTestId('ngx-card')).toContainText('Ənəs ibn Malik')
  await expect(g.getByTestId('ngx-count')).toContainText('2 286')
  await expect(g.getByTestId('ngx-card').locator('a')).toHaveAttribute('href', /\/sahaba\/anas-ibn-malik$/)
  await expect(g).toContainText('İbn əl-Cövzi')
})
