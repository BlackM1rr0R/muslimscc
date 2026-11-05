// ═══════════════════════════════════════════════════════
// Kök qrafı (components/RootGraph) — /quran-roots
//   • mərkəzdə kök, formalar (ən çox 10), qonşu köklər
//   • formaya toxunuş ayələri süzür; qonşu kökə toxunuş həmin kökü açır
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test('kök qrafı: formalar, qonşu köklər, süzgəc və keçid', async ({ page }) => {
  await page.goto(`/quran-roots?root=${encodeURIComponent('رحم')}`)
  await settle(page)
  const g = page.getByTestId('root-graph')
  await g.scrollIntoViewIfNeeded()
  await expect(g.locator('.rg__root')).toHaveText('ر ح م')
  await expect(g.locator('.rg__form')).toHaveCount(9)
  await expect(g.locator('.rg__rel')).toHaveCount(8)
  await expect(g.locator('.rg__rel').first()).toHaveText('غ ف ر')   // ən güclü əlaqə: bağışlama

  const form = g.locator('.rg__form').first()
  await form.click()
  await expect(form).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.qr-form[aria-pressed="true"]')).toHaveCount(1)
  await form.click()
  await expect(form).toHaveAttribute('aria-pressed', 'false')

  await g.locator('.rg__rel').first().click()
  await expect(page).toHaveURL(/root=%D8%BA%D9%81%D8%B1/)
  await expect(page.locator('#qr-root-title')).toHaveText('غ ف ر')
})
