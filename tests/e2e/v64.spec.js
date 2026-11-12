// v6.4: Əsrin kölgəsi (/prayer), Quranın mozaikası (/quran)
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 80 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Əsrin kölgəsi: əsr 1× anında kölgə günorta kölgəsi + 1 boy, 2× sonra', async ({ page }) => {
  await page.goto('/prayer')
  await settle(page)
  const sec = page.getByTestId('asr-shadow')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('ash-asr1')).toHaveText(/^\d{2}:\d{2}$/)
  await sec.getByTestId('ash-go1').click()
  await expect(sec.getByTestId('ash-time')).toHaveText(await sec.getByTestId('ash-asr1').innerText())
  await expect(sec.getByTestId('ash-state')).toContainText('əsr vaxtı (1×)')
  const [a1, a2] = [await sec.getByTestId('ash-asr1').innerText(), await sec.getByTestId('ash-asr2').innerText()]
  expect(a2 > a1).toBe(true)
  await expect(sec).toContainText('Əbu Davud 393')
  await expect(sec.locator('svg[role=img]')).toBeVisible()
})

test('Quranın mozaikası: görünüşlər, ən uzun ayə, səcdə siyahısı, ayəni aç', async ({ page }) => {
  await page.goto('/quran')
  await settle(page)
  const m = page.getByTestId('quran-mosaic')
  await scrollTo(page, m)
  await expect(m.getByTestId('qmo-canvas')).toBeVisible()
  await m.getByTestId('qmo-mode-length').click()
  await m.getByTestId('qmo-longest').locator('button').first().click()
  await expect(m.getByTestId('qmo-info')).toContainText('2:282')
  await expect(m.getByTestId('qmo-info')).toContainText('129')
  await m.getByTestId('qmo-mode-sajdah').click()
  await expect(m.getByTestId('qmo-sajdah-list').locator('li')).toHaveCount(15)
  await m.getByTestId('qmo-sajdah-list').locator('button').last().click()
  await expect(m.getByTestId('qmo-info')).toContainText('96:19')
  await m.getByTestId('qmo-open').click()
  await expect(page).toHaveURL(/\/quran\/96/)
})
