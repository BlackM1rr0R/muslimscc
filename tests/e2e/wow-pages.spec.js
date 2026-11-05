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
