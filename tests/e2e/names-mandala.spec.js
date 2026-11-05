// ═══════════════════════════════════════════════════════
// 99 ad mandalası (components/NamesMandala) — /names
//   • 99 ad üç halqada; toxunuş mərkəzdə adı göstərir, ikinci toxunuş pəncərəni açır
//   • klaviatura: fokus + oxlar seçir, Enter açır
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('mandala: 99 ad, seçim, açılış və klaviatura', async ({ page }) => {
  await page.goto('/names')
  await settle(page)
  const m = page.getByTestId('names-mandala')
  await m.scrollIntoViewIfNeeded()
  await expect(m.locator('text.nm__name')).toHaveCount(99)
  await expect(m.locator('.nm__allah')).toBeVisible()

  const name = m.locator('text[data-n="29"]')
  await name.click({ force: true })
  await expect(m.locator('.nm__center')).toContainText('29')
  await expect(m.locator('.nm__ray')).toHaveCount(1)
  await name.click({ force: true })
  await expect(page).toHaveURL(/\/names\/29-/)
  await page.goBack()

  await m.focus()
  await page.keyboard.press('Home')
  await expect(m.locator('.nm__num')).toHaveText('1')
  await page.keyboard.press('ArrowRight')
  await expect(m.locator('.nm__num')).toHaveText('2')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/names\/2-/)
})
