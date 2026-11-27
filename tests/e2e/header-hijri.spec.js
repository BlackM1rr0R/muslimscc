// ═══════════════════════════════════════════════════════
// Başlıq: hicri ayın görünüşü (html[data-hmonth], «Haram ay» nişanı) və kiçik qiblə kompası
//   • tarix sabitdir (page.clock.setFixedTime — taymerlər işləyir), brauzer Asia/Baku-dadır
//   • 1 Rəcəb 1448 = 10 dekabr 2026; 1 Ramazan 1448 = 8 fevral 2027 (Ümmül-Qura)
//   • kompas: DeviceOrientationEvent saxtadır (requestPermission → 'granted', hadisələr əl ilə)
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'

const RAJAB = new Date('2026-12-15T12:00:00+04:00')
const ORDINARY = new Date('2026-11-27T12:00:00+04:00')
const RAMADAN = new Date('2027-02-20T12:00:00+04:00')

const seedCity = (page) => page.addInitScript(() => {
  try { if (!localStorage.getItem('muslim_cc_selected_city')) localStorage.setItem('muslim_cc_selected_city', 'Baku') } catch { /* */ }
})

test('haram ayda: data-hmonth, «Haram ay» nişanı və 9:36 istinadlı izah (Esc fokusu qaytarır)', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'telefonda nişan gizlidir (HeaderHijriBadge.css)')
  await page.clock.setFixedTime(RAJAB)
  await page.goto('/')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('data-hmonth', 'sacred')
  const badge = page.getByTestId('hijri-badge')
  await expect(badge).toBeVisible({ timeout: 15_000 })
  await expect(badge).toHaveText('Haram ay')
  await expect(badge).toHaveAttribute('aria-expanded', 'false')

  await badge.click()
  const pop = page.getByTestId('hijri-pop')
  await expect(pop).toBeVisible()
  await expect(pop).toHaveAttribute('role', 'dialog')
  await expect(pop.getByRole('heading', { name: 'Rəcəb — haram ay' })).toBeVisible()
  await expect(pop).toContainText('Tövbə 9:36')
  await expect(pop).toContainText('Buxari 3197')
  await expect(badge).toHaveAttribute('aria-expanded', 'true')
  await expect(pop).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(pop).toHaveCount(0)
  await expect(badge).toBeFocused()
})

test('adi ayda nişan və bəzək yoxdur; Ramazanda öz rəngi (data-season da), nişan yox', async ({ page }) => {
  await page.clock.setFixedTime(ORDINARY)
  await page.goto('/quran')
  await settle(page)
  await expect(page.locator('header .header-inner')).toBeVisible()
  await expect(page.locator('html')).not.toHaveAttribute('data-hmonth', /.+/)
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('hijri-badge')).toHaveCount(0)

  await page.clock.setFixedTime(RAMADAN)
  await page.goto('/quran')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('data-hmonth', 'ramadan')
  await expect(page.locator('html')).toHaveAttribute('data-season', 'ramadan')
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('hijri-badge')).toHaveCount(0)
})

test('haram ay nişanı və pəncərə: axe (ciddi pozuntu yoxdur), ərəbcədə RTL', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'telefonda nişan gizlidir')
  await page.clock.setFixedTime(RAJAB)
  await page.goto('/ar')
  await settle(page)
  const badge = page.getByTestId('hijri-badge')
  await expect(badge).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await badge.click()
  await expect(page.getByTestId('hijri-pop')).toContainText('التوبة')
  const { violations } = await new AxeBuilder({ page })
    .include('header.header')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const bad = violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
  expect(bad).toEqual([])
})

test('kiçik qiblə: masaüstündə yoxdur', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'yalnız geniş ekran')
  await page.goto('/')
  await settle(page)
  await expect(page.locator('header .nav-desktop')).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('header-qibla')).toHaveCount(0)
})

test('kiçik qiblə: toxunuş → icazə, ox Kəbəyə fırlanır, ad dərəcə ilə; ikinci toxunuş → /qibla', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız telefon')
  await seedCity(page)
  await page.addInitScript(() => {
    window.__perm = 0
    if (window.DeviceOrientationEvent) window.DeviceOrientationEvent.requestPermission = async () => { window.__perm++; return 'granted' }
  })
  await page.goto('/')
  await settle(page)
  const btn = page.getByTestId('header-qibla')
  await expect(btn).toBeVisible({ timeout: 15_000 })
  await expect(btn).toHaveAttribute('aria-label', 'Qiblə kompası')
  await btn.click()
  // Telefon şimala baxır (alpha = 0) — ox qiblə bucağı qədər fırlanmalıdır
  const pump = () => page.evaluate(() => {
    for (let i = 0; i < 3; i++) window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute', { alpha: 0, beta: 60, gamma: 0, absolute: true }))
  })
  await expect.poll(async () => { await pump(); return btn.getAttribute('aria-label') }).toMatch(/^Qiblə: 20\d° cənub-qərb$/)
  expect(await page.evaluate(() => window.__perm)).toBe(1)
  await expect(btn).toHaveClass(/is-live/)
  // Ox: qiblə − istiqamət (alpha = 0 → şimal) ≈ 207°
  const rot = () => page.locator('.hq-arrow').evaluate(el => Number(/rotate\(([-\d.]+)deg\)/.exec(el.style.transform)?.[1]))
  await expect.poll(async () => { await pump(); return rot() }).toBeGreaterThan(200)
  expect(await rot()).toBeLessThan(215)
  await expect(page.getByRole('status').filter({ hasText: /^Qiblə: 20\d°/ })).toHaveCount(1)

  await btn.click()
  await expect(page).toHaveURL(/\/qibla$/)
  await expect(page.getByTestId('header-qibla')).toHaveCount(0)
})

test('kiçik qiblə: sensor yoxdursa ox əvəzinə bucağın rəqəmi; klaviatura ilə də işləyir', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız telefon')
  await seedCity(page)
  await page.addInitScript(() => { try { window.DeviceOrientationEvent = undefined } catch { /* */ } })
  await page.goto('/')
  await settle(page)
  const btn = page.getByTestId('header-qibla')
  await expect(btn).toBeVisible({ timeout: 15_000 })
  await btn.focus()
  await page.keyboard.press('Enter')
  await expect(btn).toHaveClass(/is-static/)
  await expect(btn).toHaveText(/^20\d°$/)
  await expect(btn).toHaveAttribute('aria-label', /^Qiblə: 20\d° cənub-qərb$/)
  await expect(page.getByRole('status').filter({ hasText: 'Kompas sensoru yoxdur' })).toHaveCount(1)
})

test('telefonda haram ayda nişan göstərilmir, amma başlıq bəzəyi (data-hmonth) qalır', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız telefon')
  await page.clock.setFixedTime(RAJAB)
  await page.goto('/')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('data-hmonth', 'sacred')
  await expect(page.getByTestId('hijri-badge')).toBeHidden()
})
