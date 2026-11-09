// ═══════════════════════════════════════════════════════
// Hədis kitabxanası (/hadith-library) — fawazahmed0/hadith-api
//   • kitab kartları → bölmələr → hədis kartları → oxu pəncərəsi, hash ünvan
//   • dərəcələr mənbədəki kimi ("Al-Albani: Sahih"), zəif dərəcə işarələnir,
//     dərəcəsi olmayan hədisdə çip yoxdur
//   • birbaşa keçid (#abudawud/1/2) hədisi açır; Geri pəncərəni bağlayır
//   • şəbəkə xətası → xəta vəziyyəti + "Yenidən cəhd et"
// Şəbəkə page.route ilə əvəzlənir (CI-da CDN olmaya bilər).
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const CDN = /cdn\.jsdelivr\.net\/gh\/fawazahmed0\/hadith-api@1\/editions\/([a-z]+)-([a-z]+)\/sections\/(\d+)\.min\.json/
const RAW = /raw\.githubusercontent\.com\/fawazahmed0\/hadith-api\//

function section(prefix, book, sec) {
  const ar = prefix === 'ara'
  const hadiths = [1, 2, 3].map(n => ({
    hadithnumber: n, arabicnumber: n,
    text: ar ? `حدثنا [اختبار ${n}]` : `Narrated test ${n}: [${prefix} text ${n}]`,
    grades: n === 1 ? [{ name: 'Al-Albani', grade: 'Sahih' }, { name: 'Zubair Ali Zai', grade: 'Hasan' }]
      : n === 2 ? [{ name: 'Al-Albani', grade: 'Daif' }] : [],
    reference: { book: sec, hadith: n },
  }))
  return { metadata: { name: book, section: { [sec]: 'Test' }, section_detail: {} }, hadiths }
}

async function mockApi(page, state = { fail: false }) {
  await page.route(RAW, route => route.fulfill({ status: 503, body: '' }))
  await page.route(CDN, route => {
    if (state.fail) return route.fulfill({ status: 503, body: '' })
    const [, prefix, book, sec] = route.request().url().match(CDN)
    return route.fulfill({ json: section(prefix, book, Number(sec)), headers: { 'Access-Control-Allow-Origin': '*' } })
  })
}

test('kitab → bölmə → hədis: dərəcələr olduğu kimi, oxu pəncərəsi və hash', async ({ page, consoleProblems }) => {
  await mockApi(page)
  await page.goto('/hadith-library')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Hədis kitabxanası')
  await expect(page.locator('.hl-book')).toHaveCount(9)

  await page.locator('#hl-main').getByRole('button', { name: 'Sünən Əbu Davud', exact: true }).click()
  await expect(page).toHaveURL(/#abudawud$/)
  await expect(page.locator('.hl-sec').first()).toBeVisible()
  // az: mənbədə Azərbaycan dilinə tərcümə yoxdur — qeyd göstərilir
  await expect(page.locator('.hl-note')).toContainText('ingiliscə')

  await page.locator('.hl-sec__open').first().click()
  await expect(page).toHaveURL(/#abudawud\/1$/)
  await expect(page.locator('.hl-card')).toHaveCount(3)
  // Dərəcə mənbədəki kimi; zəif dərəcə işarələnir; dərəcəsiz hədisdə çip yoxdur
  const c1 = page.locator('.hl-card').nth(0)
  await expect(c1.locator('.hl-grade').first()).toHaveText('Al-Albani: Sahih')
  await expect(page.locator('.hl-card').nth(1).locator('.hl-grade--weak')).toHaveText('Al-Albani: Daif')
  await expect(page.locator('.hl-card').nth(1)).toHaveClass(/hl-card--weak/)
  await expect(page.locator('.hl-card').nth(2).locator('.hl-grade')).toHaveCount(0)
  await expect(c1.locator('.hl-card__tr')).toContainText('[eng text 1]')

  // Axtarış bölmə daxilində
  await page.locator('.hl-search input').fill('text 3')
  await expect(page.locator('.hl-card')).toHaveCount(1)
  await page.locator('.hl-search input').fill('')

  // Oxu pəncərəsi: ərəbcə əvvəl, tərcümə, əvvəlki/növbəti, hash
  await c1.locator('.hl-card__open').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg.locator('.hl-read__ar')).toContainText('اختبار 1')
  await expect(page).toHaveURL(/#abudawud\/1\/1$/)
  await dlg.getByRole('button', { name: 'Növbəti' }).click()
  await expect(page).toHaveURL(/#abudawud\/1\/2$/)
  await expect(dlg.locator('.hl-read__weak')).toBeVisible()

  // Seçilmişlər
  await dlg.locator('.cl-star').click()
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  await expect(page).toHaveURL(/#abudawud\/1$/)
  await page.getByRole('button', { name: 'Kitabxana' }).click()
  await expect(page.locator('.hl-fav')).toHaveCount(1)

  expectCleanConsole(consoleProblems)
})

test('birbaşa keçid hədisi açır, Geri pəncərəni bağlayır', async ({ page, consoleProblems }) => {
  await mockApi(page)
  await page.goto('/hadith-library#abudawud/1/2')
  await settle(page)
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg.locator('.hl-read__ar')).toContainText('اختبار 2')
  await expect(page).toHaveURL(/#abudawud\/1\/2$/)
  await page.goBack()
  await expect(dlg).toBeHidden()
  await expect(page.locator('.hl-card')).toHaveCount(3)
  expectCleanConsole(consoleProblems)
})

test('ərəbcə interfeysdə susmaya görə yalnız ərəb mətni', async ({ page }) => {
  await mockApi(page)
  await page.goto('/ar/hadith-library#bukhari/1')
  await settle(page)
  await expect(page.locator('.hl-card')).toHaveCount(3)
  await expect(page.locator('.hl-card__tr')).toHaveCount(0)
  await expect(page.locator('.hl-tr__select')).toHaveValue('')
})

test('şəbəkə xətası: xəta vəziyyəti və yenidən cəhd', async ({ page }) => {
  const state = { fail: true }
  await mockApi(page, state)
  await page.goto('/hadith-library#malik/1')
  await settle(page)
  await expect(page.getByRole('alert')).toContainText('Bölmə yüklənmədi')
  state.fail = false
  await page.getByRole('button', { name: 'Yenidən cəhd et' }).click()
  await expect(page.locator('.hl-card')).toHaveCount(3)
})
