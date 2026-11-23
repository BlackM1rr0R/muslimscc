// ═══════════════════════════════════════════════════════
// Ana səhifə — "İndi sizin üçün" (components/home/NowForYou) + bələdçi turu düyməsi
//   • saat sabitdir (page.clock, Bakı vaxtı) — təklif vaxta / həftə gününə görə
//   • 02-12-2026 çərşənbə 13:00 (22 Cəmadiyəl-axirə) — yalnız ehtiyat təklif (növbəti namaz: Əsr)
//   • 07-12-2026 bazar ertəsi 10:00 — sünnə orucu → /calendar#cal-fasts (sürüşür)
//   • /en, səhər 07:00 — "Morning routine" → /en/morning-routine; azərbaycanca yazı yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

const card = (page) => page.getByTestId('now-for-you')

test('çərşənbə günortası: bir ehtiyat təklif, növbəti namazla; tur düyməsi', async ({ page, consoleProblems }) => {
  await page.clock.install({ time: new Date('2026-12-02T13:00:00+04:00') })
  await page.goto('/')
  await settle(page)
  const c = card(page)
  await c.scrollIntoViewIfNeeded()
  await expect(c.getByRole('heading', { level: 2 })).toHaveText('İndi sizin üçün')
  const items = c.locator('[data-now]')
  await expect(items).toHaveCount(1)
  await expect(items.first()).toHaveAttribute('data-now', 'focus')
  await expect(items.first()).toHaveAttribute('href', '/focus')
  await expect(items.first()).toContainText('Növbəti namaz: Əsr')
  await expect(page.getByTestId('tour-button')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('bazar ertəsi: sünnə orucu birinci → /calendar sünnə oruclarına', async ({ page, consoleProblems }) => {
  await page.clock.install({ time: new Date('2026-12-07T10:00:00+04:00') })
  await page.goto('/')
  await settle(page)
  const first = card(page).locator('[data-now]').first()
  await first.scrollIntoViewIfNeeded()
  await expect(first).toHaveAttribute('data-now', 'fastToday')
  await expect(first).toHaveAttribute('href', '/calendar#cal-fasts')
  await expect(first).toContainText('Bazar ertəsi')
  await first.click()
  await expect(page).toHaveURL(/\/calendar$/)
  await expect(page.getByTestId('sunnah-fasts')).toBeInViewport({ timeout: 10000 })
  expectCleanConsole(consoleProblems)
})

test('/en səhər: səhər rejimi; azərbaycanca yazı yoxdur; yer tutucu ilə eyni hündürlük', async ({ page, consoleProblems }) => {
  await page.clock.install({ time: new Date('2026-12-02T07:00:00+04:00') })
  await page.goto('/en')
  await settle(page)
  const c = card(page)
  await c.scrollIntoViewIfNeeded()
  await expect(c.getByRole('heading', { level: 2 })).toHaveText('Now for you')
  const first = c.locator('[data-now]').first()
  await expect(first).toHaveAttribute('data-now', 'morning')
  await expect(first).toHaveAttribute('href', '/en/morning-routine')
  await expect(first).toContainText('Morning routine')
  await expect(first).toContainText('After Fajr')
  await expect(c).not.toContainText(/[əƏ]/)
  // Sabit hündürlük: sıra 88px (1, 2 və ya 3 təklif — eyni)
  const h = await c.locator('.hp-now__list').evaluate((el) => el.getBoundingClientRect().height)
  expect(Math.round(h)).toBe(88)
  expectCleanConsole(consoleProblems)
})
