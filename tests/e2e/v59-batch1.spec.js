// v5.9 (1-ci partiya): səcdə anı, hicri doğum günü, günün hekayələri
import { test, expect, settle } from './fixtures.js'

test('Səcdə anı: səcdə ayəsində nişan, ekranda qalanda an açılır (Hisnul-Müslim duası), bir dəfə', async ({ page }) => {
  // Fatihənin 5-ci ayəsini test üçün "səcdə ayəsi" kimi işarələ (real API-də sajda sahəsi)
  await page.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, route => {
    const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
    route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => ({
      number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan',
      ayahs: Array.from({ length: 7 }, (_, i) => ({ number: i + 1, numberInSurah: i + 1, text: `[test ayə ${i + 1}]`, juz: 1, page: 1, sajda: i === 4 ? { id: 1, recommended: true, obligatory: false } : false })),
      edition: { identifier: e, language: e.split('.')[0], type: e.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
    })) } })
  })
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const card = page.locator('#ayah-5')
  await expect(card.locator('.ayah-sajdah')).toContainText('Səcdə')
  await expect(page.locator('#ayah-4 .ayah-sajdah')).toHaveCount(0)
  await card.evaluate(el => el.scrollIntoView({ block: 'center' }))
  const m = page.getByTestId('sajdah-moment')
  await expect(m).toBeVisible({ timeout: 6000 })
  await expect(m).toContainText('1:5')
  await expect(m.locator('.sjm__ar')).toContainText('سجد وجهي')
  await expect(m.locator('.sjm__src')).toContainText('Tirmizi')
  await page.keyboard.press('Escape')
  await expect(m).toHaveCount(0)
  await page.evaluate(() => window.scrollTo(0, 0))
  await card.evaluate(el => el.scrollIntoView({ block: 'center' }))
  await page.waitForTimeout(2000)
  await expect(m).toHaveCount(0)
})

test('Hicri doğum günü: tarix → hicri tarix, yaşlar, növbəti doğum günü, yaddaşda qalır', async ({ page }) => {
  await page.goto('/hijri-converter')
  await settle(page)
  const box = page.getByTestId('hijri-birthday')
  for (let i = 0; i < 30 && !(await box.count()); i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(150) }
  await box.scrollIntoViewIfNeeded()
  await box.getByTestId('hbd-input').fill('1990-05-15')
  await expect(box.getByTestId('hbd-hijri')).toContainText('1410')
  await expect(box).toContainText('Hicri yaş')
  await expect(box.getByTestId('hbd-share')).toBeVisible()
  await page.reload()
  await settle(page)
  for (let i = 0; i < 30 && !(await box.count()); i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(150) }
  await box.scrollIntoViewIfNeeded()
  await expect(box.getByTestId('hbd-hijri')).toContainText('1410', { timeout: 10000 })
})

test('Günün hekayələri: dairələr, tam ekran baxış, növbəti, Esc, baxılmış nişanı', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  const row = page.getByTestId('day-stories')
  await expect(row.locator('.dsr__bubble')).toHaveCount(4)
  await row.locator('.dsr__bubble').first().click()
  const v = page.getByTestId('story-viewer')
  await expect(v).toBeVisible()
  await expect(v.locator('.dst__count')).toHaveText('1 / 4')
  await expect(v.locator('.dst__ar')).not.toBeEmpty()
  await page.keyboard.press('ArrowRight')
  await expect(v.locator('.dst__count')).toHaveText('2 / 4')
  await page.keyboard.press('Escape')
  await expect(v).toHaveCount(0)
  await expect(row.locator('.dsr__bubble').first()).toHaveClass(/is-seen/)
  await expect(row.locator('.dsr__bubble').nth(1)).toHaveClass(/is-seen/)
  await expect(row.locator('.dsr__bubble').nth(2)).not.toHaveClass(/is-seen/)
})
