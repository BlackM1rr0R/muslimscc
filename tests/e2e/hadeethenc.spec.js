// Hədis ensiklopediyası (/hadith-encyclopedia): HadeethEnc.com API-si sabit cavabla əvəzlənir
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const CATS = [
  { id: '1', title: 'Qurani-Kərim və ona aid elmlər', hadeeths_count: '2', parent_id: null },
  { id: '3', title: 'Əqidə', hadeeths_count: '1', parent_id: null },
  { id: '8', title: 'Quranın fəzilətləri', hadeeths_count: '1', parent_id: '1' },
]
const LIST = {
  1: [{ id: '5913', title: 'Sizin ən xeyirliniz Quranı öyrənən və onu öyrədəndir' }, { id: '6208', title: 'Evlərinizi qəbiristanlığa çevirməyin' }],
  3: [{ id: '3062', title: 'Əqidə hədisi' }],
  8: [{ id: '6208', title: 'Evlərinizi qəbiristanlığa çevirməyin' }],
}
const ONE = (id) => ({
  id, title: LIST[1].concat(LIST[3]).find(x => x.id === id)?.title || 'Hədis',
  hadeeth: 'Osmandan rəvayət edildiyinə görə: "Sizin ən xeyirliniz Quranı öyrənən və onu öyrədəndir".',
  attribution: 'Əl-Buxari rəvayət etdi', grade: 'Səhih',
  explanation: 'Şərh mətni.', hints: ['Birinci fayda.\r', 'İkinci fayda.'], categories: ['1'],
  hadeeth_ar: 'عن عثمان رضي الله عنه: «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ».',
  attribution_ar: 'رواه البخاري', grade_ar: 'صحيح', explanation_ar: 'شرح', hints_ar: [],
  words_meanings_ar: [{ word: 'ينفر', meaning: 'يصد' }],
})

async function mockHe(page, { failList = false } = {}) {
  await page.route(/hadeethenc\.com\/api\/v1\//, (route) => {
    const u = new URL(route.request().url())
    if (u.pathname.startsWith('/api/v1/categories/list')) return route.fulfill({ json: CATS })
    if (u.pathname.startsWith('/api/v1/hadeeths/list')) {
      if (failList) return route.fulfill({ status: 503, json: {} })
      const data = LIST[u.searchParams.get('category_id')] || []
      return route.fulfill({ json: { data, meta: { current_page: '1', last_page: 1, total_items: data.length, per_page: '24' } } })
    }
    if (u.pathname.startsWith('/api/v1/hadeeths/one')) {
      const id = u.searchParams.get('id')
      if (id === '999' && u.searchParams.get('language') === 'az') return route.fulfill({ status: 404, json: {} })
      return route.fulfill({ json: ONE(id) })
    }
    return route.fulfill({ status: 404, json: {} })
  })
}

test('hədis ensiklopediyası: bölmələr, kartlar, oxu pəncərəsi, seçilmişlər, keçid', async ({ page, consoleProblems }) => {
  await mockHe(page)
  await page.goto('/hadith-encyclopedia')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Hədis ensiklopediyası')
  // Mənbə göstərilir
  await expect(page.locator('.he-credit a')).toHaveAttribute('href', /hadeethenc\.com/)
  // İlk kök bölmə seçilib, alt bölmə çipi var
  await expect(page.locator('.he-root[aria-pressed="true"]')).toContainText('Qurani-Kərim')
  await expect(page.locator('.he-card')).toHaveCount(2)
  await page.locator('.he-chip', { hasText: 'Quranın fəzilətləri' }).click()
  await expect(page.locator('.he-card')).toHaveCount(1)
  await page.locator('.he-root', { hasText: 'Əqidə' }).click()
  await expect(page.locator('.he-card')).toHaveCount(1)
  await expect(page.locator('.he-card').first()).toContainText('Əqidə hədisi')

  // Oxu pəncərəsi — mətn API-dən dəyişmədən, düz mətn kimi
  await page.locator('.he-root', { hasText: 'Qurani-Kərim' }).click()
  await page.locator('.he-card__open').first().click()
  const dlg = page.getByRole('dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg.locator('.he-read__ar')).toContainText('خَيْرُكُمْ')
  await expect(dlg.locator('.he-read__meta')).toContainText('Səhih')
  await expect(dlg.locator('.he-read__meta')).toContainText('Əl-Buxari rəvayət etdi')
  await expect(dlg.locator('.he-read__list li')).toHaveCount(2)
  await expect(dlg.locator('.he-words')).toContainText('ينفر')
  await expect(dlg.locator('.he-read__site')).toHaveAttribute('href', 'https://hadeethenc.com/az/browse/hadith/5913')
  await expect(page).toHaveURL(/#id-5913$/)
  // Növbəti → ikinci hədis; ulduz → seçilmişlər
  await dlg.getByRole('button', { name: 'Növbəti' }).click()
  await expect(page).toHaveURL(/#id-6208$/)
  await dlg.locator('.cl-star').click()
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  const favs = await page.evaluate(() => JSON.parse(localStorage.getItem('hadeethenc_favs_v1')))
  expect(favs.map(f => f.id)).toEqual(['6208'])
  await page.locator('.he-root--fav').click()
  await expect(page.locator('.he-card')).toHaveCount(1)
  expectCleanConsole(consoleProblems)

  // Birbaşa keçid (#id-…) və bu dildə olmayan hədis (404 — brauzer konsola yazır, ona görə yuxarıda yoxlanıb)
  await page.goto('/hadith-encyclopedia#id-999')
  await settle(page)
  await expect(page.getByRole('dialog')).toContainText('Bu hədis seçilmiş dildə hələ yoxdur')
  await page.getByRole('dialog').getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('dialog').locator('.he-read__ar')).toBeVisible()
})

test('hədis ensiklopediyası: API xətasında "yenidən cəhd et" görünür', async ({ page }) => {
  await mockHe(page, { failList: true })
  await page.goto('/en/hadith-encyclopedia')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Hadith Encyclopedia')
  await expect(page.getByRole('alert')).toContainText('Could not load the data')
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
})
