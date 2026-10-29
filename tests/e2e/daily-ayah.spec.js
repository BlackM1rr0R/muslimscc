// ═══════════════════════════════════════════════════════
// "Günün ayəsi" bildirişi (components/NotificationSettingsWidget):
//   • açar susmaya görə sönülüdür, açanda saat seçimi görünür (5 dildə)
//   • seçim (açar + saat) reload-dan sonra yadda qalır
//   • testdə push tokeni yoxdur — UI əvvəlcə icazə lazım olduğunu izah edir
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const LABEL = { az: 'Günün ayəsi', en: 'Verse of the day', ru: 'Аят дня', ar: 'آية اليوم', tr: 'Günün ayeti' }
const TIME = { az: 'Bildiriş vaxtı', en: 'Notification time', ru: 'Время уведомления', ar: 'وقت الإشعار', tr: 'Bildirim saati' }

async function openPanel(page) {
  const panel = page.locator('.notif-panel')
  // Dok tənbəl yüklənir — hadisəni panel görünənə qədər təkrarla
  await expect(async () => {
    await page.evaluate(() => window.dispatchEvent(new Event('open-notifications')))
    await expect(panel).toBeVisible({ timeout: 1500 })
  }).toPass({ timeout: 15_000 })
  return panel
}

for (const lang of Object.keys(LABEL)) {
  test(`[${lang}] günün ayəsi açarı və saat seçimi`, async ({ page, consoleProblems }) => {
    await page.goto(lang === 'az' ? '/' : `/${lang}/`)
    await settle(page)
    const panel = await openPanel(page)

    const sw = panel.getByRole('switch', { name: new RegExp(LABEL[lang]) })
    await expect(sw).toHaveAttribute('aria-checked', 'false')          // susmaya görə sönülü
    await expect(panel.getByRole('radiogroup')).toHaveCount(0)

    await sw.click()
    await expect(sw).toHaveAttribute('aria-checked', 'true')
    const group = panel.getByRole('radiogroup', { name: TIME[lang] })
    await expect(group).toBeVisible()
    await expect(group.getByRole('radio')).toHaveText(['07:00', '08:00', '09:00', '20:00'])
    await expect(group.getByRole('radio', { name: '08:00' })).toHaveAttribute('aria-checked', 'true')
    // Token yoxdur — izah görünür
    await expect(panel.locator('.notif-ayah-note')).toBeVisible()
    expectCleanConsole(consoleProblems)
  })
}

test('seçim reload-dan sonra yadda qalır', async ({ page, consoleProblems }) => {
  await page.goto('/')
  await settle(page)
  let panel = await openPanel(page)
  await panel.getByRole('switch', { name: /Günün ayəsi/ }).click()
  await panel.getByRole('radio', { name: '20:00' }).click()
  await expect(panel.getByRole('radio', { name: '20:00' })).toHaveAttribute('aria-checked', 'true')
  await expect(panel.locator('.notif-ayah-note')).toContainText(/icazə|dəstəkləmir/)

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('muslim_cc_notif_prefs') || '{}'))
  expect(saved).toMatchObject({ ayah: true, ayahHour: 20 })

  await page.reload()
  await settle(page)
  panel = await openPanel(page)
  await expect(panel.getByRole('switch', { name: /Günün ayəsi/ })).toHaveAttribute('aria-checked', 'true')
  await expect(panel.getByRole('radio', { name: '20:00' })).toHaveAttribute('aria-checked', 'true')
  await expect(panel.getByRole('radio', { name: '08:00' })).toHaveAttribute('aria-checked', 'false')

  // Söndürəndə saat seçimi gizlənir, seçim yadda qalır
  await panel.getByRole('switch', { name: /Günün ayəsi/ }).click()
  await expect(panel.getByRole('radiogroup')).toHaveCount(0)
  await page.reload()
  await settle(page)
  panel = await openPanel(page)
  await expect(panel.getByRole('switch', { name: /Günün ayəsi/ })).toHaveAttribute('aria-checked', 'false')
  expectCleanConsole(consoleProblems)
})
