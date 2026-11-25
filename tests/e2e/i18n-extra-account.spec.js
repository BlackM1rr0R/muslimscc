// ═══════════════════════════════════════════════════════
// Əlavə dillərdə (src/i18n/<dil>.json) hesab səhifələri — /de, /fa (RTL)
//   • /de/account, /fa/account (girişli): html[lang], dir, h1, lüğətdən gələn yazılar
//   • /de/together#c=1: çağırış lövhəsi — say mətnləri tam ifadə kimi tərcümə olunur
//   • /de/dua-wall: başlıq, "Anonim" (girişsiz)
//   • heç birində azərbaycanca yazı (ə) yoxdur; konsol təmizdir
// Server yoxdur: fikstürlərin standart saxtaları + userAuth.js / togetherApi.js.
//
// QEYD (B2 2.8): "2 members" kimi `${n} ${n === 1 ? 'x' : 'xs'}` say mətnləri hələ tam ifadə açarı deyil,
// əlavə dillərdə ingiliscə qalır. Həmin yoxlamalar test.fixme-dir — B2-nin plural açarları və
// tərcüməçi keçidi birləşəndən sonra fixme götürülür.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'
import { createTogetherServer, attachTogether } from './togetherApi.js'

const AZ = /[əƏ]/u
const bakuToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku' }).format(new Date())
const ME = { id: 12, label: 'Ana' }

async function signedIn(page) {
  // Ad azərbaycanca hərfsiz — "ə yoxdur" yoxlaması istifadəçi məlumatına düşməsin
  await fakeUserSession(page, { signedIn: true, user: { id: ME.id, displayName: 'Ali', email: 'u12@example.com' } })
  await setLoginHint(page)
}

function seedChallenge(S) {
  const today = bakuToday()
  S.challenges.push({
    id: 1, template: 'khatm', n: null, title: '', startOn: today, days: 30,
    endOn: new Date(Date.parse(`${today}T12:00:00Z`) + 29 * 864e5).toISOString().slice(0, 10),
    owner: 12, members: [12, 13], ticks: { 13: [today] }, remind: {}, juz: { 2: { uid: 13, done: true }, 3: { uid: 12, done: false } },
  })
  S.nextId = 10
}

async function openChallenge(page) {
  const S = createTogetherServer()
  seedChallenge(S)
  await signedIn(page)
  await attachTogether(page, S, ME)
  await page.goto('/de/together#c=1')
  await expect(page.getByTestId('ch-board')).toBeVisible()
  return S
}

for (const [lang, dir, sessions, signOut] of [['de', 'ltr', 'Sitzungen', 'Abmelden'], ['fa', 'rtl', 'نشست‌ها', 'خروج']]) {
  test(`/${lang}/account: dil, istiqamət, lüğət yazıları; azərbaycanca yazı yoxdur`, async ({ page, consoleProblems }) => {
    await signedIn(page)
    await page.goto(`/${lang}/account`)
    await expect(page.getByRole('heading', { level: 1, name: 'Ali' })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('html')).toHaveAttribute('dir', dir)
    await expect(page.locator('main')).toContainText(sessions)
    await expect(page.getByRole('button', { name: signOut }).first()).toBeVisible()
    await settle(page)
    const text = await page.locator('main').innerText()
    expect(text).not.toMatch(AZ)
    // seoApply.js tənbəldir — noindex bir az sonra yazılır; bir dəfəlik oxu yox, gözləyən yoxlama
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    expectCleanConsole(consoleProblems)
  })
}

test('/de/together#c=1: lövhə almanca, say mətnləri ifadə kimi; azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  await openChallenge(page)
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('heading', { level: 1, name: 'Gruppen-Challenges' })).toBeVisible()
  // "Today {0} of {1} did it" / "{0} of 30 juz read" — şablon açarları (src/i18n/de.json)
  await expect(page.getByTestId('ch-board')).toContainText('Heute haben es 1 von 2 geschafft')
  await expect(page.getByTestId('ch-juz')).toContainText('1 von 30 Dschuz gelesen')
  await expect(page.locator('main')).toContainText('30 Tage')
  expect(await page.locator('main').innerText()).not.toMatch(AZ)
  expectCleanConsole(consoleProblems)
})

// B2 2.8 (whole-phrase plural keys) + translator pass gözlənilir: hazırda "2 members" ingiliscə qalır.
test.fixme('/de/together#c=1: üzv sayı tam ifadə kimi tərcümə olunub ("2 members" yox)', async ({ page }) => {
  await openChallenge(page)
  const main = page.locator('main')
  await expect(main).not.toContainText(/\b\d+ members?\b/)
  await expect(main).toContainText(/2 Mitglieder/)
})

test('/de/dua-wall (girişsiz): başlıq, "Anonym", azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  await page.route((u) => u.pathname === '/api/dua-wall', (route) => (route.request().method() === 'GET'
    ? route.fulfill({ json: { items: [{ id: 5, body: 'Bitte betet für meine Mutter', name: '', lang: 'de', prayed: 3, at: Date.now() }], next: null } })
    : route.fulfill({ status: 401, json: { error: 'unauthenticated', code: 'unauthenticated' } })))
  await page.goto('/de/dua-wall')
  await expect(page.getByRole('heading', { level: 1, name: 'Dua-Wand' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByTestId('dw-card')).toContainText('Anonym')
  await settle(page)
  expect(await page.locator('main').innerText()).not.toMatch(AZ)
  expectCleanConsole(consoleProblems)
})
