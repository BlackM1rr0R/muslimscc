// ═══════════════════════════════════════════════════════
// v7: Quranda sözə uzun basma → dairəvi menyu (components/quran/WordMenu.jsx)
//   • uzun basma (siçan: down → 600 ms → up) → menyu → «Məna» → pəncərədə söz tərcüməsi
//   • klaviatura: «…» düyməsi → siyahı menyusu (oxlar) → «Kök» → kök hərfləri
//   • «Qeyd»: rəng + mətn → kart vurğulanır → «Saxlanılanlar» → «Qeydlərim»
// Fatihə real ərəb mətni ilə (söz sırası Quran.com-un söz nömrəsi ilə eyni olmalıdır)
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const FATIHA = [
  'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
  'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  'مَٰلِكِ يَوْمِ ٱلدِّينِ',
  'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
  'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
  'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
]
const WORDS_1_2 = [
  ['ٱلْحَمْدُ', 'All praises and thanks', 'al-ḥamdu'],
  ['لِلَّهِ', '(be) to Allah', 'lillahi'],
  ['رَبِّ', 'the Lord', 'rabbi'],
  ['ٱلْعَٰلَمِينَ', 'of the universe', 'l-ʿālamīna'],
]

test.beforeEach(async ({ page }) => {
  await page.route(/api\.alquran\.cloud\/v1\/surah\/1\/editions\//, route => {
    const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
    route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => ({
      number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening',
      numberOfAyahs: 7, revelationType: 'Meccan',
      ayahs: FATIHA.map((ar, i) => ({ number: i + 1, numberInSurah: i + 1, juz: 1, page: 1, text: e.startsWith('ar.') ? ar : `[tərcümə ${i + 1}]` })),
      edition: { identifier: e, language: e.split('.')[0], type: e.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
    })) } })
  })
  await page.route(/api\.quran\.com\/api\/v4\/verses\/by_key\/1:2/, route => route.fulfill({ json: { verse: { verse_key: '1:2', words: [
    ...WORDS_1_2.map(([ar, tr, tl], i) => ({ position: i + 1, char_type_name: 'word', text_uthmani: ar, translation: { text: tr }, transliteration: { text: tl } })),
    { position: 5, char_type_name: 'end', text_uthmani: '٢' },
  ] } } }))
  await page.route(/api\.quran\.com\/api\/v4\/recitations\//, route => route.fulfill({ status: 404, json: {} }))
})

/** 2-ci ayənin ərəb mətnində ilk sözün (sağda — RTL) ortası */
async function firstWordPoint(page) {
  const el = page.locator('#ayah-2 .ayah-arabic')
  await expect(el).toBeVisible()
  // Ekranın ortasına (aşağıdakı mini-pleyer mətni örtməsin)
  await page.evaluate(() => document.querySelector('#ayah-2 .ayah-arabic').scrollIntoView({ block: 'center', behavior: 'instant' }))
  return page.evaluate(() => {
    const p = document.querySelector('#ayah-2 .ayah-arabic')
    const text = p.firstChild
    const r = document.createRange()
    r.setStart(text, 0); r.setEnd(text, text.nodeValue.indexOf(' '))
    const b = r.getBoundingClientRect()
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 }
  })
}

test('uzun basma → dairəvi menyu → «Məna» → söz tərcüməsi', async ({ page, consoleProblems }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const pt = await firstWordPoint(page)
  await page.mouse.move(pt.x, pt.y)
  await page.mouse.down()
  await page.waitForTimeout(650)
  await page.mouse.up()

  const menu = page.getByTestId('word-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem')).toHaveCount(5)
  // Bütün düymələr ekranın içindədir
  const vp = page.viewportSize()
  for (const b of await menu.getByRole('menuitem').all()) {
    const box = await b.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width); expect(box.y + box.height).toBeLessThanOrEqual(vp.height)
  }
  await menu.getByRole('menuitem', { name: 'Məna' }).click()

  const pop = page.getByTestId('word-popover')
  await expect(pop).toBeVisible()
  await expect(pop.getByTestId('word-meaning')).toHaveText('All praises and thanks')
  await expect(pop).toContainText('ingiliscə göstərilir')
  await expect(pop.locator('.wm-pop__ar')).toHaveText('ٱلْحَمْدُ')
  // Növbəti söz (ərəb mətni sağdan sola)
  await pop.getByRole('button', { name: 'Növbəti söz' }).click()
  await expect(pop.getByTestId('word-meaning')).toHaveText('(be) to Allah')

  await page.keyboard.press('Escape')
  await expect(pop).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('uzun basmada barmağı düyməyə sürüşdürüb buraxmaq — seçim', async ({ page, consoleProblems }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const pt = await firstWordPoint(page)
  await page.mouse.move(pt.x, pt.y)
  await page.mouse.down()
  await page.waitForTimeout(650)
  const item = page.getByTestId('word-menu').locator('[data-action="meaning"]')
  await expect(item).toBeVisible()
  const box = await item.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 })
  await page.mouse.up()
  await expect(page.getByTestId('word-popover')).toHaveAttribute('data-action', 'meaning')
  expectCleanConsole(consoleProblems)
})

test('klaviatura: «…» → siyahı menyusu → oxlarla «Kök» → kök hərfləri', async ({ page, consoleProblems }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const btn = page.locator('#ayah-2').getByTestId('word-menu-btn')
  await btn.focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('menuitem', { name: 'Məna' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('menuitem', { name: 'Kök' })).toBeFocused()
  await page.keyboard.press('Enter')
  const pop = page.getByTestId('word-popover')
  await expect(pop.getByTestId('word-root')).toHaveText('ح م د')
  await expect(pop.getByRole('link', { name: /Bu kökdən/ })).toHaveAttribute('href', /quran-roots\?root=/)
  await page.keyboard.press('Escape')
  await expect(pop).toHaveCount(0)
  await expect(btn).toBeFocused()
  expectCleanConsole(consoleProblems)
})

test('qeyd: rəng + mətn → kart vurğulanır → «Qeydlərim» siyahısında', async ({ page, consoleProblems }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await page.locator('#ayah-2').getByTestId('word-menu-btn').click()
  await page.getByRole('menu').getByRole('menuitem', { name: 'Qeyd' }).click()
  const pop = page.getByTestId('word-popover')
  await pop.getByRole('radio', { name: 'Yaşıl' }).check()
  await pop.getByRole('textbox').fill('Həmd yalnız Allaha')
  await pop.getByTestId('note-save').click()
  await expect(pop.getByRole('status').filter({ hasText: 'Saxlanıldı' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#ayah-2')).toHaveAttribute('data-note', 'green')
  await expect(page.locator('#ayah-2 .ayah-note')).toContainText('Həmd yalnız Allaha')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_notes_v1')))
  expect(saved['1:2']).toMatchObject({ c: 'green', t: 'Həmd yalnız Allaha' })

  await page.goto('/quran')
  await settle(page)
  await page.getByRole('button', { name: /Saxlanılanlar/ }).click()
  const notes = page.getByTestId('quran-notes')
  await expect(notes).toContainText('Həmd yalnız Allaha')
  await notes.getByRole('searchbox').fill('yoxdur-belə-söz')
  await expect(notes).toContainText('tapılmadı')
  await notes.getByRole('searchbox').fill('allaha')
  await expect(notes.locator('.qn__card')).toHaveCount(1)
  expectCleanConsole(consoleProblems)
})
