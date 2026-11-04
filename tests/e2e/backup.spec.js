// ═══════════════════════════════════════════════════════
// "Məlumatlarım" — ehtiyat nüsxə və bərpa (utils/userBackup, BackupCard, footer dialoqu)
//   • footer düyməsi dialoq açır; "yüklə" JSON faylı verir — istifadəçi
//     məlumatı var, keş və cihaz açarları yoxdur
//   • məlumat silinəndən sonra həmin fayldan bərpa → səhifə yenilənir, məlumat qayıdır
//   • yad fayl — xəta mesajı, heç nə yazılmır
// Hamısı brauzerdə — şəbəkə yoxdur (/privacy: xarici API sorğusu olmayan səhifə).
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const USER = { dua_favs: '[3,7]', muslim_cc_qada_v1: '{"fajr":12}', hifz_srs: '{"1":{"due":1}}' }
const CACHE_KEY = 'qm_ptimes_test|cache'

async function openDialog(page) {
  await page.getByRole('button', { name: 'Məlumatlarım' }).click()
  const dlg = page.locator('dialog.bk-dialog')
  await expect(dlg).toBeVisible()
  return dlg
}

test('yüklə → sil → fayldan bərpa et', async ({ page, consoleProblems }) => {
  await page.goto('/privacy')
  await page.evaluate(({ user, cacheKey }) => {
    for (const [k, v] of Object.entries(user)) localStorage.setItem(k, v)
    localStorage.setItem(cacheKey, '{}')
    localStorage.setItem('muslim_cc_fcm_token', 'device-only')
  }, { user: USER, cacheKey: CACHE_KEY })
  await page.reload()
  await settle(page)

  // 1) Yüklə
  let dlg = await openDialog(page)
  const [dl] = await Promise.all([
    page.waitForEvent('download'),
    dlg.getByRole('button', { name: 'Ehtiyat nüsxəni yüklə' }).click(),
  ])
  expect(dl.suggestedFilename()).toMatch(/^muslims-cc-backup-\d{4}-\d{2}-\d{2}\.json$/)
  const file = await dl.path()
  const { readFileSync } = await import('node:fs')
  const text = readFileSync(file, 'utf8')
  const json = JSON.parse(text)
  expect(json.kind).toBe('muslims.cc/user-backup')
  for (const [k, v] of Object.entries(USER)) expect(json.data[k]).toBe(v)
  expect(json.data[CACHE_KEY]).toBeUndefined()
  expect(json.data.muslim_cc_fcm_token).toBeUndefined()
  await expect(dlg.getByRole('status')).toContainText('Fayl yükləndi')
  await dlg.getByRole('button', { name: 'Bağla' }).click()
  await expect(dlg).toBeHidden()

  // 2) Məlumat itir
  await page.evaluate((keys) => keys.forEach(k => localStorage.removeItem(k)), Object.keys(USER))

  // 3) Bərpa
  dlg = await openDialog(page)
  await dlg.locator('input[type="file"]').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(text) })
  await expect(dlg.getByText('Bu fayldan bərpa edilsin?')).toBeVisible()
  await Promise.all([
    page.waitForEvent('load'),
    dlg.getByRole('button', { name: 'Bərpa et', exact: true }).click(),
  ])
  const restored = await page.evaluate((keys) => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(USER))
  expect(restored).toEqual(USER)
  expectCleanConsole(consoleProblems)
})

test('yad fayl — xəta, heç nə yazılmır', async ({ page }) => {
  await page.goto('/privacy')
  await settle(page)
  const dlg = await openDialog(page)
  await dlg.locator('input[type="file"]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
  await expect(dlg.getByRole('status')).toContainText('Muslims.cc ehtiyat nüsxəsi deyil')
  await expect(dlg.getByRole('button', { name: 'Bərpa et', exact: true })).toHaveCount(0)
})
