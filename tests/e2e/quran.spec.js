// ═══════════════════════════════════════════════════════
// Quran oxuyucusu: "Ayəyə keç" və dəqiq yerdən "Oxumağa davam et".
// Fikstür hər surədə 7 ayə qaytarır — burada Bəqərə üçün 286 ayəlik
// cavab veririk (uzun surədə sürüşmə və yoxlama real olsun).
// Ünvan formatı: /quran/2-al-baqara?a=90 (köhnə /quran?s=2&a=90 ora çevrilir);
// yaddaş açarı: localStorage.quran_bookmark
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const TOTAL = 286

function baqara(identifier) {
  return {
    number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara', englishNameTranslation: 'The Cow',
    numberOfAyahs: TOTAL, revelationType: 'Medinan',
    // Uzun mətn — kartlar real hündürlükdə olsun
    ayahs: Array.from({ length: TOTAL }, (_, i) => ({
      number: 7 + i + 1, numberInSurah: i + 1, juz: 1, page: 2,
      text: `[test ${identifier} ${i + 1}] ` + 'lorem ipsum dolor sit amet '.repeat(6),
    })),
    edition: { identifier, language: identifier.split('.')[0], type: identifier.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
  }
}

test.beforeEach(async ({ page }) => {
  // Sonra qeydə alınan marşrut üstünlük alır (fixtures.js-dəkinin üstündən)
  await page.route(/api\.alquran\.cloud\/v1\/surah\/2\/editions\//, route => {
    const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
    route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(baqara) } })
  })
  await page.route(/api\.alquran\.cloud\/v1\/surah(\?|$)/, route => route.fulfill({
    json: { code: 200, status: 'OK', data: Array.from({ length: 114 }, (_, i) => ({
      number: i + 1,
      name: i === 0 ? 'سُورَةُ ٱلْفَاتِحَةِ' : 'سورة',
      englishName: i === 0 ? 'Al-Faatiha' : i === 1 ? 'Al-Baqara' : `Surah ${i + 1}`,
      englishNameTranslation: 'Test',
      numberOfAyahs: i === 0 ? 7 : i === 1 ? TOTAL : 7,
      revelationType: i === 1 ? 'Medinan' : 'Meccan',
    })) },
  }))
})

/** Ayə kartı görünür və yapışqan panelin altında qalmır */
async function expectAyahOnTop(page, n) {
  const card = page.locator(`#ayah-${n}`)
  await expect(card).toBeInViewport()
  // Sürüşmə bitsin (hamar sürüşmə; testdə reduced-motion → dərhal)
  await expect.poll(async () => {
    const [cardTop, barBottom] = await page.evaluate((id) => [
      document.getElementById(id).getBoundingClientRect().top,
      document.querySelector('.reader-toolbar').getBoundingClientRect().bottom,
    ], `ayah-${n}`)
    return cardTop >= barBottom - 1 && cardTop < barBottom + 160
  }, { message: `${n}-ci ayə panelin altında, ekranın yuxarısında olmalıdır` }).toBe(true)
}

test('ayəyə keçid: 90 yazıb Enter → həmin ayə görünür, ünvanda a=90', async ({ page, consoleProblems }) => {
  await page.goto('/quran/2-al-baqara')
  await settle(page)
  await expect(page.locator('#ayah-1')).toBeVisible()

  await page.getByRole('button', { name: 'Ayəyə keç' }).click()
  const field = page.getByRole('spinbutton', { name: 'Ayənin nömrəsi' })
  await expect(field).toBeFocused()
  await field.fill('90')
  await field.press('Enter')

  await expectAyahOnTop(page, 90)
  await expect(page).toHaveURL(/\/quran\/2-al-baqara\?a=90$/)
  // Vurğu (qızılı halqa) yalnız hədəf ayədədir
  await expect(page.locator('#ayah-90.is-target')).toHaveCount(1)
  // Yer yadda qaldı
  const bm = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_bookmark')))
  expect(bm).toMatchObject({ surah: 2, ayah: 90 })
  expectCleanConsole(consoleProblems)
})

test('ayəyə keçid: hədddən kənar rəqəm qəbul edilmir, siyahıdan seçmək işləyir', async ({ page, consoleProblems }) => {
  await page.goto('/quran/2-al-baqara')
  await settle(page)
  await page.getByRole('button', { name: 'Ayəyə keç' }).click()
  const field = page.getByRole('spinbutton', { name: 'Ayənin nömrəsi' })
  await field.fill('300')
  await field.press('Enter')
  await expect(page.getByRole('alert').filter({ hasText: `1 ilə ${TOTAL} arasında` })).toBeVisible()
  await expect(page).not.toHaveURL(/a=300/)

  // Nömrə şəbəkəsindən seçim
  await page.getByRole('group', { name: 'Və ya siyahıdan seçin' }).getByRole('button', { name: '200-cü ayə' }).click()
  await expectAyahOnTop(page, 200)
  await expect(page).toHaveURL(/a=200\b/)
  await expect(page.getByRole('dialog', { name: 'Ayəyə keç' })).toBeHidden()
  expectCleanConsole(consoleProblems)
})

test('G qısayolu sahəni fokuslayır, Esc paneli bağlayır', async ({ page }) => {
  await page.goto('/quran/2-al-baqara')
  await settle(page)
  await expect(page.locator('#ayah-1')).toBeVisible()
  await page.keyboard.press('g')
  await expect(page.getByRole('spinbutton', { name: 'Ayənin nömrəsi' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Ayəyə keç' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Ayəyə keç' })).toBeFocused()
})

test('paylaşılan köhnə link /quran?s=2&a=120 yeni ünvana keçir və həmin ayəni açır', async ({ page, consoleProblems }) => {
  await page.goto('/quran?s=2&a=120')
  await settle(page)
  await expect(page).toHaveURL(/\/quran\/2-al-baqara\?a=120$/)
  await expectAyahOnTop(page, 120)
  await expect(page.locator('h1')).toHaveCount(1)
  expectCleanConsole(consoleProblems)
})

test('dil dəyişəndə oxuyucu açıq qalır və oxunan ayəyə qayıdır', async ({ page, consoleProblems, isMobile }) => {
  test.skip(isMobile, 'dil menyusu telefonda çəkmə menyunun içindədir — kompüterdə yoxlanır')
  await page.goto('/quran/2-al-baqara?a=60')
  await settle(page)
  await expectAyahOnTop(page, 60)
  await page.getByRole('button', { name: 'Dili dəyiş' }).click()
  await page.getByRole('menuitemradio', { name: 'English' }).or(page.getByRole('menuitem', { name: 'English' })).or(page.getByRole('button', { name: 'English' })).first().click()
  await expect(page).toHaveURL(/\/en\/quran\/2-al-baqara\?a=60$/)
  await expectAyahOnTop(page, 60)
  expectCleanConsole(consoleProblems)
})

test('ayə nömrəsinə klik ünvanı yeniləyir', async ({ page }) => {
  await page.goto('/quran/2-al-baqara')
  await settle(page)
  await page.locator('#ayah-3 .ayah-num').click()
  await expect(page).toHaveURL(/\/quran\/2-al-baqara\?a=3$/)
})

test('dəqiq yerdən davam: yaddaşdakı 50-ci ayə → reload → "Oxumağa davam et" → 50-ci ayə', async ({ page, consoleProblems }) => {
  await page.goto('/quran')
  await settle(page)
  await page.evaluate(() => localStorage.setItem('quran_bookmark', JSON.stringify({ surah: 2, ayah: 50, name: 'Bəqərə', time: Date.now() - 86_400_000 })))
  await page.reload()
  await settle(page)

  const cont = page.getByRole('button', { name: /Oxumağa davam et/ })
  await expect(cont).toContainText('Bəqərə, 50-ci ayə')
  await cont.click()

  await expectAyahOnTop(page, 50)
  await expect(page).toHaveURL(/\/quran\/2-al-baqara\?a=50$/)
  expectCleanConsole(consoleProblems)
})

test('köhnə əlfəcin (ayəsiz) surəni əvvəldən açır', async ({ page }) => {
  await page.goto('/quran')
  await settle(page)
  await page.evaluate(() => localStorage.setItem('quran_bookmark', JSON.stringify({ surah: 2, name: 'Bəqərə', time: Date.now() })))
  await page.reload()
  await settle(page)
  const cont = page.getByRole('button', { name: /Oxumağa davam et/ })
  await expect(cont).toContainText('Bəqərə')
  await expect(cont).not.toContainText('ayə')
  await cont.click()
  await expect(page.locator('#ayah-1')).toBeInViewport()
  await expect(page).toHaveURL(/\/quran\/2-al-baqara$/)
})

test('oxuduqca yer yadda qalır, Geri → siyahı, davam et həmin yerə qaytarır', async ({ page, consoleProblems }) => {
  await page.goto('/quran')
  await settle(page)
  // Siyahıdan aç (tarixçə girişi yaranır — Geri siyahıya qaytarmalıdır)
  await page.locator('.surah-card').nth(1).click()
  await expect(page).toHaveURL(/\/quran\/2-al-baqara$/)
  await expect(page.locator('#ayah-1')).toBeVisible()

  // İstifadəçi kimi aşağı sürüşdür (təkərlə)
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 900)
  await page.waitForTimeout(1300) // yazma throttle-u (1 s)
  const bm = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_bookmark')))
  expect(bm.surah).toBe(2)
  expect(bm.ayah, 'sürüşəndən sonra ayə yazılmalıdır').toBeGreaterThan(5)
  const saved = bm.ayah

  await page.goBack()
  await expect(page).toHaveURL(/\/quran$/)
  const cont = page.getByRole('button', { name: /Oxumağa davam et/ })
  await expect(cont).toContainText(`Bəqərə, ${saved}-`)
  await cont.click()
  await expectAyahOnTop(page, saved)
  expectCleanConsole(consoleProblems)
})
