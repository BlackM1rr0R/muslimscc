// v6.5: Quranda heyvanlar (/kids), Ay tutulmaları (/calendar), müqəttəə hərfləri (/quran)
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 80 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Quranda heyvanlar: kart → ayə və tərcümə, oyunda düzgün cavab xal verir', async ({ page }) => {
  await page.goto('/kids')
  await settle(page)
  await page.getByRole('button', { name: 'Quranda heyvanlar' }).first().click()
  const w = page.getByTestId('quran-animals')
  await expect(w).toBeVisible()
  await expect(w.getByTestId('qan-tile')).toHaveCount(21)
  await w.locator('[data-testid=qan-tile][data-id=ant]').click()
  const card = w.getByTestId('qan-card')
  await expect(card).toContainText('Qarışqa')
  await expect(card).toContainText('Quranda 3 dəfə keçir')
  await expect(card).toContainText('qarışqa vadisinə')          // Məmmədəliyev tərcüməsi
  await expect(card.getByTestId('qan-open')).toHaveAttribute('href', /\/quran\/27.*\?a=18$/)
  await w.getByTestId('qan-tab-game').click()
  const id = await w.getByTestId('qan-word').getAttribute('data-id')
  await w.locator(`[data-testid=qan-opt][data-id=${id}]`).click()
  await expect(w.getByTestId('qan-fb')).toHaveText('Afərin, düzdür!')
  await expect(w.getByTestId('qan-score')).toHaveText('1')
  await w.getByTestId('qan-next').click()
  await expect(w.getByTestId('qan-fb')).toHaveText('')
})

test('Ay tutulmaları: növbəti tutulma, görünmə nişanı, siyahı və səhnə', async ({ page }) => {
  await page.goto('/calendar')
  await settle(page)
  const sec = page.getByTestId('lunar-eclipses')
  await scrollTo(page, sec)
  await expect(sec.getByTestId('lec-date')).toContainText('2028')
  await expect(sec.getByTestId('lec-vis')).toBeVisible()
  const items = sec.getByTestId('lec-list').locator('button')
  expect(await items.count()).toBeGreaterThan(15)
  await items.nth(2).click()   // 2028-12-31 — Bakıdan görünür
  await expect(sec.getByTestId('lec-date')).toContainText('31 dekabr 2028')
  await expect(sec.getByTestId('lec-vis')).not.toContainText('görünməyəcək')
  const t0 = await sec.getByTestId('lec-time').innerText()
  await sec.getByTestId('lec-range').focus()
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight')
  await expect(sec.getByTestId('lec-time')).not.toHaveText(t0)
  await expect(sec.getByTestId('lec-time')).toHaveText(/^\d{2}:\d{2}$/)
  await expect(sec.locator('a[href*="kusuf-prayer"]')).toBeVisible()
})

test('Müqəttəə hərfləri: hərf surələri işıqlandırır, surə oxunuşu göstərir', async ({ page }) => {
  await page.goto('/quran')
  await settle(page)
  const m = page.getByTestId('muqattaat')
  await scrollTo(page, m)
  await expect(m.getByTestId('mqm-surah')).toHaveCount(29)
  await m.locator('[data-testid=mqm-letter][data-ch="ح"]').click()
  await expect(m.locator('[data-testid=mqm-surah][data-lit="1"]')).toHaveCount(7)
  await m.locator('[data-testid=mqm-surah][data-s="19"]').click()
  await expect(m.getByTestId('mqm-reading')).toHaveText('Kaf Hə Ya Eyn Sad')
})
