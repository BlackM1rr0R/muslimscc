// ═══════════════════════════════════════════════════════
// /nawawi40 (dizayn v3.2) — kart grid + oxu pəncərəsi:
//   • 42 kart; kart klikdə dialoq (aria-modal) açılır, ünvanda #h-N
//   • ←/→ əvvəlki/növbəti (hash yenilənir), Esc bağlayır (hash silinir)
//   • /nawawi40#h-12 paylaşılan keçidi həmin hədisin dialoqunu açır
//   • süzgəc çipləri, «Öyrəndim» (localStorage 'nawawi40_learned_v1')
//   • əzbər rejimi: sözlər gizlənir, «Növbəti söz» birini açır
// /hisnul-muslim#hs-27 də eyni ReaderDialog ilə fəsli açır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

test('40 hədis: kart grid, dialoq, klaviatura və hash', async ({ page, consoleProblems }) => {
  await page.goto('/nawawi40')
  await settle(page)
  await expect(page.locator('.nw-card')).toHaveCount(42)

  await page.locator('#h-3 .nw-card__open').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg).toHaveAttribute('aria-modal', 'true')
  await expect(page).toHaveURL(/#h-3$/)

  await page.keyboard.press('ArrowRight')
  await expect(page).toHaveURL(/#h-4$/)
  await page.keyboard.press('ArrowLeft')
  await expect(page).toHaveURL(/#h-3$/)

  // Əzbər rejimi: hamısı gizli, «Növbəti söz» bir söz açır
  await dlg.getByRole('button', { name: 'Əzbər rejimi' }).click()
  await expect(dlg.locator('.rd-memo__w.is-shown')).toHaveCount(0)
  await dlg.getByRole('button', { name: 'Növbəti söz' }).click()
  await expect(dlg.locator('.rd-memo__w.is-shown')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await expect(page).not.toHaveURL(/#h-/)
  await expectCleanConsole(consoleProblems)
})

test('40 hədis: #h-12 keçidi dialoqu açır, süzgəc və «Öyrəndim»', async ({ page }) => {
  await page.goto('/nawawi40#h-12')
  await settle(page)
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg.locator('#nw-reader-title')).toHaveText('Boş işləri tərk etmək')
  await dlg.getByRole('button', { name: 'Öyrəndim', exact: true }).click()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('nawawi40_learned_v1')))).toEqual([12])
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)

  await page.locator('.nw-chip--learned').click()
  await expect(page.locator('.nw-card')).toHaveCount(1)
  await page.locator('.nw-chip--muslim').click()
  await expect(page.locator('.nw-card')).toHaveCount(12)
})

test('Hisnul-Müslim: #hs-27 fəslin oxu pəncərəsini açır', async ({ page }) => {
  await page.goto('/hisnul-muslim#hs-27')
  await settle(page)
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg.locator('.hs-item').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await expect(page.locator('.hs-card')).toHaveCount(133)
})
