// ═══════════════════════════════════════════════════════
// Əsas funksiyalar: namaz vaxtları (sabit fikstür: Fajr 05:32 ...),
// Quran (seçilmiş dilin nəşri), hədis axtarışı.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

test('ana səhifədə namaz vaxtları görünür', async ({ page, consoleProblems }) => {
  await page.goto('/')
  await settle(page)
  for (const t of ['05:32', '12:29', '15:24', '17:51', '19:10']) {
    await expect(page.getByText(t, { exact: true }).first()).toBeVisible()
  }
  expectCleanConsole(consoleProblems)
})

test('namaz səhifəsi fikstür vaxtlarını göstərir', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  await expect(page.getByText('05:32', { exact: true }).first()).toBeVisible()
  expectCleanConsole(consoleProblems)
})

// Quran tərcüməsi seçilmiş dilin nəşrindən gəlməlidir (az → az.mammadaliyev
// və s.), başqa dilə "düşməməlidir"
const EDITIONS = { az: 'az.mammadaliyev', en: 'en.asad', ru: 'ru.kuliev', tr: 'tr.diyanet' }
for (const [lang, edition] of Object.entries(EDITIONS)) {
  test(`Quran (${lang}) ${edition} nəşrini istəyir`, async ({ page }) => {
    await page.goto(lang === 'az' ? '/quran' : `/${lang}/quran`)
    await settle(page)
    // Sürə açılanda tərcümə sorğusu getməlidir — onu birbaşa gözləyirik
    const req = page.waitForRequest(r => r.url().includes('api.alquran.cloud') && r.url().includes('/editions/'))
    // Birinci sürəni aç (yalnız görünən element — telefonda menyu gizlidir)
    await page.getByText(/Fati(hə|ha|h)|Фатиха|Fâtiha|Al-Faatiha/i).filter({ visible: true }).first().click()
    const url = decodeURIComponent((await req).url())
    const others = Object.values(EDITIONS).filter(e => e !== edition)
    expect(url, 'seçilmiş dilin nəşri istənilməlidir').toContain(edition)
    expect(others.filter(o => url.includes(o)), 'başqa dilin nəşri istənilməməlidir').toEqual([])
  })
}

test('hədis axtarışı nəticə verir', async ({ page, consoleProblems }) => {
  await page.goto('/hadith')
  await settle(page)
  const search = page.getByRole('searchbox').or(page.getByPlaceholder(/axtar/i)).first()
  await search.fill('namaz')
  // Nəticə hədis siyahısında görünməlidir (menyudakı "Namaz" bəndləri sayılmır)
  await expect(page.locator('#qm-main, main').first().getByText(/namaz/i).nth(1)).toBeVisible()
  expectCleanConsole(consoleProblems)
})
