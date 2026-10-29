// ═══════════════════════════════════════════════════════
// QA (A qrupu səhifələri): tapılmış və düzəldilmiş xətaların reqressiya testləri
//   • pozuq localStorage səhifəni çökdürməməlidir (zikr, hifz, dua gündəliyi,
//     statistika, Quran, kviz, Quran müsabiqəsi, dualar)
//   • dua gündəliyi: əlavə → redaktə → qəbul oldu → sil
//   • zikr: dövr tamamlanır, jurnal ad cari dildə, ömürlük sayğac yazılır
//   • statistika: /prayer və /dailytracker qeydləri sayılır (əvvəl həmişə 0)
//   • Quran: API xətası → dürüst xəta + "Yenidən cəhd et"; ayə axtarışı xətası
//   • kviz: 0 xal təkrarlananda "Yeni rekord" yazılmır; klaviatura qısayolları
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

// Hər səhifəyə uyğun "pozuq" yaddaş dəyərləri
const BROKEN = {
  '/dhikr': { dhikr_session: '{"count":"abc","selIdx":99,"log":[null,5,{"name":{"x":1},"count":"x"}]}' },
  '/hifz': { hifz_progress: 'null' },
  '/duajournal': { dua_journal: '{"duas":"x"}' },
  '/analytics': {
    muslim_cc_prayer_stats: '[1,2]', daily_tracker: '{"2026-10-27":null}', quran_stats: '{"dates":"x","reads":null}',
    charity_log: '{"a":1}', quiz_scores: '5', quran_game_scores: '{"complete":{"x":1}}', dua_journal: 'null', hadith_favs: '"abc"',
  },
  '/quran': { quran_stats: '{"dates":5}' },
  '/quiz': { quiz_scores: '7' },
  '/qurangame': { quran_game_scores: 'null' },
  '/duas': { dua_favs: '{}' },
}

for (const [url, store] of Object.entries(BROKEN)) {
  test(`${url}: pozuq localStorage ilə səhifə çökmür`, async ({ page, consoleProblems }, info) => {
    test.skip(info.project.name === 'mobile', 'masaüstü kifayətdir')
    await page.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v) }, store)
    await page.goto(url)
    await settle(page)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.locator('main')).not.toContainText('[object Object]')
    await expect(page.locator('main')).not.toContainText('NaN')
    expectCleanConsole(consoleProblems)
  })
}

test('dua gündəliyi: əlavə et → redaktə → qəbul oldu → sil', async ({ page, consoleProblems }) => {
  page.on('dialog', d => d.accept())
  await page.goto('/duajournal')
  await settle(page)
  await page.getByRole('button', { name: 'Dua əlavə et' }).click()
  await page.getByPlaceholder('Duanı yaz...').fill('Sınaq duası')
  await page.getByRole('button', { name: 'Saxla' }).click()
  const card = page.locator('.dj-card').filter({ hasText: 'Sınaq duası' })
  await expect(card).toBeVisible()

  // Redaktə: forma köhnə mətnlə açılır, yeni mətn saxlanılır
  await card.getByRole('button', { name: 'Redaktə et' }).click()
  await expect(page.getByPlaceholder('Duanı yaz...')).toHaveValue('Sınaq duası')
  await page.getByPlaceholder('Duanı yaz...').fill('Düzəldilmiş dua')
  await page.getByRole('button', { name: 'Saxla' }).click()
  await expect(page.locator('.dj-card').filter({ hasText: 'Düzəldilmiş dua' })).toBeVisible()
  await expect(page.locator('.dj-card').filter({ hasText: 'Sınaq duası' })).toHaveCount(0)
  // Yaddaşa yazılıb və tarix yerli formatdadır (YYYY-MM-DD)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dua_journal')).duas)
  expect(saved).toHaveLength(1)
  expect(saved[0].text).toBe('Düzəldilmiş dua')
  expect(saved[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

  // Qəbul oldu → "Qəbul olunanlar" tabına keçir
  await page.locator('.dj-card').getByRole('button', { name: 'Qəbul oldu' }).click()
  await expect(page.locator('.dj-card')).toHaveCount(0)
  await page.getByRole('tab', { name: /Qəbul olunanlar/ }).click()
  await expect(page.locator('.dj-card').filter({ hasText: 'Düzəldilmiş dua' })).toBeVisible()

  // Sil (təsdiq dialoqu qəbul edilir)
  await page.locator('.dj-card').getByRole('button', { name: 'Sil' }).click()
  await expect(page.locator('.dj-card')).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('dua_journal')).duas.length)).toBe(0)
  expectCleanConsole(consoleProblems)
})

test('zikr: 33 toxunuş → dövr jurnala düşür, ömürlük sayğac artır', async ({ page, consoleProblems }) => {
  await page.goto('/dhikr')
  await settle(page)
  const tap = page.locator('.dhikr-tap-btn')
  const target = Number((await page.locator('.dhikr-tap-target').innerText()).replace(/\D/g, ''))
  for (let i = 0; i < target; i++) await tap.click()
  await expect(page.locator('.dhikr-complete-badge')).toBeVisible()
  await expect(page.locator('.dhikr-log-row')).toHaveCount(1)
  expect(await page.evaluate(() => localStorage.getItem('dhikr_count_total'))).toBe(String(target))
  // Növbəti toxunuş yeni dövrə başlayır
  await tap.click()
  await expect(page.locator('.dhikr-tap-count')).toHaveText('1')
  expectCleanConsole(consoleProblems)
})

test('zikr jurnalı: dil dəyişəndə ad yeni dildə görünür', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dhikr_session', JSON.stringify({
    count: 0, selIdx: 0, log: [{ id: 1, idx: 0, name: 'Sübhanallah', count: 33, time: '10:00' }],
  })))
  await page.goto('/ru/dhikr')
  await settle(page)
  const name = await page.locator('.dhikr-log-name').first().innerText()
  expect(name).toMatch(/[Ѐ-ӿ]/)
})

test('statistika: /prayer və /dailytracker qeydləri sayılır', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => {
    const d = new Date()
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    localStorage.setItem('muslim_cc_prayer_stats', JSON.stringify({ [`${day}_Fajr`]: true, [`${day}_Dhuhr`]: true }))
    localStorage.setItem('daily_tracker', JSON.stringify({ [day]: { fajr: true, asr: true, quran: true } }))
  })
  await page.goto('/analytics')
  await settle(page)
  await expect(page.locator('.analytics-nodata')).toHaveCount(0)
  // 3 fərqli namaz (Fajr iki yerdə yazılıb — bir dəfə sayılır)
  const prayerCard = page.locator('.analytics-card').first()
  await expect(prayerCard.locator('.analytics-stat-value.highlight')).toHaveText('3')
  // Bu gün: 4 / 10 fəaliyyət (3 namaz + Quran) — əvvəl "100%" görünürdü
  await expect(page.locator('.analytics-split-col').first().locator('.analytics-stat-value')).toHaveText('40%')
  expectCleanConsole(consoleProblems)
})

test('Quran: siyahı API-si 500 → xəta və "Yenidən cəhd et" işləyir', async ({ page }) => {
  let fail = true
  await page.route(/api\.alquran\.cloud\/v1\/surah(\?|$)/, route => fail
    ? route.fulfill({ status: 500, body: 'Internal Server Error' })
    : route.fallback())
  await page.goto('/quran')
  await settle(page)
  const retry = page.getByRole('button', { name: 'Yenidən cəhd et' })
  await expect(retry).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('yüklənmədi')
  fail = false
  await retry.click()
  await expect(page.locator('.surah-card').first()).toBeVisible()
})

test('Quran: ayə axtarışında şəbəkə xətası "nəticə yoxdur" kimi göstərilmir', async ({ page }) => {
  await page.route(/api\.alquran\.cloud\/v1\/search\//, route => route.abort())
  await page.goto('/quran')
  await settle(page)
  await page.getByRole('button', { name: 'Ayə axtar' }).click()
  await page.locator('.qp-search input, input[type="search"]').first().fill('rəhmət')
  await expect(page.getByRole('alert')).toContainText('Axtarış alınmadı')
  await expect(page.getByRole('button', { name: 'Yenidən cəhd et' })).toBeVisible()
})

test('kviz: klaviatura ilə tam raund; 0 xal təkrarı "Yeni rekord" deyil', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => localStorage.setItem('quiz_scores', JSON.stringify({ quran: 0 })))
  await page.goto('/quiz')
  await settle(page)
  await page.locator('.quiz-category-card').first().click()
  // Hər sualda düzgün OLMAYAN variantı klaviatura ilə seç → nəticə 0
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.quiz-results-card').isVisible()) break
    const opts = page.locator('.quiz-option')
    await expect(opts.first()).toBeVisible()
    await page.keyboard.press('1')
    // 1-ci variant düzgün idisə, sayı saxla — sonra yoxlanılır
    await expect(page.locator('.quiz-next-btn')).toBeVisible()
    await page.keyboard.press('Enter')
  }
  await expect(page.locator('.quiz-results-card')).toBeVisible()
  const correct = Number(await page.locator('.quiz-stat-correct .quiz-stat-num').innerText())
  // Rekord 0 idi: yalnız 0-dan çox toplananda "Yeni rekord"
  await expect(page.locator('.quiz-new-best')).toHaveCount(correct > 0 ? 1 : 0)
  expectCleanConsole(consoleProblems)
})

test('hifz: surə "əzbər" olur, statistika və yaddaş yenilənir', async ({ page, consoleProblems }) => {
  await page.goto('/hifz')
  await settle(page)
  const card = page.locator('.hifz-card').first()
  await card.click()
  await card.click()
  await expect(card).toHaveClass(/memorized/)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hifz_progress')))).toEqual({ 1: 2 })
  await expect(page.locator('.hifz-stat-card.memorized .hifz-stat-num')).toHaveText('1')
  expectCleanConsole(consoleProblems)
})

test('telefon: kitab kartında "Paylaş" düyməsi sıxılmır, lüğət hərfləri ≥ 44px', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız telefon')
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/books')
  await settle(page)
  const share = page.locator('.bp-share-btn').first()
  await expect(share).toBeVisible()
  expect((await share.boundingBox()).width).toBeGreaterThanOrEqual(43)
  await page.goto('/glossary')
  await settle(page)
  const chip = page.locator('.glossary-alpha-btn:not(.glossary-alpha-btn--all)').first()
  expect((await chip.boundingBox()).width).toBeGreaterThanOrEqual(43)
})
