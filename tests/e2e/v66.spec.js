// v6.6: Ulduzlarla qiblə (/qibla), Günəş tutulmaları (/calendar), rəkət sayğacı (/prayerguide)
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 80 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

test('Ulduzlarla qiblə: qübbə, Bakının qiblə bucağı, Qütb ulduzu üsulu, ayələr və vaxt sürüşdürücüsü', async ({ page }) => {
  // 2026-11-13 21:00 Bakı vaxtı — qaranlıq
  await page.clock.setFixedTime(new Date('2026-11-13T17:00:00Z'))
  await page.goto('/qibla')
  await settle(page)
  const s = page.getByTestId('star-qibla')
  await scrollTo(page, s)
  await expect(s).toBeVisible()
  await expect(s.getByTestId('sq-bearing')).toHaveText('207°')
  expect(await s.getByTestId('sq-star').count()).toBeGreaterThan(8)
  await expect(s.getByTestId('sq-polaris')).toContainText('Qütb ulduzunu arxanıza alın və sağa 27° dönün')
  await expect(s.getByTestId('sq-ayah')).toHaveCount(3)
  await expect(s.getByTestId('sq-ayah').nth(2)).toContainText('Şi’ra')
  await expect(s.getByTestId('sq-cross').locator('button').filter({ hasText: 'Sirius' })).toHaveCount(1)
  await s.getByTestId('sq-cross').locator('button').filter({ hasText: 'Sirius' }).click()
  await expect(s.getByTestId('sq-best')).toContainText('Sirius')
  await expect(s.getByTestId('sq-best')).toContainText('düz üstündə')
})

for (const theme of ['light', 'dark']) {
  test(`Ulduzlarla qiblə: əlçatanlıq (axe, ${theme})`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-13T17:00:00Z'))
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/qibla')
    await settle(page)
    const s = page.getByTestId('star-qibla')
    await scrollTo(page, s)
    await expect(s.getByTestId('sq-ayah')).toHaveCount(3)
    const { violations } = await new AxeBuilder({ page }).include('[data-testid=star-qibla]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
    const bad = violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
      .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
    expect(bad).toEqual([])
  })
}

test('Günəş tutulmaları: Bakı üçün 2027-08-02 (27%), Məkkədə tam, xəritə və sürüşdürücü', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-13T17:00:00Z'))
  await page.goto('/calendar')
  await settle(page)
  const s = page.getByTestId('solar-eclipses')
  await scrollTo(page, s)
  await expect(s.getByTestId('sec-date')).toContainText('2 avqust 2027')
  await expect(s.getByTestId('sec-here')).toContainText('Günəşin 27%-i örtüləcək')
  await expect(s.getByTestId('sec-makkah')).toContainText('Kəbənin üstündə tam tutulma')
  await expect(s.getByTestId('sec-list').locator('button')).toHaveCount(32)   // 2026-11-13-dən sonrakılar
  const t0 = await s.getByTestId('sec-time').innerText()
  await s.getByTestId('sec-range').focus()
  for (let i = 0; i < 15; i++) await page.keyboard.press('ArrowRight')
  await expect(s.getByTestId('sec-time')).not.toHaveText(t0)
  await expect(s.locator('a[href*="kusuf-prayer"]')).toBeVisible()
  // 2034-03-20 — Bakıdan da görünür
  await s.getByTestId('sec-list').locator('button').filter({ hasText: '20 mart 2034' }).click()
  await expect(s.getByTestId('sec-date')).toContainText('20 mart 2034')
})

for (const theme of ['light', 'dark']) {
  test(`Günəş tutulmaları: əlçatanlıq (axe, ${theme})`, async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-13T17:00:00Z'))
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/calendar')
    await settle(page)
    const s = page.getByTestId('solar-eclipses')
    await scrollTo(page, s)
    await expect(s.getByTestId('sec-here')).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).include('[data-testid=solar-eclipses]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
    expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious').flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))).toEqual([])
  })
}

test('Rəkət sayğacı: toxunuş rejimi — 3 rəkətli namaz, orta təşəhhüd, son', async ({ page }) => {
  await page.goto('/prayerguide')
  await settle(page)
  const c = page.getByTestId('rakat-counter')
  await scrollTo(page, c)
  await c.getByTestId('rkc-n3').click()
  await c.getByTestId('rkc-tapmode').click()
  await c.getByTestId('rkc-start').click()
  const ov = page.getByTestId('rkc-overlay')
  await expect(ov.getByTestId('rkc-num')).toHaveText('1')
  await ov.click({ position: { x: 200, y: 300 } })
  await expect(ov.getByTestId('rkc-num')).toHaveText('2')
  await ov.click({ position: { x: 200, y: 300 } })
  await expect(ov.getByTestId('rkc-msg')).toHaveText('Orta təşəhhüd — sonra qalxın')
  await ov.click({ position: { x: 200, y: 300 } })
  await expect(ov.getByTestId('rkc-end')).toHaveText('Namaz bitdi')
  await page.keyboard.press('Escape')
  await expect(ov).toHaveCount(0)
})

test('Rəkət sayğacı: kamera rejimi — işığın düşməsi səcdə sayılır (saxta kamera)', async ({ page }) => {
  await page.addInitScript(() => {
    window.__lum = 200
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 48
    const ctx = cv.getContext('2d')
    setInterval(() => { ctx.fillStyle = `rgb(${window.__lum},${window.__lum},${window.__lum})`; ctx.fillRect(0, 0, 64, 48) }, 50)
    navigator.mediaDevices.getUserMedia = async () => cv.captureStream(20)
  })
  await page.goto('/prayerguide')
  await settle(page)
  const c = page.getByTestId('rakat-counter')
  await scrollTo(page, c)
  await c.getByTestId('rkc-n2').click()
  await c.getByTestId('rkc-start').click()
  const ov = page.getByTestId('rkc-overlay')
  await expect(ov.getByTestId('rkc-num')).toHaveText('1')
  await page.waitForTimeout(1500)
  for (let k = 0; k < 2; k++) {
    await page.evaluate(() => { window.__lum = 25 }); await page.waitForTimeout(1300)
    await page.evaluate(() => { window.__lum = 200 }); await page.waitForTimeout(1300)
  }
  await expect(ov.getByTestId('rkc-num')).toHaveText('2')
  await expect(ov.getByTestId('rkc-msg')).toHaveText('Son rəkət')
})

test('Rəkət sayğacı: əlçatanlıq (axe)', async ({ page }) => {
  await page.goto('/prayerguide')
  await settle(page)
  const c = page.getByTestId('rakat-counter')
  await scrollTo(page, c)
  const { violations } = await new AxeBuilder({ page }).include('[data-testid=rakat-counter]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious').flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))).toEqual([])
})
