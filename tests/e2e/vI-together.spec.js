// ═══════════════════════════════════════════════════════
// I mərhələsi — UI axınları:
//   • Qrup çağırışı: yarat (razılıq) → dəvət keçidi → ikinci hesab qoşulur → hər kəs öz gününü işarələyir →
//     lövhədə YALNIZ toplu say (ad yoxdur)
//   • Müəllim sinfi: sinif → dəvət → şagird qoşulur (razılıqsız) → müəllim fərdi vəziyyəti görmür →
//     şagird razılıqla paylaşır → müəllim görür; "Məni yoxla" keçidi
//   • Ailə Ramazan lövhəsi (saxta Ramazan tarixi): rəqəmlər (razılıq), cüz, iftar, son on gecə; bağlı mövsüm
//   • Təqvim axını: bölmələr, razılıq, https + webcal keçidi, kopyala, yenilə, söndür
//   • /en: azərbaycanca yazı yoxdur; axe (işıqlı/qaranlıq)
// Server yoxdur: tests/e2e/togetherApi.js (yaddaşda, iki kontekst arasında ortaq).
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'
import { createTogetherServer, attachTogether, attachRamadan, CH_TOKEN, CLS_TOKEN } from './togetherApi.js'

const guestContext = (browser, info) => browser.newContext({ baseURL: info.project.use.baseURL, locale: 'az-AZ', timezoneId: 'Asia/Baku', serviceWorkers: 'block', reducedMotion: 'reduce' })
const quietApi = (p) => p.route((u) => /^\/api\/(content|singletons|push|ummah|personal|family|hifz-tests|read-together|khatm)(\/|$)/.test(u.pathname), (r) => r.fulfill({ json: r.request().url().includes('/version') ? { version: 0, collections: {} } : null }))
const bakuToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date())
const ANA = { id: 12, label: 'Ana Leyla' }
const ALI = { id: 13, label: 'Şagird Əli' }

async function signedIn(page, S, who) {
  await fakeUserSession(page, { signedIn: true, user: { id: who.id, displayName: who.label, email: `u${who.id}@example.com` } })
  await setLoginHint(page)
  await attachTogether(page, S, who)
}
async function secondUser(browser, info, S, who) {
  const ctx = await guestContext(browser, info)
  const p = await ctx.newPage()
  await quietApi(p)
  await signedIn(p, S, who)
  return { ctx, p }
}

test('qrup çağırışı: yarat → dəvət → qoşul → işarələ → lövhədə yalnız toplu say', async ({ page, browser, consoleProblems }, info) => {
  const S = createTogetherServer()
  await signedIn(page, S, ANA)
  await page.goto('/account')
  const sec = page.getByTestId('challenges-section')
  await expect(sec).toContainText('Hələ heç bir çağırışda deyilsiniz.')
  await sec.getByTestId('challenge-new').click()
  await sec.getByTestId('challenge-template').selectOption('quran_pages')
  await sec.getByLabel('Gündə neçə səhifə').fill('3')
  await sec.getByTestId('challenge-create').click()
  await expect(sec.getByRole('alert')).toContainText('razılığınızı')            // razılıqsız yaradılmır
  await sec.getByTestId('challenge-consent').check()
  await sec.getByTestId('challenge-create').click()
  await expect(page.getByTestId('ch-board')).toBeVisible()
  await expect(page).toHaveURL(/\/together#c=1$/)                               // dəvət tokeni URL-dən silinir
  await expect(page.getByRole('heading', { name: 'Hər gün 3 səhifə Quran' })).toBeVisible()
  const link = await page.getByTestId('ch-invite-link').inputValue()
  expect(link).toMatch(new RegExp(`/together#cj=${CH_TOKEN}$`))
  await expect(page.getByTestId('ch-today')).toContainText('Bu gün 1 nəfərdən 0-i etdi')
  const created = S.bodies.find((x) => x.method === 'POST' && x.pathname === '/api/challenges')
  expect(created.body).toMatchObject({ template: 'quran_pages', n: 3, days: 30, consent: true, tz: 'Asia/Baku', startOn: bakuToday() })

  // ── İkinci hesab qoşulur ──
  const { ctx, p: member } = await secondUser(browser, info, S, ALI)
  await member.goto(link.replace(/^https?:\/\/[^/]+/, ''))
  const join = member.getByTestId('ch-join')
  await expect(join).toContainText('Hər gün 3 səhifə Quran')
  await join.getByTestId('ch-join-btn').click()
  await expect(join.getByRole('alert')).toContainText('razılığınızı')
  await join.getByTestId('ch-join-consent').check()
  await join.getByTestId('ch-join-btn').click()
  await expect(member.getByTestId('ch-board')).toBeVisible()
  await expect(member).toHaveURL(/\/together#c=1$/)
  await member.getByTestId('ch-tick').click()
  await expect(member.getByTestId('ch-today')).toContainText('Bu gün 2 nəfərdən 1-i etdi')
  await expect(member.getByTestId('ch-untick')).toBeVisible()
  await expect(member.getByTestId('ch-invite')).toHaveCount(0)                  // dəvət yalnız sahibdə
  await ctx.close()

  // ── Sahib: toplu say görünür, üzvün adı YOX ──
  await page.reload()
  await expect(page.getByTestId('ch-today')).toContainText('Bu gün 2 nəfərdən 1-i etdi')
  await page.getByTestId('ch-tick').click()
  await expect(page.getByTestId('ch-today')).toContainText('Bu gün 2 nəfərdən 2-i etdi')
  await expect(page.getByTestId('ch-day-1')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('ch-day-1')).toHaveAccessibleName(/1-ci gün, .*: 2 nəfərdən 2-i etdi, siz də/)
  await expect(page.getByTestId('ch-day-2')).toBeDisabled()                     // gələcək gün işarələnmir
  expect(await page.getByTestId('ch-board').innerText()).not.toContain(ALI.label)
  // Xatırlatma saatı
  await page.getByLabel('Xatırlatma saatı').fill('20:30')
  await page.getByTestId('ch-reminder').getByRole('button', { name: 'Yadda saxla' }).click()
  await expect(page.getByText('Xatırlatma yadda saxlanıldı.')).toBeVisible()
  expect(S.bodies.find((x) => x.method === 'PATCH').body).toMatchObject({ remindAt: '20:30', tz: 'Asia/Baku' })
  // Hesab səhifəsində siyahı
  await page.goto('/account')
  await expect(page.getByTestId('challenges-list')).toContainText('Bu gün 2 nəfərdən 2-i etdi · Bu gün işarələmisiniz')
  expect(S.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('müəllim sinfi: tapşırıq → şagird qoşulur → fərdi vəziyyət yalnız razılıqla → "Məni yoxla"', async ({ page, browser, consoleProblems }, info) => {
  const S = createTogetherServer()
  await signedIn(page, S, ANA)
  await page.goto('/account')
  const sec = page.getByTestId('classes-section')
  await sec.getByLabel('Sinfin adı (ən çox 60 simvol)').fill('Hifz qrupu')
  await sec.getByTestId('class-create').click()
  await expect(page.getByTestId('cls-teacher')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Hifz qrupu' })).toBeVisible()
  const link = await page.getByTestId('cls-invite-link').inputValue()
  expect(link).toMatch(new RegExp(`/together#kj=${CLS_TOKEN}$`))
  await page.getByLabel('Sinif üçün qeyd (ən çox 200 simvol)').fill('Cümə günü dərs 18:00-da')
  await page.getByRole('button', { name: 'Qeydi yadda saxla' }).click()
  await expect(page.getByText('Qeyd yadda saxlanıldı.')).toBeVisible()
  const form = page.getByTestId('cls-assignment-form')
  await form.getByLabel('Surə').selectOption('67')
  await form.getByLabel('Ayədən').fill('1')
  await form.getByLabel('Ayəyə').fill('10')
  await form.getByTestId('cls-add-assignment').click()
  await expect(page.getByTestId('cls-assignments')).toContainText(/Əzbərlə: .+, 1–10 ayələr/)

  // ── Şagird qoşulur (razılıqsız) və tapşırığı edir ──
  const { ctx, p: st } = await secondUser(browser, info, S, ALI)
  await st.goto(link.replace(/^https?:\/\/[^/]+/, ''))
  await expect(st.getByTestId('cls-join')).toContainText('«Hifz qrupu» — müəllim: Ana Leyla')
  await st.getByTestId('cls-join-btn').click()
  await expect(st.getByTestId('cls-student')).toBeVisible()
  await expect(st.getByTestId('cls-note')).toContainText('Cümə günü dərs 18:00-da')
  const aid = S.classes[0].assignments[0].id
  await st.getByTestId(`cls-done-${aid}`).click()
  await expect(st.getByTestId('cls-assignments')).toContainText('Edildi')

  // ── Müəllim: şagird paylaşmır → yalnız ad ──
  await page.reload()
  const row = page.getByTestId(`cls-student-${ALI.id}`)
  await expect(row).toContainText('Şagird Əli')
  await expect(row).toContainText('Paylaşmır')
  await expect(row.locator('.fam-stats')).toHaveCount(0)
  await expect(page.getByTestId('cls-assignments')).toContainText('Paylaşan 0 şagirddən 0-i etdi')

  // ── Şagird razılıqla paylaşır ──
  await st.getByTestId('cls-share-btn').click()
  await expect(st.getByTestId('cls-share').getByRole('alert')).toContainText('razılığınızı')
  await st.getByTestId('cls-consent').check()
  await st.getByTestId('cls-share-btn').click()
  await expect(st.getByText('Müəllimlə paylaşıldı.')).toBeVisible()
  const share = S.bodies.find((x) => x.method === 'PUT' && x.pathname.endsWith('/share'))
  expect(Object.keys(share.body.stats).sort()).toEqual(['hifzAyahs', 'quranAyahsTotal', 'quranDaysWeek'])
  expect(share.body.consent).toBe(true)
  await ctx.close()

  await page.reload()
  await expect(row).toContainText('İrəliləyişini paylaşır')
  await expect(row).toContainText('Tapşırıqlar: 1 / 1')
  await expect(page.getByTestId('cls-assignments')).toContainText('Paylaşan 1 şagirddən 1-i etdi')
  // "Məni yoxla" — şagird üçün keçid (nəticə onun SRS-inə düşür)
  await row.getByText('"Məni yoxla" yoxlaması').click()
  await row.getByRole('button', { name: 'Yoxlama yarat' }).click()
  await expect(page.getByTestId(`cls-test-link-${ALI.id}`)).toHaveValue(/\/hifz-test#t=T{43}$/)
  await expect(row).toContainText('Açıq')
  expect(S.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('ailə Ramazan lövhəsi: razılıqla rəqəmlər, cüz, iftar, son on gecə; bağlı mövsüm', async ({ page, consoleProblems }) => {
  const S = createTogetherServer()
  await signedIn(page, S, { id: 12, label: 'Ana' })
  await attachRamadan(page, S, { id: 12, label: 'Ana' })
  await page.goto('/account')
  const sec = page.getByTestId('family-ramadan')
  await expect(sec).toContainText('Ramazanın 5-ci günü')
  const nums = sec.getByTestId('ram-numbers')
  await nums.getByLabel('Tutulan oruclar').fill('4')
  await nums.getByLabel('Bu Ramazan oxunan səhifələr').fill('30')
  await nums.getByTestId('ram-share').click()
  await expect(nums.getByRole('alert')).toContainText('razılığınızı')
  await nums.getByTestId('ram-consent').check()
  await nums.getByTestId('ram-share').click()
  await expect(sec.getByText('Paylaşıldı.')).toBeVisible()
  await expect(nums.locator('.fam-member').first()).toContainText('4')
  await expect(nums.locator('.fam-member').first()).toContainText('30')
  await expect(nums.locator('.fam-member').nth(1)).toContainText('Paylaşmayıb')   // Əli razılıq verməyib
  expect(S.bodies.find((x) => x.method === 'PUT').body).toEqual({ fasts: 4, pages: 30, consent: true })

  await sec.getByTestId('ram-khatm').getByRole('button', { name: 'Götür: 1-ci cüz' }).click()
  await expect(sec.getByTestId('ram-khatm').locator('.tg-juz__item').first()).toContainText('Ana')
  await sec.getByTestId('ram-khatm').getByRole('button', { name: 'Oxudum: 1-ci cüz' }).click()
  await expect(sec.getByTestId('ram-khatm')).toContainText('30 cüzdən 1-i oxunub')
  await sec.getByTestId('ram-host-3').click()
  await expect(sec.getByTestId('ram-iftar').locator('.rt-list__item').nth(2)).toContainText('— Ana')
  // Qutu serverin cavabı ilə idarə olunur — .check() dərhal dəyişiklik gözləyir (CI-da yük altında yıxılırdı)
  await sec.getByTestId('ram-night-27').click()
  await expect(sec.getByTestId('ram-night-27')).toBeChecked()
  await expect(sec.getByTestId('ram-qadr')).toContainText('27-ci gecə — Mən də (2 nəfərdən 1)')
  await nums.getByTestId('ram-hide').click()
  await expect(sec.getByText('Gizlədildi.')).toBeVisible()

  // Ramazandan kənar: yalnız qeyd
  await attachRamadan(page, S, { id: 12, label: 'Ana' }, { open: false })
  await page.reload()
  await expect(page.getByTestId('ram-closed')).toContainText('Ramazanın təxmini başlanğıcı')
  await expect(page.getByTestId('ram-numbers')).toHaveCount(0)
  expect(S.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('təqvim axını: bölmələr, razılıq, https və webcal keçidi, kopyala, yenilə, söndür', async ({ page, context, consoleProblems }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const S = createTogetherServer()
  await signedIn(page, S, ANA)
  await page.goto('/account')
  const sec = page.getByTestId('cal-feed')
  await sec.getByTestId('feed-cat-fasts').uncheck()
  await sec.getByTestId('feed-cat-friday').check()
  await sec.getByTestId('feed-enable').click()
  await expect(sec.getByRole('alert')).toContainText('razılığınızı')
  await sec.getByTestId('feed-consent').check()
  await sec.getByTestId('feed-enable').click()
  const https = sec.getByTestId('feed-https')
  await expect(https).toHaveValue(/^https?:\/\/[^/]+\/api\/cal\/A{43}\.ics$/)
  await expect(sec.getByTestId('feed-webcal')).toHaveValue(/^webcal:\/\/[^/]+\/api\/cal\/A{43}\.ics$/)
  await expect(sec.getByTestId('feed-urls')).toContainText('yalnız bir dəfə göstərilir')
  expect(S.bodies.find((x) => x.method === 'POST').body).toEqual({
    cats: { loved: true, friday: true, zakat: true, letters: true, fasts: false, challenges: true }, lang: 'az', consent: true,
  })
  await sec.getByTestId('feed-urls').getByRole('button', { name: 'Keçidi kopyala' }).first().click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await https.inputValue())
  // Yeni keçid — köhnə ölür (yeni token)
  await sec.getByTestId('feed-regenerate').click()
  await expect(https).toHaveValue(/\/api\/cal\/B{43}\.ics$/)
  expect(S.bodies.filter((x) => x.method === 'POST').at(-1).body.consent).toBeUndefined()
  // Bölmələri dəyiş
  await sec.getByTestId('feed-cat-letters').uncheck()
  await sec.getByTestId('feed-save').click()
  await expect(sec.getByText('Yadda saxlanıldı.')).toBeVisible()
  expect(S.feed.cats.letters).toBe(false)
  // Söndür
  await sec.getByTestId('feed-revoke').click()
  await sec.getByTestId('feed-revoke-yes').click()
  await expect(sec.getByText('Axın söndürüldü; keçid artıq işləmir.')).toBeVisible()
  await expect(sec.getByTestId('feed-enable')).toBeVisible()
  expect(S.feed).toBeNull()
  expect(S.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

function seed(S) {
  const today = bakuToday()
  S.challenges.push({ id: 1, template: 'khatm', n: null, title: '', startOn: today, days: 30, endOn: new Date(Date.parse(`${today}T12:00:00Z`) + 29 * 864e5).toISOString().slice(0, 10), owner: 12, members: [12, 13], ticks: { 13: [today] }, remind: {}, juz: { 2: { uid: 13, done: true }, 3: { uid: 12, done: false } } })
  S.classes.push({ id: 2, name: 'Hifz', note: 'Salam', teacher: 12, teacherLabel: 'Ana', assignments: [{ id: 5, kind: 'read', surah: null, from: 1, to: 2, dueOn: today, createdAt: 1 }],
    students: [{ id: 13, label: 'Əli', consent: true, done: [5], stats: { hifzAyahs: 3, quranAyahsTotal: 40, quranDaysWeek: 2 }, tests: [] }, { id: 14, label: 'Zeynəb', consent: false, done: [], stats: null, tests: [] }] })
  S.nextId = 10
}

test('/en: I bölmələrində azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  const S = createTogetherServer()
  seed(S)
  S.ramadan = { shares: {}, juz: {}, iftar: {}, qadr: {}, members: [{ id: 12, label: 'Ana' }, { id: 13, label: 'Ali' }] }   // adlar — məlumatdır, yoxlamaya düşməsin
  await signedIn(page, S, ANA)
  await attachRamadan(page, S, ANA)
  await page.goto('/en/account')
  await expect(page.getByTestId('family-ramadan')).toContainText('Ramadan, day 5')
  for (const id of ['challenges-section', 'classes-section', 'family-ramadan', 'cal-feed']) {
    expect(await page.getByTestId(id).innerText(), id).not.toMatch(/[əƏ]|Çağırış|Sinif|Təqvim/)
  }
  await page.goto('/en/together#c=1')
  await expect(page.getByTestId('ch-board')).toContainText('Today 1 of 2 did it')
  await expect(page.getByTestId('ch-juz')).toContainText('1 of 30 juz read')
  expect(await page.locator('main').innerText()).not.toMatch(/[əƏ]/)
  await page.goto('/en/together#k=2')
  await expect(page.getByTestId('cls-teacher')).toContainText('Shares progress')
  expect(await page.getByTestId('cls-teacher').innerText()).not.toMatch(/Paylaş|Tapşırıq/)
  await page.goto('/en/together#cj=' + 'Z'.repeat(43))
  await expect(page.getByTestId('tg-join-error')).toContainText('The link is invalid or has expired.')
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`axe: I bölmələri, çağırış lövhəsi və sinif (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
    const S = createTogetherServer()
    seed(S)
    await signedIn(page, S, ANA)
    await attachRamadan(page, S, ANA)
    const axe = async (include) => {
      await settle(page)
      let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      for (const sel of include) b = b.include(sel)
      const { violations } = await b.analyze()
      return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').flatMap((v) => v.nodes.map((n) => `${v.id} · ${n.target.join(' ')}`))
    }
    await page.goto('/account')
    await page.getByTestId('challenges-section').getByTestId('challenge-new').click()
    await expect(page.getByTestId('family-ramadan')).toContainText('Ramazanın 5-ci günü')
    expect(await axe(['#challenges', '#classes', '#family-ramadan', '#cal-feed'])).toEqual([])
    await page.goto('/together#c=1')
    await expect(page.getByTestId('ch-juz')).toBeVisible()
    expect(await axe(['main'])).toEqual([])
    await page.goto('/together#k=2')
    await expect(page.getByTestId('cls-roster')).toBeVisible()
    expect(await axe(['main'])).toEqual([])
  })
}
