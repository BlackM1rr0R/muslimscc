// ═══════════════════════════════════════════════════════
// Ərəb kursu (/learn-arabic): dərs kartları, hash ilə dərs açılışı və "geri",
// hərf kartı (4 forma, səs, Quran nümunəsi), bitişməyən hərflər filtri,
// hərəkə cədvəli, oxu məşqi (transliterasiya, ayə səsi), yoxlama → irəliləyiş
// (localStorage), "Davam et", 5 dil / RTL.
//
// Qeyd: marşrut App.jsx-ə qoşulandan sonra işləyir (açar 'arabic', path
// 'learn-arabic'). Səs: HTMLMediaElement stub-dır — şəbəkə yoxdur, play()
// çağırılan ünvanlar window.__plays-ə yazılır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

function stubMedia() {
  const P = HTMLMediaElement.prototype
  window.__plays = []
  const st = new WeakMap()
  const s = (el) => { if (!st.has(el)) st.set(el, { src: '', paused: true }); return st.get(el) }
  Object.defineProperty(P, 'src', { configurable: true, get() { return s(this).src }, set(v) { s(this).src = String(v) } })
  Object.defineProperty(P, 'paused', { configurable: true, get() { return s(this).paused } })
  P.load = function () {}
  P.play = function () { s(this).paused = false; window.__plays.push(s(this).src); return Promise.resolve() }
  P.pause = function () { s(this).paused = true }
}

const plays = (page) => page.evaluate(() => window.__plays)
const lessonSection = (page) => page.locator('section.ac-lesson')

test.beforeEach(async ({ page }) => { await page.addInitScript(stubMedia) })

test('başlanğıc: bir h1, 4 dərs kartı, 0% irəliləyiş, "Başla" birinci dərsi açır', async ({ page, consoleProblems }) => {
  await page.goto('/learn-arabic')
  await settle(page)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveText('Ərəb əlifbası və Quran oxumağı öyrən')
  await expect(page.locator('.ac-lesson-card')).toHaveCount(4)
  await expect(page.locator('.ac-progress__num')).toHaveText('0%')
  await expect(lessonSection(page)).toHaveCount(0)

  await page.getByRole('link', { name: 'Başla', exact: true }).click()
  await expect(page).toHaveURL(/\/learn-arabic#letters$/)
  await expect(lessonSection(page).getByRole('heading', { level: 2 })).toHaveText('Hərflər')
  await expect(page.locator('.ac-tile')).toHaveCount(28)

  // Brauzerin "geri" düyməsi dərsi bağlayır
  await page.goBack()
  await expect(page).toHaveURL(/\/learn-arabic$/)
  await expect(lessonSection(page)).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('hərf kartı: 4 forma, ad, səs, Qurandan nümunə; bitişməyənlər filtri', async ({ page, consoleProblems }) => {
  await page.goto('/learn-arabic#letters')
  await settle(page)
  await page.getByRole('button', { name: 'Be — ب' }).click()

  const detail = page.locator('.ac-detail')
  await expect(detail.locator('#ac-detail-name')).toContainText('Be')
  await expect(detail.locator('.ac-form')).toHaveCount(4)
  await expect(detail.locator('.ac-form__glyph')).toHaveText(['ب', 'بـ', 'ـبـ', 'ـب'])
  await expect(detail.locator('.ac-qex__ar')).toHaveText('بِسْمِ')
  await expect(detail.locator('.ac-ref')).toContainText('1:1')

  await detail.getByRole('button', { name: 'Tələffüzü dinlə' }).click()
  await expect.poll(() => plays(page)).toContain('/audio/arabic/ba.wav')
  // Ayənin səsi — Əfasi, ümumi ayə nömrəsi 1
  await detail.getByRole('button', { name: /Ayəni dinlə — 1:1/ }).click()
  await expect.poll(async () => (await plays(page)).at(-1)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3')

  // Növbəti hərf
  await detail.getByRole('button', { name: 'Növbəti hərf' }).click()
  await expect(detail.locator('#ac-detail-name')).toContainText('Te')

  // Bitişməyən 6 hərf
  await page.getByRole('button', { name: 'Bitişməyənlər' }).click()
  await expect(page.locator('.ac-tile')).toHaveCount(6)
  await expect(page.locator('.ac-tile__glyph')).toHaveText(['ا', 'د', 'ذ', 'ر', 'ز', 'و'])
  expectCleanConsole(consoleProblems)
})

test('hərəkələr: 7 işarə kartı, cədvəldə tənvin 3 heca, hecalarda səs düyməsi yoxdur', async ({ page, consoleProblems }) => {
  await page.goto('/learn-arabic#harakat')
  await settle(page)
  await expect(page.locator('.ac-hk')).toHaveCount(7)
  await page.getByRole('button', { name: 'Tənvin', exact: true }).click()
  const ba = page.locator('.ac-syl-cell').nth(1)
  await expect(ba.locator('.ac-syl__ar')).toHaveText(['بًا', 'بٍ', 'بٌ'])
  await expect(ba.locator('.ac-tl')).toHaveText(['ban', 'bin', 'bun'])
  await expect(page.locator('.ac-syl-grid button')).toHaveCount(0)
  // Sükun rejimində əlif yoxdur (27 xana)
  await page.getByRole('button', { name: 'Sükun', exact: true }).click()
  await expect(page.locator('.ac-syl-cell')).toHaveCount(27)
  expectCleanConsole(consoleProblems)
})

test('oxu məşqi: transliterasiya açarı, Nas surəsi 6 ayə, ayə səsi', async ({ page, consoleProblems }) => {
  await page.goto('/learn-arabic#reading')
  await settle(page)
  const firstWord = page.locator('.ac-words .ac-word').first()
  await expect(firstWord).not.toHaveClass(/is-open/)
  await firstWord.click()
  await expect(firstWord).toHaveClass(/is-open/)

  await page.getByText('Transliterasiyanı göstər').click()
  await expect(page.locator('.ac-word.is-open')).toHaveCount(await page.locator('.ac-word').count())

  await page.getByRole('button', { name: 'Nas', exact: true }).click()
  await expect(page.locator('.ac-ayah')).toHaveCount(6)
  await page.locator('.ac-ayah').first().getByRole('button', { name: 'Ayəni dinlə' }).click()
  await expect.poll(async () => (await plays(page)).at(-1)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/6231.mp3')
  expectCleanConsole(consoleProblems)
})

test('yoxlama: 10 sual, nəticə yaddaşa yazılır, kartda görünür', async ({ page, consoleProblems }) => {
  await page.goto('/learn-arabic#letters')
  await settle(page)
  await lessonSection(page).getByRole('button', { name: 'Yoxla', exact: true }).click()
  const quiz = page.locator('.ac-quiz')
  await expect(quiz.locator('.ac-quiz__count')).toHaveText('Sual 1 / 10')

  for (let i = 0; i < 10; i++) {
    await quiz.locator('.ac-option').first().click()
    await expect(quiz.locator('.ac-option.is-correct')).toHaveCount(1)
    await quiz.getByRole('button', { name: i === 9 ? /Nəticəni gör/ : /Növbəti/ }).click()
  }
  await expect(page.locator('.ac-result__title')).toContainText('Nəticə')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('arabic_course_v1')))
  expect(saved.last).toBe('letters')
  expect(saved.best.letters).toBeGreaterThanOrEqual(0)
  await expect(page.locator('.ac-lesson-card').first().locator('.ac-lesson-card__badge')).not.toHaveText('Başlanmayıb')
  expectCleanConsole(consoleProblems)
})

test('irəliləyiş bərpa olunur: "Davam et" tamamlanmamış dərsə aparır', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => localStorage.setItem('arabic_course_v1', JSON.stringify({ best: { letters: 100, harakat: 80 }, last: 'harakat' })))
  await page.goto('/learn-arabic')
  await settle(page)
  await expect(page.locator('.ac-progress__num')).toHaveText('50%')
  await expect(page.locator('.ac-lesson-card.is-done')).toHaveCount(2)
  await page.getByRole('link', { name: /Davam et/ }).click()
  await expect(page).toHaveURL(/#reading$/)
  await expect(lessonSection(page).getByRole('heading', { level: 2 })).toHaveText('Hecalar və oxu')
  expectCleanConsole(consoleProblems)
})

test('pozuq yaddaş səhifəni çökdürmür', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => localStorage.setItem('arabic_course_v1', '{pozuq'))
  await page.goto('/learn-arabic')
  await settle(page)
  await expect(page.locator('.ac-progress__num')).toHaveText('0%')
  expectCleanConsole(consoleProblems)
})

for (const [prefix, h1, dir] of [
  ['/en', 'Learn the Arabic alphabet and Quran reading', 'ltr'],
  ['/ru', 'Арабский алфавит и чтение Корана', 'ltr'],
  ['/tr', 'Arap alfabesini ve Kur’an okumayı öğren', 'ltr'],
  ['/ar', 'تعلّم الحروف العربية وقراءة القرآن', 'rtl'],
]) {
  test(`${prefix}/learn-arabic: başlıq doğma dildə, istiqamət ${dir}`, async ({ page, consoleProblems }) => {
    await page.goto(`${prefix}/learn-arabic#tajweed`)
    await settle(page)
    await expect(page.locator('h1')).toHaveText(h1)
    await expect(page.locator('html')).toHaveAttribute('dir', dir)
    await expect(page.locator('.ac-rule').first()).toBeVisible()
    expectCleanConsole(consoleProblems)
  })
}
