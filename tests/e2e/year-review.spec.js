// ═══════════════════════════════════════════════════════
// İllik icmal (components/YearReview) — /analytics
//   • cari hicri ilin namaz/tam gün/seriya/Quran/xeyir saylarını göstərir
//   • məlumat yoxdursa kart görünmür
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('illik icmal: saylar bu cihazdakı qeydlərdən', async ({ page }) => {
  await page.addInitScript(() => {
    const key = (n) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date(Date.now() - n * 86400000))
    const stats = {}
    for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) { stats[`${key(1)}_${p}`] = true; stats[`${key(2)}_${p}`] = true }
    stats[`${key(3)}_Fajr`] = true
    localStorage.setItem('muslim_cc_prayer_stats', JSON.stringify(stats))
    localStorage.setItem('quran_stats', JSON.stringify({ reads: {}, sessions: 2, dates: [key(1), key(2)] }))
    localStorage.setItem('charity_log', JSON.stringify([{ date: key(1), type: 'money', amount: '5' }]))
  })
  await page.goto('/analytics')
  await settle(page)
  const yr = page.getByTestId('year-review')
  await yr.scrollIntoViewIfNeeded()
  await expect(yr.locator('h2')).toContainText(/Hicri [0-9]+ ilim/)
  await expect(yr.getByTestId('yr-prayers').locator('b')).toHaveText('11')
  await expect(yr.getByTestId('yr-full').locator('b')).toHaveText('2')
  await expect(yr.getByTestId('yr-streak').locator('b')).toHaveText('2')
  await expect(yr.getByTestId('yr-quran').locator('b')).toHaveText('2')
  await expect(yr.getByTestId('yr-charity').locator('b')).toHaveText('1')
  await expect(yr.getByTestId('yr-active').locator('b')).toHaveText('3')
  await expect(yr.getByTestId('yr-share')).toBeVisible()
})

test('illik icmal: məlumat yoxdursa göstərilmir', async ({ page }) => {
  await page.goto('/analytics')
  await settle(page)
  await expect(page.getByTestId('year-review')).toHaveCount(0)
})
