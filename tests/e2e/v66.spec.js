// v6.6: Ulduzlarla qiblə (/qibla)
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
