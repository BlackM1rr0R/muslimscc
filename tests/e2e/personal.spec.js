// ═══════════════════════════════════════════════════════
// Şəxsi xatırlatmalar (server/personal.js) — UI axını:
//   • /account: gələcəyə məktub → razılıq → "gözləyənlər"də; "İndi oxu"
//   • sevdiklərim: əlavə → paylaşma keçidi (#follow=…); dəvət keçidi ilə izləmə
//   • zəkat: hesabdan sonra "xatırlat" (məbləğ susmaya görə GETMİR); girişsiz — tizer
//   • /en/account — azərbaycanca yazı yoxdur; axe (işıqlı/qaranlıq)
// Server yoxdur: /api/auth/* (userAuth.js) və /api/personal/* (personalApi.js) yaddaşda saxtadır.
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'
import { fakePersonalApi, SHARE_TOKEN, INVITE_TOKEN } from './personalApi.js'

const RATES = { date: '2026-11-10', usd: { azn: 1.7, eur: 0.9, rub: 90, try: 40, sar: 3.75, gbp: 0.8, aed: 3.67, xau: 1 / 3000, xag: 1 / 31.1034768 } }
const future = () => { const d = new Date(); d.setDate(d.getDate() + 40); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

test('məktub: razılıqla planlaşdırılır, gözləyənlərdə görünür, "İndi oxu" mətni açır', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  const api = await fakePersonalApi(page)
  await page.goto('/account')
  const sec = page.locator('#letters')
  await expect(sec.getByRole('heading', { name: 'Gələcək məktublarım' })).toBeVisible()
  await sec.getByLabel('Məktubunuz').fill('Əziz özüm, namazı qoru.')
  await sec.getByLabel('Çatdırılma tarixi').fill(future())
  await expect(sec.getByTestId('letter-arrives')).toContainText('09:00')
  const submit = sec.getByRole('button', { name: 'Məktubu planlaşdır' })
  await expect(submit).toBeDisabled()                                     // razılıq qeydi işarələnməyib
  await expect(sec.getByText('şifrəsiz saxlanır')).toBeVisible()
  await sec.getByLabel('Anladım, razıyam').check()
  await submit.click()
  await expect(sec.getByText('Məktub planlaşdırıldı.')).toBeVisible()
  const pending = sec.getByTestId('letters-pending')
  await expect(pending.locator('li')).toHaveCount(1)
  await expect(pending).not.toContainText('namazı qoru')                  // möhürlü — oxumaq üçün açılmalıdır
  await pending.getByRole('button', { name: 'İndi oxu' }).click()
  await expect(pending).toContainText('Əziz özüm, namazı qoru.')
  const body = api.bodies['POST /api/personal/letters']
  expect(body).toMatchObject({ body: 'Əziz özüm, namazı qoru.', deliverOn: future(), kind: 'date', consent: true, lang: 'az' })
  expect(typeof body.tz).toBe('string')
  // ikinci məktubda razılıq qutusu yoxdur
  await expect(sec.getByLabel('Anladım, razıyam')).toHaveCount(0)
  expect(api.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('sevdiklərim: əlavə et → paylaşma keçidi; dəvət keçidi ilə ailə siyahısını izlə', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  const api = await fakePersonalApi(page)
  await page.goto('/account')
  const sec = page.locator('#loved')
  await sec.getByLabel('Ad', { exact: true }).fill('Atam Həsən')
  await sec.getByLabel('Vəfat tarixi').fill('2018-12-20')
  await sec.getByRole('button', { name: 'Hicri' }).click()
  await sec.getByLabel('Hər Cümə də xatırlat').check()
  await sec.getByLabel('Anladım, razıyam').check()
  await sec.getByRole('button', { name: 'Əlavə et' }).click()
  await expect(sec.getByTestId('loved-list')).toContainText('Atam Həsən')
  await expect(sec.getByTestId('loved-list')).toContainText('Növbəti ildönümü')
  expect(api.bodies['POST /api/personal/loved']).toMatchObject({ name: 'Atam Həsən', passedOn: '2018-12-20', calendar: 'h', friday: true, consent: true })
  // mövcud mənbəli duaya keçid
  await expect(sec.getByRole('link', { name: /Mərhum üçün dua/ })).toHaveAttribute('href', '/learn/janazah#ls-prayer')
  await sec.getByRole('button', { name: 'Paylaşma keçidi yarat' }).click()
  await expect(sec.getByTestId('share-link')).toHaveValue(new RegExp(`/account#follow=${SHARE_TOKEN}$`))
  await expect(sec.getByRole('button', { name: /Keçidi ləğv et/ })).toBeVisible()

  // Dəvət keçidi (başqa ailə siyahısı)
  await page.goto(`/account#follow=${INVITE_TOKEN}`)
  const inv = page.getByTestId('follow-invite')
  await expect(inv).toContainText('Fatimə')
  await inv.getByRole('button', { name: 'İzlə' }).click()
  await expect(page.getByTestId('loved-following')).toContainText('Nənəm Zəhra')
  expect(api.bodies['POST /api/personal/follow']).toMatchObject({ token: INVITE_TOKEN })
  await expect.poll(() => page.evaluate(() => location.hash)).toBe('')
  expectCleanConsole(consoleProblems)
})

test('zəkat: hesabdan sonra "xatırlat" — məbləğ susmaya görə serverə getmir', async ({ page, consoleProblems }) => {
  await page.route(/currency-api@latest\/v1\/currencies\/usd\.json/, (route) => route.fulfill({ json: RATES }))
  await setLoginHint(page)
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  const api = await fakePersonalApi(page)
  await page.goto('/zakat')
  await settle(page)
  await page.getByRole('textbox', { name: 'Yığım / bank hesabı' }).fill('5000')
  const card = page.getByTestId('hawl-reminder')
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByTestId('hawl-preview')).toContainText('İl tamamlanır')
  const save = card.getByTestId('hawl-save')
  await expect(save).toBeDisabled()
  await card.getByLabel('Anladım, razıyam').check()
  await save.click()
  await expect(card.getByTestId('hawl-current')).toContainText('2027')
  const body = api.bodies['PUT /api/personal/zakat']
  expect(body).toMatchObject({ storeAmount: false, consent: true })
  expect(body.amount).toBeUndefined()
  // arxiv — yalnız bu cihazda
  await card.getByTestId('hawl-archive-save').click()
  await expect(card.getByTestId('zakat-archive')).toContainText('AZN')
  expect(await page.evaluate(() => localStorage.getItem('muslim_cc_zakat_archive'))).toContain('"currency":"AZN"')
  expectCleanConsole(consoleProblems)
})

test('girişsiz: zəkat və dua kapsulu tizer göstərir, "daxil olun" keçidi', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.route(/currency-api@latest\/v1\/currencies\/usd\.json/, (route) => route.fulfill({ json: RATES }))
  await page.goto('/zakat')
  await settle(page)
  const teaser = page.getByTestId('hawl-teaser')
  await teaser.scrollIntoViewIfNeeded()
  await expect(teaser.getByRole('link', { name: 'İstifadə üçün daxil olun' })).toHaveAttribute('href', '/login?next=%2Fzakat')
  await page.goto('/duajournal')
  await settle(page)
  // kapsul tənbəl qurulur (DeferRender) — addım-addım sürüşdür (v72.spec.js → reach)
  const lt = page.getByTestId('loved-teaser')
  for (let i = 0; i < 80 && !(await lt.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(150)
  }
  await lt.scrollIntoViewIfNeeded()
  await expect(lt.getByRole('link', { name: 'İstifadə üçün daxil olun' })).toHaveAttribute('href', '/login?next=%2Faccount%23loved')
  await expect(page.getByTestId('capsule-teaser')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('/en/account: şəxsi bölmələrdə azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await fakePersonalApi(page)
  await page.goto('/en/account')
  await expect(page.getByRole('heading', { name: 'My letters to the future' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Prayers for loved ones' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Zakat reminder' })).toBeVisible()
  for (const id of ['#letters', '#loved', '#zakat', '#acc-personal-data']) {
    const text = await page.locator(id === '#acc-personal-data' ? 'section[aria-labelledby="acc-personal-data"]' : id).innerText()
    expect(text, id).not.toMatch(/[əƏ]|Gələcək|Sevdiklərim|Zəkat/)
  }
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`axe: /account şəxsi bölmələrlə (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
    await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
    const api = await fakePersonalApi(page, { consent: { letters: true, loved: true, zakat: true } })
    api.letters.push({ id: 90, body: 'x', deliverOn: '2030-01-01', kind: 'date', status: 'pending', createdAt: Date.UTC(2026, 10, 1), deliveredAt: null },
      { id: 91, body: 'y', deliverOn: '2026-11-01', kind: 'year', status: 'delivered', createdAt: Date.UTC(2025, 10, 1), deliveredAt: Date.UTC(2026, 10, 1) })
    api.loved.push({ id: 92, name: 'Ana', relation: 'ana', passedOn: '2015-03-03', calendar: 'h', friday: true, note: 'qeyd', nextOn: null })
    api.zakat = { hawlStart: '2026-11-01', dueOn: '2027-10-21', amount: 120, currency: 'AZN' }
    await page.goto('/account')
    await expect(page.getByTestId('loved-list')).toBeVisible()
    await expect(page.getByTestId('zakat-reminder')).toBeVisible()
    await settle(page)
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).include('#letters').include('#loved').include('#zakat').analyze()
    const bad = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .flatMap((v) => v.nodes.map((n) => `${v.id} · ${n.target.join(' ')}`))
    expect(bad).toEqual([])
  })
}
