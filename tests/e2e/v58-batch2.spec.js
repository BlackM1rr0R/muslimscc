// v5.8 (2-ci partiya): zikr xurma bağı, dua kartları dəstəsi, bayram rejimi
import { test, expect, settle } from './fixtures.js'

test('xurma bağı: Tirmizi 3464 zikrinin hər deyişi bir ağac', async ({ page }) => {
  await page.goto('/dhikr')
  await settle(page)
  await page.getByRole('button', { name: /Sübhanəllahil-əzimi/ }).first().click()
  const g = page.getByTestId('palm-garden')
  await expect(g).toBeVisible()
  const tap = page.locator('.dhikr-tap-btn').first()
  for (let i = 0; i < 3; i++) await tap.click()
  await expect(g.getByTestId('pg-count')).toHaveText('3')
  await expect(g).toContainText('Tirmizi 3464')
  expect(await page.evaluate(() => localStorage.getItem('dhikr_palms_v1'))).toBe('3')
})

test('dua dəstəsi: 7 dua oxunanda nəticə ekranı', async ({ page }) => {
  await page.goto('/duas')
  await settle(page)
  const d = page.getByTestId('dua-deck')
  await d.scrollIntoViewIfNeeded()
  await expect(d.locator('.dd__left')).toHaveText('0 / 7')
  for (let i = 0; i < 7; i++) { await d.getByTestId('dd-read').click(); await page.waitForTimeout(320) }
  await expect(d.getByTestId('dd-done')).toBeVisible()
})

test('bayram rejimi (?eid=fitr): zolaq, təkbir və mənbəsi', async ({ page }) => {
  await page.goto('/?eid=fitr')
  await settle(page)
  await expect(page.getByTestId('eid-bar')).toContainText('Bayramınız mübarək')
  expect(await page.evaluate(() => document.documentElement.classList.contains('eid-mode'))).toBe(true)
  await page.getByTestId('eid-open').click()
  const m = page.getByTestId('eid-modal')
  await expect(m).toContainText('اللَّهُ أَكْبَرُ')
  await expect(m).toContainText('İbn Məsuddan')
})
