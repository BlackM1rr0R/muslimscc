// ═══════════════════════════════════════════════════════
// Hesaba bağlı, uçdan-uca şifrəli sinxronizasiya + "Davam et" kartı
//   • yeni cihazda ŞİFRƏ ilə giriş → kod brauzerdə açılır → məlumat bərpa olunur →
//     ana səhifədəki "Davam et" kartında Quran və hədis yeri görünür
//   • yalnız Google ilə daxil olan istifadəçi → "bərpa kodunu daxil edin" → bərpa
//   • çıxış: "bu cihazda məlumat qalsın?" dialoqu (saxla / sil + məlumatı da sil)
// Server yoxdur: /api/auth/* (tests/e2e/userAuth.js) və /api/sync/* (burada) yaddaşda saxtadır.
// Kriptoqrafiya HƏQİQİDİR: blok və qab Node WebCrypto ilə saytın öz modulları ilə hazırlanır,
// "server" yalnız şifrəli mətni görür.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, USER_EMAIL, USER_PASSWORD } from './userAuth.js'
import { generateCode, deriveKeys, encryptText } from '../../src/utils/syncCrypto.js'
import { wrapWithPassword } from '../../src/utils/syncWrap.js'

const DATA = {
  quran_bookmark: JSON.stringify({ surah: 18, ayah: 10, name: 'Kəhf', time: Date.UTC(2026, 10, 16) }),
  muslim_cc_hadith_last: JSON.stringify({ src: 'site', id: 42, lang: 'az', at: Date.UTC(2026, 10, 17) }),
  hifz_progress: JSON.stringify({ 1: 2, 112: 2 }),
  dua_favs: '[3,7]',
}

/** Hesabın şifrəli bloku + şifrə qabı (saytın öz kriptoqrafiyası ilə) */
async function accountBlob({ withPasswordWrap = true } = {}) {
  const code = generateCode()
  const { id, key } = await deriveKeys(code)
  const backup = { kind: 'muslims.cc/user-backup', version: 1, createdAt: new Date().toISOString(), count: Object.keys(DATA).length, data: DATA }
  const blob = await encryptText(key, JSON.stringify(backup))
  const keys = []
  if (withPasswordWrap) {
    const { salt, wrapped } = await wrapWithPassword(code, USER_PASSWORD)
    keys.push({ kind: 'password', salt, wrapped })
  }
  return { code, id, blob, keys }
}

function fakeSync(page, seed) {
  const store = new Map(seed ? [[seed.id, { blob: seed.blob, version: 1, updatedAt: Date.UTC(2026, 10, 17) }]] : [])
  return page.route((u) => /^\/api\/sync\/[0-9a-f]{64}$/.test(u.pathname), async (route) => {
    const req = route.request()
    const id = new URL(req.url()).pathname.split('/').pop()
    const row = store.get(id)
    if (req.method() === 'GET') return row ? route.fulfill({ json: row }) : route.fulfill({ status: 404, json: { error: 'not_found' } })
    if (req.method() === 'PUT') {
      const { blob, version = 0 } = req.postDataJSON()
      const cur = row ? row.version : 0
      if (cur !== version) return route.fulfill({ status: 409, json: { version: cur } })
      store.set(id, { blob, version: cur + 1, updatedAt: Date.now() })
      return route.fulfill({ json: { version: cur + 1, updatedAt: Date.now() } })
    }
    return route.fulfill({ status: 405, json: {} })
  }).then(() => store)
}

const ls = (page, k) => page.evaluate((key) => localStorage.getItem(key), k)

test('yeni cihaz: şifrə ilə giriş → kod açılır, məlumat bərpa olunur, "Davam et" Quran və hədisi göstərir', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  const acc = await accountBlob()
  const state = await fakeUserSession(page, { syncKeys: acc.keys, syncId: acc.id })
  const store = await fakeSync(page, acc)

  await page.goto('/login?next=%2F')
  await page.getByLabel('E-poçt').fill(USER_EMAIL)
  await page.getByLabel('Şifrə', { exact: true }).fill(USER_PASSWORD)
  await page.getByRole('button', { name: 'Daxil ol', exact: true }).click()
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/)

  // Bərpa: kod brauzerdə açıldı, blokdakı məlumat bu cihaza yazıldı
  await expect.poll(() => ls(page, 'quran_bookmark'), { timeout: 20_000 }).toContain('"surah":18')
  expect(await ls(page, 'muslim_cc_hadith_last')).toContain('"id":42')
  expect(await ls(page, 'dua_favs')).toBe('[3,7]')
  const sync = JSON.parse(await ls(page, 'muslim_cc_sync'))
  expect(sync).toMatchObject({ code: acc.code, acct: 12, auto: true })
  await expect(page.getByTestId('autosync-toast')).toHaveAttribute('data-kind', 'restored')
  // Ekran oxuyucusu: elan həmişə DOM-da olan canlı sahədən gəlir (a11y auditi 2026-11-25)
  await expect(page.getByTestId('autosync-live')).toHaveText('Tərəqqiniz hesabınızdan bərpa olundu.')

  // Server heç vaxt kodu və ya açıq məlumatı görmür
  const sent = JSON.stringify([state.bodies, [...store.values()]])
  expect(sent).not.toContain(acc.code)
  expect(sent).not.toContain('Kəhf')

  // "Davam et" kartı — Quran və hədis birbaşa həmin yerə
  // Ana səhifədə siyahı "Bu gün" panelinin "Qaldığınız yerdən" xanasındadır (ən çox 3 element)
  const card = page.locator('.hp-td-cont')
  await expect(card.getByTestId('continue-list')).toBeVisible({ timeout: 15_000 })
  await expect(card.getByRole('heading', { name: 'Qaldığınız yerdən' })).toBeVisible()
  const quran = card.locator('a[data-kind="quran"]')
  await expect(quran).toHaveAttribute('href', /\/quran\/18[^?]*\?a=10$/)
  await expect(quran).toContainText('ayə 10')
  await expect(card.locator('a[data-kind="hadith"]')).toHaveAttribute('href', /\/hadith\/42$/)

  // Hesab səhifəsi: sinxron vəziyyəti və eyni siyahı
  await page.goto('/account')
  await expect(page.getByTestId('acc-sync')).toHaveAttribute('data-status', 'linked')
  await expect(page.getByText('Bu cihaz hesabınızla sinxrondur')).toBeVisible()
  await expect(page.getByTestId('acc-sync-prot')).toContainText('Şifrəniz')
  await expect(page.locator('section[aria-labelledby="acc-continue"] a[data-kind="hadith"]')).toBeVisible()
  expect(state.csrfMissing).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('yalnız Google ilə daxil olan istifadəçi: "bərpa kodunu daxil edin" → bərpa', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  const acc = await accountBlob({ withPasswordWrap: false })
  await fakeUserSession(page, { google: 'ok', user: { hasPassword: false, passkeys: [], providers: ['google'] }, syncId: acc.id })
  await fakeSync(page, acc)

  await page.goto('/login')
  await page.locator('[data-gis-stub="signin_with"]').click()
  await expect(page).toHaveURL(/\/account$/)
  const box = page.getByTestId('acc-sync-need-code')
  await expect(box).toBeVisible({ timeout: 15_000 })
  await expect(box.getByRole('heading', { name: 'Bərpa kodunuzu daxil edin' })).toBeVisible()

  await box.getByLabel('Bərpa kodu').fill('UUUU-UUUU-UUUU-UUUU-UUUU-UUUU')
  await box.getByRole('button', { name: 'Aç və bərpa et' }).click()
  await expect(page.getByRole('alert')).toContainText('Kod düzgün deyil')

  await box.getByLabel('Bərpa kodu').fill(acc.code.toLowerCase().replace(/-/g, ' '))
  await box.getByRole('button', { name: 'Aç və bərpa et' }).click()
  await expect(page.getByTestId('acc-sync')).toHaveAttribute('data-status', 'linked', { timeout: 15_000 })
  expect(await ls(page, 'quran_bookmark')).toContain('"surah":18')
  // Şifrəsiz hesab: yalnız bərpa kodu açır — bunu aydın deyirik
  await expect(page.getByText('Yeni cihazda yalnız bərpa kodu ilə açılır')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('çıxış dialoqu: susmaya görə saxla; "sil" + "məlumatı da sil" bu cihazı təmizləyir', async ({ page, consoleProblems }) => {
  const acc = await accountBlob({ withPasswordWrap: false })
  await fakeUserSession(page, { signedIn: true, syncId: acc.id })
  await fakeSync(page, acc)
  // Bir dəfə (yenidən yükləmədə təkrarlanmasın): hesaba bağlı sinxronizasiyası olan cihaz
  await page.addInitScript(({ code }) => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('mcc_logged_in', '1')
    localStorage.setItem('muslim_cc_sync', JSON.stringify({ code, version: 1, auto: false, acct: 12, hash: 'x' }))
    localStorage.setItem('mcc_acct_sync', JSON.stringify({ uid: 12, status: 'linked', at: Date.now() }))
    localStorage.setItem('dua_favs', '[1]')
    localStorage.setItem('muslim_cc_motion', 'full')
  }, { code: acc.code })

  await page.goto('/account')
  await settle(page)
  const logout = page.locator('.acc-hero__logout')
  await logout.click()
  const dlg = page.getByTestId('logout-dialog')
  await expect(dlg).toBeVisible()
  await expect(dlg.getByRole('heading', { name: 'Bu cihazda məlumat qalsın?' })).toBeVisible()
  await expect(dlg.getByRole('radio', { name: /Bu cihazda saxla/ })).toBeChecked()
  // Ləğv → heç nə dəyişmir
  await dlg.getByRole('button', { name: 'Ləğv et' }).click()
  await expect(dlg).toBeHidden()
  expect(await ls(page, 'mcc_logged_in')).toBe('1')

  await logout.click()
  await dlg.getByRole('radio', { name: /Sinxronizasiyanı bu cihazdan sil/ }).check()
  await dlg.getByTestId('logout-wipe').check()
  await expect(dlg.getByRole('alert')).toContainText('Bu cihazdakı məlumat silinəcək')
  await Promise.all([page.waitForURL(/127\.0\.0\.1:\d+\/$/), dlg.getByRole('button', { name: 'Çıxış' }).click()])
  expect(await ls(page, 'muslim_cc_sync')).toBeNull()
  expect(await ls(page, 'dua_favs')).toBeNull()
  expect(await ls(page, 'mcc_logged_in')).toBeNull()
  expect(await ls(page, 'muslim_cc_motion')).toBe('full')          // cihaz ayarı qalır
  expectCleanConsole(consoleProblems)
})

test('şifrə bərpası səhifəsi sinxronlanan məlumat haqqında xəbərdarlıq edir', async ({ page }) => {
  await fakeUserSession(page)
  await page.goto('/account/reset#token=' + 'R'.repeat(43))
  await expect(page.getByTestId('reset-sync-note')).toContainText('bərpa kodunuz')
})

test('"Davam et" kartı hesabsız da işləyir; /en-də azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  await page.addInitScript((data) => { for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v) }, DATA)
  await page.goto('/en/')
  const card = page.locator('.hp-td-cont')
  await expect(card.getByTestId('continue-list')).toBeVisible({ timeout: 15_000 })
  await expect(card.getByRole('heading', { name: 'Continue where you left off' })).toBeVisible()
  await expect(card.locator('a[data-kind="quran"]')).toHaveAttribute('href', /^\/en\/quran\/18/)
  await expect(card).not.toContainText(/Davam|ayə|Hədis|Əzbər/)
  await expect(card.locator('.cc-synced')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

// ── Əlçatanlıq (axe: wcag2a/aa + best-practice — tests/e2e/a11y.spec.js ilə eyni qayda) ──
async function seriousViolations(page) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): /account sinxronizasiya bölməsi, "Davam et", çıxış dialoqu; ana səhifədə "Davam et"`, async ({ page }) => {
    test.setTimeout(60_000)
    const acc = await accountBlob({ withPasswordWrap: false })
    await fakeUserSession(page, { signedIn: true, syncId: acc.id })
    await fakeSync(page, acc)
    await page.addInitScript(({ code, data, theme }) => {
      localStorage.setItem('muslim_cc_theme', theme)
      localStorage.setItem('mcc_logged_in', '1')
      localStorage.setItem('muslim_cc_sync', JSON.stringify({ code, version: 1, auto: true, acct: 12, hash: 'x', syncedAt: new Date().toISOString() }))
      localStorage.setItem('mcc_acct_sync', JSON.stringify({ uid: 12, status: 'linked', at: Date.now() }))
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
    }, { code: acc.code, data: DATA, theme })
    await page.goto('/account')
    await expect(page.getByTestId('acc-sync')).toHaveAttribute('data-status', 'linked')
    await expect(page.getByTestId('acc-sync-prot')).toBeVisible()
    await settle(page)
    expect(await seriousViolations(page)).toEqual([])
    await page.locator('.acc-hero__logout').click()
    await expect(page.getByTestId('logout-dialog')).toBeVisible()
    await page.getByRole('radio', { name: /Sinxronizasiyanı bu cihazdan sil/ }).check()
    await page.getByTestId('logout-wipe').check()
    expect(await seriousViolations(page)).toEqual([])
    await page.getByRole('button', { name: 'Ləğv et' }).click()

    await page.goto('/')
    await expect(page.getByTestId('continue-list')).toBeVisible({ timeout: 15_000 })
    await settle(page)
    const v = await seriousViolations(page)
    expect(v.filter(x => x.includes('.cc'))).toEqual([])
  })
}
