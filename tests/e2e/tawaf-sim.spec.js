// ═══════════════════════════════════════════════════════
// Təvaf simulyatoru (components/hajj/TawafSim) — /hajjguide
//   • siçanla Kəbənin ətrafında saat əqrəbinin əksinə dairə → sayğac artır
//   • saat əqrəbi istiqamətində → sayılmır, ipucu çıxır
//   • klaviatura / düymə ilə 7 dövrə → yekun kartı (Məqami-İbrahim, Müslim 1218)
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

async function openSim(page) {
  await page.goto('/hajjguide')
  await settle(page)
  await page.locator('#hg-tawaf').scrollIntoViewIfNeeded()
  const stage = page.getByTestId('tawaf-stage')
  await expect(stage).toBeVisible({ timeout: 10_000 })
  await stage.scrollIntoViewIfNeeded()
  return stage
}

/** Mərkəz ətrafında dairə çək; dir = 1 saat əqrəbinin əksinə (ekranda y aşağıdır) */
async function circle(page, stage, turns, dir = 1) {
  const b = await stage.boundingBox()
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2, r = b.width * 0.36
  const at = (deg) => {
    const a = (deg * Math.PI) / 180
    return [cx + r * Math.cos(a), cy - r * Math.sin(a)]
  }
  const start = -15
  await page.mouse.move(...at(start))
  await page.mouse.down()
  const n = Math.round(turns * 36)
  for (let i = 1; i <= n; i++) await page.mouse.move(...at(start + dir * i * 10), { steps: 2 })
  await page.mouse.up()
}

test('təvaf: saat əqrəbinin əksinə dairə sayğacı artırır', async ({ page, consoleProblems }) => {
  const stage = await openSim(page)
  const count = page.getByTestId('tawaf-count')
  await expect(count).toHaveText('0')
  await circle(page, stage, 0.6)
  await expect(count).toHaveText('0')
  await circle(page, stage, 0.5)
  await expect(count).toHaveText('1')
  await expect(page.getByTestId('tawaf-live')).toContainText('1')
  await circle(page, stage, 1.05)
  await expect(count).toHaveText('2')
  expectCleanConsole(consoleProblems)
})

test('təvaf: saat əqrəbi istiqamətində sayılmır, ipucu göstərilir', async ({ page }) => {
  const stage = await openSim(page)
  await circle(page, stage, 1.2, -1)
  await expect(page.getByTestId('tawaf-count')).toHaveText('0')
  await expect(page.getByTestId('tawaf-hint')).not.toBeEmpty()
})

test('təvaf: klaviatura və düymə ilə 7 dövrə → yekun', async ({ page }) => {
  const stage = await openSim(page)
  await stage.focus()
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('tawaf-count')).toHaveText('1')
  for (let i = 0; i < 6; i++) await page.getByTestId('tawaf-next').click()
  await expect(page.getByTestId('tawaf-count')).toHaveText('7')
  const fin = page.getByTestId('tawaf-finish')
  await expect(fin).toBeVisible()
  await expect(fin).toContainText('Müslim 1218')
  await expect(page.getByTestId('tawaf-next')).toBeDisabled()
})
