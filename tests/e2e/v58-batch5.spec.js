// v5.8 (5-ci partiya): "bir gün" sürüşmə hekayəsi, hero ulduz tozu, kart → səhifə keçidi
import { test, expect, settle } from './fixtures.js'

test('Bir gün hekayəsi: sürüşdükcə addım və səma dəyişir', async ({ page }) => {
  await page.goto('/')
  await settle(page)
  const ds = page.locator('.ds')
  for (let i = 0; i < 40 && !(await ds.count()); i++) { await page.mouse.wheel(0, 600); await page.waitForTimeout(150) }
  await ds.scrollIntoViewIfNeeded()
  const last = page.locator('.ds__step').last()
  await last.scrollIntoViewIfNeeded()
  await expect(ds).toHaveAttribute('data-step', '4')
  await expect(page.locator('.ds__layer--4')).toHaveClass(/is-on/)
  await expect(last.getByRole('link')).toHaveAttribute('href', /muhasabah/)
})

test('Hero ulduz tozu: masaüstündə kətan, sürüşəndə başlıq solur', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'yalnız masaüstü')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?dust')
  await expect(page.locator('.hp-dust')).toHaveCount(1, { timeout: 10000 })
  await page.evaluate(() => window.scrollTo(0, 400))
  await expect.poll(() => page.locator('.hp-hero-title').evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(0.5)
})

test('Kart → səhifə: surə kartının başlığı View Transition ilə keçir', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'yalnız masaüstü')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/quran')
  await settle(page)
  const card = page.locator('.surah-card').first()
  await card.scrollIntoViewIfNeeded()
  const vtSupported = await page.evaluate(() => typeof document.startViewTransition === 'function')
  await card.click()
  if (vtSupported) await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('qm-vt-card')), { timeout: 2000 }).toBe(true)
  await expect(page).toHaveURL(/\/quran\/1-/)
  await expect(page.locator('main h1')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('qm-vt-card')), { timeout: 3000 }).toBe(false)
})
