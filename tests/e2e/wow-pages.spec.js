// ═══════════════════════════════════════════════════════
// VAU vizualları — bağça, dağ, axın, ailə ağacı (yerli yaddaşdan məlumatla)
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('dua bağçası: qönçə və çiçəklər, toxunuşla mətn', async ({ page }) => {
  await page.addInitScript(() => {
    const duas = [
      { id: 'a', text: 'Sağlamlıq duası', category: 'health', priority: 'high', date: '2026-10-01', answered: true, answeredDate: '2026-11-01' },
      { id: 'b', text: 'Ailə üçün dua', category: 'family', priority: 'low', date: '2026-10-05', answered: false, answeredDate: null },
    ]
    localStorage.setItem('dua_journal', JSON.stringify({ duas }))
  })
  await page.goto('/duajournal')
  await settle(page)
  const g = page.getByTestId('dua-garden')
  await expect(g.locator('.dg__plant')).toHaveCount(2)
  await expect(g.locator('.dg__flower')).toHaveCount(1)
  await expect(g.locator('.dg__bud')).toHaveCount(1)
  await g.locator('.dg__plant').nth(1).click()
  await expect(g.locator('.dg__note')).toContainText('Ailə üçün dua')
})

test('qəza dağı: faiz və qalan say', async ({ page }) => {
  await page.addInitScript(() => {
    const x = (o, d) => ({ owed: o, done: d })
    localStorage.setItem('muslim_cc_qada_v1', JSON.stringify({ v: 1, prayers: { fajr: x(150, 50), dhuhr: x(150, 50), asr: x(150, 50), maghrib: x(150, 50), isha: x(150, 50) }, fasts: x(0, 0), goal: 5, log: {} }))
  })
  await page.goto('/qada')
  await settle(page)
  const m = page.getByTestId('qada-mountain')
  await expect(m.locator('.qm__pct')).toHaveText('25%')
  await expect(m).toContainText('750')
  await expect(m.locator('.qm__camp.is-on')).toHaveCount(2)
})

test('kviz kombo: ardıcıl düz cavablar sayılır, səhvdə sıfırlanır, nəticədə ən uzun seriya', async ({ page }) => {
  await page.goto('/quiz')
  await settle(page)
  await page.locator('.quiz-category-card').first().click()
  let streak = 0, best = 0
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.quiz-results-card').isVisible()) break
    const opts = page.locator('.quiz-option')
    await expect(opts.first()).toBeVisible()
    await opts.first().click()
    const right = await opts.first().evaluate(el => el.classList.contains('quiz-option-correct'))
    streak = right ? streak + 1 : 0
    best = Math.max(best, streak)
    const combo = page.getByTestId('quiz-combo')
    if (streak >= 2) await expect(combo).toContainText(`×${streak}`)
    else await expect(combo).toHaveCount(0)
    await page.locator('.quiz-next-btn').click()
  }
  await expect(page.locator('.quiz-results-card')).toBeVisible()
  await expect(page.locator('.quiz-stat-streak')).toHaveCount(best >= 2 ? 1 : 0)
  if (best >= 2) await expect(page.locator('.quiz-stat-streak .quiz-stat-num')).toHaveText(String(best))
})

test('Quranın xəritəsi: əzbər sayı və toxunuşla ayə', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hifz_progress', JSON.stringify({ 1: 2, 114: 2 })))
  await page.goto('/hifz')
  await settle(page)
  const m = page.getByTestId('quran-map')
  await m.scrollIntoViewIfNeeded()
  await expect(m.locator('.qmap__legend li').first()).toContainText('13')
  const box = await m.locator('canvas').boundingBox()
  await page.mouse.click(box.x + 2, box.y + 2)
  await expect(m.locator('.qmap__info')).toContainText('1:1')
})

test('hilal yolu: toxunuş dövrü oruc → üzrlü → boş, yaddaşda qalır', async ({ page }) => {
  await page.goto('/ramadan?ramadan=preview&day=3')
  await settle(page)
  const c = page.getByTestId('crescent-path')
  const m = c.locator('.cp__moon').nth(1)
  await m.click()
  await expect(m).toHaveAttribute('aria-pressed', 'true')
  await expect(c.getByTestId('cp-fasted')).toHaveText('1')
  await page.reload(); await settle(page)
  await expect(c.getByTestId('cp-fasted')).toHaveText('1')
  await c.locator('.cp__moon').nth(1).click()
  await expect(c.locator('.cp__moon--2')).toHaveCount(1)
  await expect(c.getByTestId('cp-fasted')).toHaveText('0')
  await expect(c.locator('.cp__star')).toHaveCount(5)
})
