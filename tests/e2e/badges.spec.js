// ═══════════════════════════════════════════════════════
// Nişanlar (utils/badges, /analytics rəfi, BadgeToast)
//   • rəf qazanılmış və kilidli nişanları irəliləyişlə göstərir
//   • yeni nişan qazananda (xətm planı bitdi) bildiriş çıxır, toxunanda rəfə aparır
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('nişan rəfi: qazanılan və kilidli nişanlar', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    const d = new Date(); d.setDate(d.getDate() - 1)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem('daily_tracker', JSON.stringify({ [k]: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true } }))
  })
  await page.goto('/analytics')
  await settle(page)
  const shelf = page.getByTestId('badge-shelf')
  await shelf.scrollIntoViewIfNeeded()
  await expect(shelf.locator('[data-badge=first_prayer]')).toHaveClass(/is-done/)
  await expect(shelf.locator('[data-badge=full_day]')).toHaveClass(/is-done/)
  const p100 = shelf.locator('[data-badge=prayers_100]')
  await expect(p100).not.toHaveClass(/is-done/)
  await expect(p100).toContainText('5 / 100')
  await expect(page.locator('#an-ach')).toContainText('2/')
})

test('yeni nişan: bildiriş çıxır və rəfə aparır', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  // ilk yoxlama (boş vaxtda) rəfi səssiz yaradır
  await expect.poll(() => page.evaluate(() => localStorage.getItem('qm_badges_v1'))).not.toBeNull()
  await page.evaluate(() => {
    localStorage.setItem('quran_khatm_plan', JSON.stringify({ days: 30, start: '2026-10-01', done: 604, log: [] }))
    window.dispatchEvent(new Event('qm-prayer-sync'))
  })
  const toast = page.getByTestId('badge-toast')
  await expect(toast).toBeVisible()
  await expect(toast).toContainText('Xətm')
  await toast.getByRole('link').click()
  await expect(page).toHaveURL(/\/analytics#an-ach$/)
  await expect(page.getByTestId('badge-shelf').locator('[data-badge=khatm]')).toHaveClass(/is-done/)
})

test('nişanı paylaş: story ölçülü PNG yüklənir', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('qm_badges_v1', JSON.stringify({ khatm: '2026-11-08' })) })
  await page.goto('/analytics')
  await settle(page)
  const btn = page.locator('[data-badge=khatm]').getByTestId('badge-share')
  await btn.scrollIntoViewIfNeeded()
  const [dl] = await Promise.all([page.waitForEvent('download'), btn.click()])
  expect(dl.suggestedFilename()).toBe('muslims-cc-khatm.png')
})

test('ana səhifə salamı: ad yadda qalır, seriya görünür', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    const k = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
    const tr = {}; for (let i = 1; i <= 3; i++) tr[k(i)] = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true }
    localStorage.setItem('daily_tracker', JSON.stringify(tr))
  })
  await page.goto('/')
  await settle(page)
  const g = page.getByTestId('hero-greeting')
  await expect(g).toContainText('Əssəlamu aleykum')
  await expect(g).toContainText('3 gün 5/5')
  await g.getByTestId('hg-edit').click()
  await g.locator('input').fill('Elçin')
  await g.locator('input').press('Enter')
  await expect(g).toContainText('Əssəlamu aleykum, Elçin!')
  await page.reload()
  await expect(page.getByTestId('hero-greeting')).toContainText('Elçin')
})
