// ═══════════════════════════════════════════════════════
// D mərhələsi — UI axınları:
//   • "Birlikdə Quran oxu": iki brauzer konteksti — aparıcı vərəqi çevirir → qonaq izləyir; ayə işarəsi qonaqda parlayır
//   • Profillər: iki profil — hər birinin irəliləyişi ayrıdır, keçiddən sonra məlumat itmir
//   • Ailə dairəsi: dəvət keçidi → ikinci hesab qoşulur → xülasə paylaşır → valideyn lövhədə görür, kart göndərir
//   • "Məni yoxla": sahib keçid yaradır → yoxlayan (girişsiz) səhv işarələyir → sahib nəticəni görür, SRS-ə düşür
//   • /en: azərbaycanca yazı yoxdur; axe (işıqlı/qaranlıq)
// Server yoxdur: tests/e2e/socialApi.js (yaddaşda, iki kontekst arasında ortaq).
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'
import { createRtServer, attachRt, createFamilyServer, attachFamily, FAMILY_TOKEN, createCheckServer, attachChecks, CHECK_TOKEN } from './socialApi.js'

// Quran.com səhifə cavabı — yer tutucu sözlərlə (mushaf-curl.spec.js ilə eyni forma)
function fakePage(n) {
  const words = []
  let pos = 1
  for (let line = 1; line <= 15; line++) {
    for (let k = 0; k < 5; k++) words.push({ position: pos++, line_number: line, page_number: n, char_type_name: 'word', text_uthmani: 'كلمة', translation: { text: `w${pos}` }, transliteration: { text: 'kalima' } })
  }
  words.push({ position: pos, line_number: 15, page_number: n, char_type_name: 'end', text_uthmani: '١' })
  return { verses: [{ verse_key: `2:${n + 10}`, juz_number: 1, rub_el_hizb_number: 1, words }] }
}
const mushafMock = (p) => p.route(/api\.quran\.com\/api\/v4\/verses\/by_page\/\d+/, (route) => route.fulfill({ json: fakePage(Number(route.request().url().match(/by_page\/(\d+)/)[1])) }))
const ls = (p, k) => p.evaluate((key) => localStorage.getItem(key), k)
const guestContext = (browser, info, extra = {}) => browser.newContext({ baseURL: info.project.use.baseURL, locale: 'az-AZ', timezoneId: 'Asia/Baku', serviceWorkers: 'block', reducedMotion: 'reduce', ...extra })
const quietApi = (p) => p.route((u) => /^\/api\/(content|singletons|push|ummah)(\/|$)/.test(u.pathname), (r) => r.fulfill({ json: r.request().url().includes('/version') ? { version: 0, collections: {} } : null }))

test('birlikdə oxu: aparıcı vərəqi çevirir → qonaq izləyir; işarələnən ayə qonaqda parlayır', async ({ page, browser, consoleProblems }, info) => {
  const S = createRtServer()
  await fakeUserSession(page, { signedIn: true, user: { displayName: 'Aparıcı Əli' } })
  await setLoginHint(page)
  await attachRt(page, S, { owner: 12 })
  await mushafMock(page)
  // Mushaf səhifəsindəki giriş düyməsi cari səhifəni ötürür
  await page.goto('/mushaf?p=51')   // tək səhifə: iki səhifəli görünüşdə də sağ vərəq 51-dir
  await settle(page)
  await page.getByTestId('mp-together').click()
  await expect(page).toHaveURL(/\/read-together\?p=51/)
  const create = page.getByTestId('rt-create')
  await expect(create.getByLabel('Başlanğıc səhifə')).toHaveValue('51')
  await create.getByLabel('Otağın adı (istəyə bağlı)').fill('Ailə oxusu')
  await create.getByRole('button', { name: 'Otaq yarat' }).click()
  await expect(page.getByTestId('rt-room')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ailə oxusu' })).toBeVisible()
  const link = await page.getByTestId('rt-invite-link').inputValue()
  expect(link).toMatch(/\/read-together#j=[A-Za-z0-9_-]{22}$/)
  expect(new URL(page.url()).hash).toMatch(/^#r=[a-z0-9]{10}$/)

  // ── Qonaq: ayrıca kontekst, hesabsız ──
  const ctx = await guestContext(browser, info)
  const guest = await ctx.newPage()
  await quietApi(guest)
  await attachRt(guest, S)
  await mushafMock(guest)
  await guest.goto(link.replace(/^https?:\/\/[^/]+/, ''))
  const join = guest.getByTestId('rt-join')
  await join.getByLabel('Adınız (ləqəb)').fill('Qonaq Ayşə')
  await join.getByRole('button', { name: 'Qoşul' }).click()
  await expect(guest.getByTestId('rt-room')).toBeVisible()
  await expect(guest.getByTestId('rt-view-page')).toHaveText('51')
  await expect(guest.getByTestId('rt-next')).toBeDisabled()          // qonaq (izləyir) vərəq çevirə bilmir
  await expect(page.locator('.rt-people')).toContainText('Qonaq Ayşə')

  // Aparıcı növbəti səhifəyə keçir → qonaq izləyir
  await page.getByTestId('rt-next').click()
  await expect(page.getByTestId('rt-view-page')).toHaveText('52')
  await expect(guest.getByTestId('rt-view-page')).toHaveText('52', { timeout: 10_000 })
  // Aparıcı ayəni işarələyir (klaviatura ilə əlçatan siyahı) → qonaqda parlayır
  await page.getByTestId('rt-mark-select').selectOption('2:62')
  await expect(guest.locator('.rt-stage [data-ak="2:62"].is-glow').first()).toBeVisible({ timeout: 10_000 })
  // Qonaq "izləmə"ni söndürür → özü gəzir; geri qayıdır
  await guest.getByTestId('rt-follow').uncheck()
  await guest.getByTestId('rt-prev').click()
  await expect(guest.getByTestId('rt-view-page')).toHaveText('51')
  await guest.getByTestId('rt-back').click()
  await expect(guest.getByTestId('rt-view-page')).toHaveText('52')
  expect(S.actions.filter((a) => a.type === 'page').map((a) => [a.by, a.page])).toEqual([['Aparıcı Əli', 52]])
  // Qonaq çıxır
  await guest.getByTestId('rt-leave').click()
  await expect(guest.getByTestId('rt-ended')).toContainText('Siz bu otaqdan çıxdınız.')
  expect(S.csrfMissing).toEqual([])
  await ctx.close()
  expectCleanConsole(consoleProblems)
})

test('profillər: iki profilin irəliləyişi ayrıdır; keçiddə məlumat itmir; başlıq menyusundan keçid', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { displayName: 'Ana' } })
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('muslim_cc_storybooks', JSON.stringify({ 'b-ana': 4, __last: 'b-ana' }))
    localStorage.setItem('hifz_srs', JSON.stringify({ v: 1, items: {}, log: {}, goal: 5 }))
  })
  await page.goto('/account')
  const sec = page.getByTestId('profiles-section')
  await expect(sec.getByRole('heading', { name: 'Profillər' })).toBeVisible()
  await sec.getByLabel('Sizin profilinizin adı').fill('Ana')
  await sec.getByLabel('İkinci profil (məs. uşaq) — istəyə bağlı').fill('Ali')
  await sec.getByRole('button', { name: 'Profilləri aç' }).click()
  await expect(sec.getByTestId('profile-Ana')).toContainText('Aktiv')
  // Aliyə keç → səhifə yenilənir, Alinin iş nüsxəsi boşdur
  await Promise.all([page.waitForEvent('load'), sec.getByRole('button', { name: 'Bu profilə keç: Ali' }).click()])
  await expect(page.getByTestId('profile-Ali')).toContainText('Aktiv')
  expect(await ls(page, 'muslim_cc_storybooks')).toBeNull()
  await page.evaluate(() => localStorage.setItem('muslim_cc_storybooks', JSON.stringify({ 'b-ali': 1, __last: 'b-ali' })))
  // Başlıq menyusundan Anaya qayıt (geniş ekranda başlıqda, dar ekranda isə hesab səhifəsindən)
  const hdr = page.getByTestId('hdr-account')
  if (await hdr.isVisible() && info_isDesktop(page)) {
    await hdr.click()
    await Promise.all([page.waitForEvent('load'), page.getByTestId('hdr-profiles').getByRole('button', { name: /Ana/ }).click()])
  } else {
    await Promise.all([page.waitForEvent('load'), page.getByTestId('profiles-section').getByRole('button', { name: 'Bu profilə keç: Ana' }).click()])
  }
  await expect(page.getByTestId('profile-Ana')).toContainText('Aktiv')
  expect(JSON.parse(await ls(page, 'muslim_cc_storybooks'))).toMatchObject({ 'b-ana': 4 })
  // Alinin məlumatı öz ad sahəsində qalıb; ortaq açarlar (dil) toxunulmayıb
  const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('mcc_profile:')))
  expect(keys.some((k) => k.endsWith(':muslim_cc_storybooks'))).toBe(true)
  const aliBooks = await page.evaluate(() => {
    const reg = JSON.parse(localStorage.getItem('mcc_profiles'))
    const ali = reg.list.find((p) => p.name === 'Ali')
    return localStorage.getItem(`mcc_profile:${ali.id}:muslim_cc_storybooks`)
  })
  expect(JSON.parse(aliBooks)).toMatchObject({ 'b-ali': 1 })
  expectCleanConsole(consoleProblems)
})
const info_isDesktop = (page) => (page.viewportSize()?.width || 0) >= 1440

test('ailə dairəsi: dəvət → qoşulma → xülasə paylaşma → valideyn görür və kart göndərir', async ({ page, browser, consoleProblems }, info) => {
  const S = createFamilyServer()
  await fakeUserSession(page, { signedIn: true, user: { id: 12, displayName: 'Ana' } })
  await attachFamily(page, S, { id: 12, label: 'Ana' })
  await page.goto('/account')
  const fam = page.getByTestId('family-section')
  await fam.getByTestId('family-create').click()
  await fam.getByTestId('family-invite').click()
  const link = await fam.getByTestId('family-invite-link').inputValue()
  expect(link).toMatch(new RegExp(`/account#family=${FAMILY_TOKEN}$`))

  // ── Uşağın öz hesabı (ayrıca kontekst) ──
  const ctx = await guestContext(browser, info)
  const kid = await ctx.newPage()
  await quietApi(kid)
  await fakeUserSession(kid, { signedIn: true, user: { id: 13, displayName: 'Ali', email: 'ali@example.com' } })
  await attachFamily(kid, S, { id: 13, label: 'Ali' })
  await kid.addInitScript(() => { try { localStorage.setItem('muslim_cc_storybooks', JSON.stringify({ a: 2, b: 5, c: 0 })) } catch { /* */ } })
  await kid.goto(link.replace(/^https?:\/\/[^/]+/, ''))
  const kf = kid.getByTestId('family-section')
  await expect(kf.getByTestId('family-join')).toContainText('Ana sizi ailə dairəsinə dəvət edir.')
  await kf.getByRole('button', { name: 'Qoşul' }).click()
  await expect(kf.getByText('Ailə dairəsinə qoşuldunuz.')).toBeVisible()
  // Paylaşma: razılıqsız göndərilmir
  const share = kf.getByTestId('family-share')
  await expect(share).toContainText('Açılan nağıl kitabları: 3')
  await share.getByTestId('family-share-save').click()
  await expect(share.getByText('Davam etmək üçün razılığı təsdiqləyin.')).toBeVisible()
  await share.getByTestId('family-consent').check()
  await share.getByTestId('family-share-save').click()
  await expect(kf.getByText('Paylaşıldı.')).toBeVisible()
  expect(S.bodies['13 PUT /api/family/share']).toEqual({ fields: ['quranDaysWeek', 'storybooksRead'], stats: { quranDaysWeek: 0, storybooksRead: 3 }, consent: true })

  // ── Ana: lövhədə Alinin rəqəmləri; kart göndərir ──
  await page.reload()
  const members = page.getByTestId('family-members')
  await expect(members).toContainText('Ali')
  await expect(members).toContainText('Açılan nağıl kitabları')
  await expect(members).toContainText('3')
  const form = page.getByTestId('family-card-form')
  await form.getByTestId('family-card-template').selectOption('letters')
  await form.getByLabel('Rəqəm (istəyə bağlı)').fill('3')
  await form.getByTestId('family-card-send').click()
  await expect(page.getByText('Kart göndərildi.')).toBeVisible()
  expect(S.cards[0]).toMatchObject({ to: 13, template: 'letters', n: 3 })

  // ── Ali kartı görür (bildiriş + siyahı) ──
  await kid.reload()
  await expect(kid.getByTestId('family-toast')).toContainText('Sizə yeni təşviq kartı gəlib!')
  await expect(kid.getByTestId('family-cards')).toContainText('Bu gün 3 hərf öyrəndin, maşaAllah!')
  await expect(kid.getByTestId('family-cards')).toContainText('Ana göndərdi')
  expect(S.csrfMissing).toEqual([])
  await ctx.close()
  expectCleanConsole(consoleProblems)
})

test('məni yoxla: sahib keçid yaradır → yoxlayan səhv işarələyir → sahib nəticəni görür, SRS-ə düşür', async ({ page, browser, consoleProblems }, info) => {
  const S = createCheckServer()
  await fakeUserSession(page, { signedIn: true, user: { displayName: 'Yusif' } })
  await setLoginHint(page)
  await attachChecks(page, S)
  await page.goto('/hifz')
  const sec = page.getByTestId('hc-owner')
  await sec.scrollIntoViewIfNeeded()
  await sec.getByLabel('Surə').selectOption('1')
  await sec.getByLabel('Ayədən').fill('2')
  await sec.getByLabel('Ayəyə qədər').fill('5')
  await expect(sec.getByLabel('Yoxlayana görünəcək adınız')).toHaveValue('Yusif')
  await sec.getByTestId('hc-create').click()
  const link = await sec.getByTestId('hc-link').inputValue()
  expect(link).toMatch(new RegExp(`/hifz-test#t=${CHECK_TOKEN}$`))
  expect(S.bodies['POST /api/hifz-tests']).toEqual({ surah: 1, from: 2, to: 5, name: 'Yusif' })

  // ── Yoxlayan (girişsiz, ayrıca kontekst) ──
  const ctx = await guestContext(browser, info)
  const tester = await ctx.newPage()
  await quietApi(tester)
  await attachChecks(tester, S)
  await tester.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, (route) => route.fulfill({ json: { code: 200, status: 'OK', data: [{ number: 1, ayahs: Array.from({ length: 7 }, (_, i) => ({ number: i + 1, numberInSurah: i + 1, text: `كلمة${i + 1} ثانية ثالثة` })) }] } }))
  await tester.goto(link.replace(/^https?:\/\/[^/]+/, ''))
  await expect(tester.getByRole('heading', { level: 1 })).toContainText('Yusif əzbərdən oxuyur')
  const list = tester.getByTestId('hc-ayahs')
  await expect(list.locator('li')).toHaveCount(4)                      // yalnız 2–5
  await expect(tester.getByTestId('hc-ayah-1')).toHaveCount(0)
  await tester.getByTestId('hc-ayah-3').getByRole('button', { name: 'Səhv' }).click()
  await tester.getByTestId('hc-ayah-4').getByRole('button', { name: 'Tərəddüd' }).click()
  await tester.getByTestId('hc-word-mode').check()
  await tester.getByTestId('hc-ayah-3').getByRole('button', { name: 'ثانية' }).click()
  await expect(tester.getByTestId('hc-count')).toHaveText('Səhv: 1 · Tərəddüd: 1')
  await tester.getByTestId('hc-submit').click()
  await tester.getByTestId('hc-confirm').click()
  await expect(tester.getByTestId('hc-done')).toContainText('Göndərildi.')
  expect(S.bodies['POST /api/hifz-tests/submit']).toEqual({ token: CHECK_TOKEN, marks: [{ a: 3, kind: 'mistake', words: [2] }, { a: 4, kind: 'hesitation' }] })
  await ctx.close()

  // ── Sahib: nəticə + SRS idxalı ──
  await page.reload()
  const sec2 = page.getByTestId('hc-owner')
  await sec2.scrollIntoViewIfNeeded()
  await expect(sec2.getByTestId('hc-imported')).toHaveText('Səhvli ayələr təkrar planınıza əlavə olundu.')
  await expect(sec2.getByTestId('hc-test-1')).toContainText('Səhv: 1')
  await expect(sec2.getByTestId('hc-test-1')).toContainText('Ayə 3: Səhv (sözlər: 2)')
  const srs = JSON.parse(await ls(page, 'hifz_srs'))
  expect(srs.items['1:3']).toMatchObject({ interval: 0, lapses: 1 })
  expect(srs.items['1:4'].interval).toBeLessThanOrEqual(1)
  expect(JSON.parse(await ls(page, 'hifz_tests_v1'))).toEqual({ imported: [1] })
  // ikinci yükləmədə yenidən idxal olunmur
  await page.reload()
  await page.getByTestId('hc-owner').scrollIntoViewIfNeeded()
  await expect(page.getByTestId('hc-tests')).toBeVisible()
  await expect(page.getByTestId('hc-imported')).toHaveCount(0)
  expect(S.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('yanlış / köhnə keçidlər: otaq bitib, yoxlama keçidi yanlışdır, girişsiz lobbi', async ({ page, consoleProblems }) => {
  await page.goto('/read-together')
  await expect(page.getByTestId('rt-signin')).toContainText('Otaq yaratmaq üçün daxil olun.')
  await page.goto('/read-together#r=abcdefghij')
  await expect(page.getByTestId('rt-ended')).toContainText('Otaq bağlanıb')
  await page.goto('/hifz-test#t=' + 'Z'.repeat(43))
  await expect(page.getByTestId('hc-error')).toContainText('Keçid yanlışdır və ya silinib.')
  await page.goto('/hifz-test')
  await expect(page.getByTestId('hc-error')).toContainText('Keçid tam deyil')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  expectCleanConsole(consoleProblems)
})

test('/en: yeni bölmələrdə azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { displayName: 'Ali' } })
  await setLoginHint(page)
  await page.goto('/en/account')
  await expect(page.getByRole('heading', { name: 'Profiles' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Family circle' })).toBeVisible()
  for (const id of ['profiles-section', 'family-section', 'rt-account']) {
    expect(await page.getByTestId(id).innerText(), id).not.toMatch(/[əƏ]|Profillər|Ailə|Birlikdə/)
  }
  await page.goto('/en/read-together')
  await expect(page.getByTestId('rt-create')).toBeVisible()
  expect(await page.locator('main').innerText()).not.toMatch(/[əƏ]/)
  await page.goto('/en/hifz')
  await page.getByTestId('hc-owner').scrollIntoViewIfNeeded()
  expect(await page.getByTestId('hc-owner').innerText()).not.toMatch(/[əƏ]|Məni yoxla/)
  await page.goto('/en/hifz-test#t=' + 'Z'.repeat(43))
  await expect(page.getByTestId('hc-error')).toContainText('The link is invalid')
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`axe: otaq, yoxlama və hesab bölmələri (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
    const S = createRtServer()
    await fakeUserSession(page, { signedIn: true, user: { displayName: 'Ali' } })
    await setLoginHint(page)
    await attachRt(page, S, { owner: 12 })
    await mushafMock(page)
    const axe = async (include) => {
      await settle(page)
      let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      for (const sel of include) b = b.include(sel)
      const { violations } = await b.analyze()
      return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').flatMap((v) => v.nodes.map((n) => `${v.id} · ${n.target.join(' ')}`))
    }
    await page.goto('/read-together?p=3')
    await expect(page.getByTestId('rt-create')).toBeVisible()
    expect(await axe(['main'])).toEqual([])
    await page.getByTestId('rt-create').getByRole('button', { name: 'Otaq yarat' }).click()
    await expect(page.locator('.rt-stage .mp-word').first()).toBeVisible()
    expect(await axe(['.rt-room'])).toEqual([])

    const C = createCheckServer()
    await attachChecks(page, C)
    C.tests.push({ id: 1, surah: 1, from: 1, to: 3, name: 'Ali', createdAt: 1, expiresAt: Date.now() + 864e5, status: 'open', result: null })
    await page.goto('/hifz-test#t=' + CHECK_TOKEN)
    await expect(page.getByTestId('hc-ayahs')).toBeVisible()
    await page.getByTestId('hc-ayah-2').getByRole('button', { name: 'Səhv' }).click()
    expect(await axe(['main'])).toEqual([])

    await page.goto('/account')
    await page.getByTestId('profiles-section').getByRole('button', { name: 'Profilləri aç' }).click()
    await page.getByTestId('family-section').getByTestId('family-create').waitFor()
    expect(await axe(['#profiles', '#family', '#read-together'])).toEqual([])
  })
}
