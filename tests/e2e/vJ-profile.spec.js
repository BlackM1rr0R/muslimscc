// ═══════════════════════════════════════════════════════
// vJ: şəxsi mənəvi səyahət
//   • məzhəb (Hənəfi) → /prayer-də əsr sonra; "Əsrin kölgəsi" izahı uyğunlaşır
//   • sevimli qari (/account) → AyahAudio sorğusu həmin qarinin ünvanına gedir
//   • hesabın ildönümü kartı (saxta createdAt), ad günü kartı — ümumi dua + "ad gününə xas dua yoxdur"
//   • Ramazan "Wrapped": klaviatura ilə keçid, Esc, PNG; təravih gündəliyi
//   • "İslam yolundakı hekayəm" — öz mərhələ əlavə et / sil; kunya (qeydiyyatdan sonrakı addım)
//   • avatar çərçivəsi — yol mərhələsi; /en-də azərbaycanca yazı yoxdur; axe (açıq + tünd, ərəbcə RTL)
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole, BAKU } from './fixtures.js'
import { fakeUserSession } from './userAuth.js'
import { computeTimes, CALC_METHODS, withAsr } from '../../src/utils/prayCalc.js'

const J = JSON.stringify

async function reach(page, testId) {
  const el = page.getByTestId(testId).first()
  for (let i = 0; i < 90 && !(await el.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 700))
    await page.waitForTimeout(120)
  }
  await el.scrollIntoViewIfNeeded()
  return el
}
const seed = (page, data) => page.addInitScript((d) => {
  if (sessionStorage.getItem('vj-seeded')) return
  sessionStorage.setItem('vj-seeded', '1')
  for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
}, data)
const noShare = (page) => page.addInitScript(() => {
  try { Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }) } catch { /* */ }
  try { Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined, configurable: true }) } catch { /* */ }
})

/** Bakı vaxtı ilə bu gün: { y, m, d } */
function bakuToday(at = new Date()) {
  const p = {}
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at)) p[x.type] = x.value
  return { y: +p.year, m: +p.month, d: +p.day }
}
/** Düz bir il əvvəl (Bakıda günorta) — 29 fevralda dörd il əvvəl */
function createdYearAgo() {
  const { y, m, d } = bakuToday()
  const back = m === 2 && d === 29 ? 4 : 1
  return Date.UTC(y - back, m - 1, d, 8)
}

// Ramazan 1447 = 18.02.2026 – 19.03.2026 (Ümmül-Qura)
const fasts = {}
for (let d = 1; d <= 20; d++) fasts[d] = 1
const RAMADAN_DATA = {
  muslim_cc_ramadan_fasts_v1: J({ 1447: fasts }),
  dua_journal: J({ duas: [
    { id: 'r1', text: 'Ailəm üçün', category: 'family', priority: 'high', date: '2026-02-20', answered: true, answeredDate: '2026-03-10' },
    { id: 'r2', text: 'Elm üçün', category: 'personal', priority: 'medium', date: '2026-03-01', answered: false, answeredDate: null },
  ] }),
  muslim_cc_taraweeh_v1: J({ 1447: { 1: 8, 2: 8, 3: 0 } }),
}

test('məzhəb: Hənəfi seçiləndə /prayer-də əsr sonraya keçir, izah uyğunlaşır', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  const { y, m, d } = bakuToday()
  const shafi = computeTimes({ year: y, month: m, day: d }, BAKU.lat, BAKU.lng, 4, CALC_METHODS.abubakr).asr
  const hanafi = computeTimes({ year: y, month: m, day: d }, BAKU.lat, BAKU.lng, 4, withAsr(CALC_METHODS.abubakr, 2)).asr
  expect(hanafi > shafi).toBe(true)
  await page.goto('/prayer')
  await settle(page)
  const list = page.locator('.prayer-times-list').first()
  await expect(list.getByText(shafi, { exact: true })).toBeVisible()
  await page.getByTestId('madhab-select').first().selectOption('hanafi')
  await expect(list.getByText(hanafi, { exact: true })).toBeVisible()
  await expect(list.getByText(shafi, { exact: true })).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('muslim_cc_madhab'))).toBe('hanafi')
  const note = await reach(page, 'ash-method')
  await expect(note).toHaveAttribute('data-asr', '2')
  await expect(note).toContainText('2×')
  // seçim yadda qalır (yenidən yükləmə)
  await page.reload()
  await settle(page)
  await expect(page.locator('.prayer-times-list').first().getByText(hanafi, { exact: true })).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('sevimli qari: /account-da seçilir, ayə dinləyəndə həmin qarinin səsi istənilir', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  const audio = []
  await page.route(/cdn\.islamic\.network\/quran\/audio|verses\.quran\.com\//, (r) => { audio.push(r.request().url()); r.fulfill({ status: 200, contentType: 'audio/mpeg', body: '' }) })
  await fakeUserSession(page, { signedIn: true })
  await seed(page, { mcc_logged_in: '1' })
  await page.goto('/account')
  await settle(page)
  const rp = await reach(page, 'reciter-picker')
  await rp.getByTestId('reciter-select').selectOption('sudais')
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('quran_audio'))).reciter).toBe('sudais')
  // önizləmə də seçilən qarinindir
  await rp.getByTestId('reciter-preview').click()
  await expect.poll(() => audio.some((u) => u.includes('ar.abdurrahmaansudais/1.mp3'))).toBe(true)
  // dərsdəki ayə düyməsi (AyahAudio)
  await page.goto('/learn/adhkar-after-salah')
  await settle(page)
  const btn = page.getByRole('button', { name: /Ayəni dinlə/ }).first()
  await btn.scrollIntoViewIfNeeded()
  const before = audio.length
  await btn.click()
  await expect.poll(() => audio.length).toBeGreaterThan(before)
  const fresh = audio.slice(before)
  expect(fresh[0]).toMatch(/ar\.abdurrahmaansudais|\/Sudais\//)
  expect(fresh.some((u) => u.includes('ar.alafasy') || u.includes('/Alafasy/'))).toBe(false)
  expectCleanConsole(consoleProblems.filter((p) => !/audio|media|NotSupportedError|play\(\)/i.test(p)))
})

test('ildönümü: createdAt bu gün bir il əvvəl → kart, xülasə, bir dəfə bağlanır', async ({ page, consoleProblems }, info) => {
  test.setTimeout(90_000)
  await fakeUserSession(page, { signedIn: true, user: { createdAt: createdYearAgo() } })
  const { y, m, d } = bakuToday()
  const today = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  await seed(page, { mcc_logged_in: '1', dhikr_daily_v1: J({ [today]: 99 }), dua_journal: J({ duas: [{ id: 'a', text: 'x', date: today }] }) })
  await page.goto('/account')
  await settle(page)
  const card = page.getByTestId('acc-anniv-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Bir il əvvəl bu gün bizə qoşuldunuz')
  await expect(card.locator('[data-k="dhikr"] dd')).toHaveText('99')
  await expect(card.locator('[data-k="duas"] dd')).toHaveText('1')
  if (info.project.name === 'desktop') await expect(page.getByTestId('hdr-celebrate')).toBeAttached()
  await card.getByRole('button', { name: 'Bağla' }).click()
  await expect(card).toHaveCount(0)
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem('mcc_celebrate_v1'))).a).toBe(y)
  await page.reload()
  await settle(page)
  await expect(page.getByTestId('acc-story')).toBeAttached()
  await expect(page.getByTestId('acc-anniv-card')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('ad günü: ümumi dua mənbəsi ilə və "ad gününə xas dua yoxdur" qeydi', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  const { m, d } = bakuToday()
  await fakeUserSession(page, { signedIn: true })
  await seed(page, { mcc_logged_in: '1', muslim_cc_birthday_v1: J({ m, d, t: 1 }) })
  await page.goto('/account')
  await settle(page)
  const card = page.getByTestId('acc-bday-card')
  await expect(card).toBeVisible()
  await expect(card).toContainText('Bu gün ad gününüzdür')
  await expect(card.getByTestId('bday-dua-note')).toContainText('Ad gününə xas dua Sünnədə yoxdur')
  const dua = card.getByTestId('bday-dua')
  await expect(dua).toContainText('Bəqərə 2:201')
  await expect(dua.locator('[lang="ar"]').first()).toContainText('رَبَّنَا آتِنَا')
  await expect(card).not.toContainText(/ad günü duası/i)
  // ad günü forması yaddaşdakı tarixi göstərir
  const f = await reach(page, 'birthday-form')
  await expect(f.getByTestId('bday-month')).toHaveValue(String(m))
  expectCleanConsole(consoleProblems)
})

test('Ramazan Wrapped: klaviatura ilə kartlar, Esc, PNG; təravih gündəliyi', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await noShare(page)
  await seed(page, RAMADAN_DATA)
  await page.goto('/ramadan')
  await settle(page)
  const tw = await reach(page, 'taraweeh-log')
  await expect(tw).toBeVisible()
  const ra = await reach(page, 'ramadan-album')
  await expect(ra.getByTestId('ra-chapter')).toHaveAttribute('data-year', '1447')
  const open = ra.getByTestId('ra-wrapped')
  await open.click()
  const dlg = page.getByTestId('ramadan-wrapped')
  await expect(dlg).toBeVisible()
  // giriş + oruc (20) + təravih (3) + dua (2) + paylaşma = 5
  await expect(dlg).toHaveAttribute('data-total', '5')
  await expect(dlg).toHaveAttribute('data-card', '0')
  await page.keyboard.press('ArrowRight')
  await expect(dlg).toHaveAttribute('data-card', '1')
  await expect(dlg.getByTestId('wrapped-value')).toHaveText('20')
  await page.keyboard.press('ArrowRight')
  await expect(dlg.getByTestId('wrapped-value')).toHaveText('3')
  await expect(dlg).toContainText('16')   // 2 gecədə 16 rəkət yazılıb
  await page.keyboard.press('ArrowLeft')
  await expect(dlg).toHaveAttribute('data-card', '1')
  await expect(dlg.getByTestId('wrapped-live')).toContainText('2 / 5')
  await page.keyboard.press('End')
  await expect(dlg).toHaveAttribute('data-card', '4')
  const dl = page.waitForEvent('download')
  await dlg.getByTestId('wrapped-png').click()
  expect((await dl).suggestedFilename()).toBe('ramadan-1447-story.png')
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await expect(open).toBeFocused()
  expectCleanConsole(consoleProblems)
})

test('hekayəm: öz mərhələ əlavə et / sil; kunya — qeydiyyatdan sonrakı addım', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await fakeUserSession(page, { signedIn: true, user: { createdAt: Date.UTC(2025, 0, 5, 8) } })
  await seed(page, { mcc_logged_in: '1' })
  await page.goto('/account?welcome=1')
  await settle(page)
  const w = page.getByTestId('kunya-welcome')
  await expect(w).toBeVisible()
  await w.getByLabel(/Ad \(məsələn/).fill('Yusif')
  await w.getByTestId('kunya-save').click()
  await expect(page.getByTestId('hero-kunya')).toHaveText('(Əbu Yusif)')
  await expect(page.getByTestId('kunya-welcome')).toHaveCount(0)
  const story = await reach(page, 'acc-story')
  const tl = await reach(page, 'timeline')
  await expect(tl).toContainText('Hesabınız yaradıldı')
  const f = story.getByTestId('milestone-form')
  await f.getByTestId('milestone-kind').selectOption('hajj')
  await f.getByTestId('milestone-date').fill('2025-06-05')
  await f.getByTestId('milestone-note').fill('Ailəmlə birlikdə')
  await f.getByTestId('milestone-add').click()
  const item = tl.locator('[data-k="milestone"]')
  await expect(item).toContainText('İlk Həcc')
  await expect(item).toContainText('Ailəmlə birlikdə')
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('life_milestones_v1')))
  expect(saved.l[0]).toMatchObject({ d: '2025-06-05', k: 'hajj', no: 'Ailəmlə birlikdə' })
  // sıra: hesab (2025-01-05) → həcc (2025-06-05)
  await expect(tl.locator('[data-k]').first()).toHaveAttribute('data-k', 'account')
  await item.getByRole('button', { name: /Sil: İlk Həcc/ }).click()
  await expect(tl.locator('[data-k="milestone"]')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('avatar çərçivəsi: yol mərhələsi irəliləyişə görə', async ({ page, consoleProblems }) => {
  test.setTimeout(90_000)
  await fakeUserSession(page, { signedIn: true })
  await seed(page, {
    mcc_logged_in: '1',
    quran_life_v1: J({ v: 1, e: '', c: '', r: null, k: 1, ks: [{ s: '2025-01-01', e: '2025-06-01' }], d: {} }),
    muslim_cc_passport_v1: J({ khatm: '2025-06-01' }),
  })
  await page.goto('/account')
  await settle(page)
  // 1 xətm (10) + 1 möhür (3) = 13 xal → "Yolçu" (2-ci mərhələ, indeks 1)
  await expect(page.locator('.acc-hero [data-testid="journey-frame"]')).toHaveAttribute('data-stage', '1')
  const lv = await reach(page, 'journey-level')
  await expect(lv).toHaveAttribute('data-stage', '1')
  await expect(lv.getByTestId('journey-stage-name')).toHaveText('Yolçu')
  await expect(lv).toContainText('13 xal')
  expectCleanConsole(consoleProblems)
})

test('/en: J bölmələrində azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  test.setTimeout(120_000)
  const { m, d } = bakuToday()
  await noShare(page)
  // ad — istifadəçinin öz yazısıdır (avatarın hərfi): ingiliscə ad ilə yoxlanır
  await fakeUserSession(page, { signedIn: true, user: { createdAt: createdYearAgo(), displayName: 'Ali' } })
  await seed(page, {
    mcc_logged_in: '1', ...RAMADAN_DATA, muslim_cc_birthday_v1: J({ m, d, t: 1 }),
    muslim_cc_kunya_v1: J({ p: 'umm', n: 'Maryam', t: 1 }),
    life_milestones_v1: J({ v: 1, l: [{ id: 'abcd1234', d: '2024-05-05', k: 'umrah', u: 1 }] }),
  })
  const AZ = /[əƏ]|Ramazan|oruc|Hekayə|Bağla|mərhələ|qari|Məzhəb|Seçilməyib|Ümmü|Əbu|Yolçu|gecə/
  await page.goto('/en/account')
  await settle(page)
  await expect(page.getByTestId('hero-kunya')).toHaveText('(Umm Maryam)')
  for (const id of ['acc-anniv-card', 'acc-bday-card', 'acc-kunya', 'acc-jprefs', 'acc-birthday', 'acc-story', 'acc-level']) {
    const el = await reach(page, id)
    await expect(el, id).toBeVisible()
    await expect(el, id).not.toContainText(AZ)
  }
  await expect(page.getByTestId('acc-bday-card')).toContainText('There is no birthday-specific dua in the Sunnah')
  await expect(page.getByTestId('acc-bday-card')).toContainText('Quran 2:201')
  await page.goto('/en/ramadan')
  await settle(page)
  const tw = await reach(page, 'taraweeh-log')
  await expect(tw).not.toContainText(AZ)
  const ra = await reach(page, 'ramadan-album')
  await ra.getByTestId('ra-wrapped').click()
  const dlg = page.getByTestId('ramadan-wrapped')
  for (let i = 0; i < 5; i++) {
    await expect(dlg).not.toContainText(/[əƏ]|Ramazan|oruc|Hekayə|Bağla|gecə/)
    await page.keyboard.press('ArrowRight')
  }
  expectCleanConsole(consoleProblems)
})

// ── Əlçatanlıq (ciddi/kritik pozuntu olmamalıdır) ──
async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    .flatMap((v) => v.nodes.map((n) => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): /account J bölmələri, təravih, Wrapped; ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(180_000)
    const { m, d } = bakuToday()
    await noShare(page)
    await fakeUserSession(page, { signedIn: true, user: { createdAt: createdYearAgo() } })
    await page.addInitScript(({ theme, data }) => {
      localStorage.setItem('muslim_cc_theme', theme)
      if (sessionStorage.getItem('vj-a11y')) return
      sessionStorage.setItem('vj-a11y', '1')
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
    }, {
      theme,
      data: {
        mcc_logged_in: '1', ...RAMADAN_DATA, muslim_cc_birthday_v1: J({ m, d, t: 1 }),
        life_milestones_v1: J({ v: 1, l: [{ id: 'abcd1234', d: '2024-05-05', k: 'other', ti: 'Qeyd', no: 'Not', u: 1 }] }),
        muslim_cc_passport_v1: J({ khatm: '2025-06-01' }),
      },
    })
    for (const base of ['', '/ar']) {
      await page.goto(`${base}/account`)
      await settle(page)
      await reach(page, 'acc-level')
      await page.locator('.accj-level__how summary').click()
      await reach(page, 'timeline')
      expect(await serious(page, ['[data-testid="acc-anniv-card"]', '[data-testid="acc-bday-card"]', '[data-testid="acc-kunya"]',
        '[data-testid="acc-jprefs"]', '[data-testid="acc-birthday"]', '[data-testid="acc-story"]', '[data-testid="acc-level"]'])).toEqual([])
      await page.goto(`${base}/ramadan`)
      await settle(page)
      await reach(page, 'taraweeh-log')
      expect(await serious(page, ['[data-testid="taraweeh-log"]'])).toEqual([])
      const ra = await reach(page, 'ramadan-album')
      await ra.getByTestId('ra-wrapped').click()
      await expect(page.getByTestId('ramadan-wrapped')).toBeVisible()
      expect(await serious(page, ['[data-testid="ramadan-wrapped"]'])).toEqual([])
      await page.keyboard.press(base === '/ar' ? 'ArrowLeft' : 'ArrowRight')
      await expect(page.getByTestId('ramadan-wrapped')).toHaveAttribute('data-card', '1')
      expect(await serious(page, ['[data-testid="ramadan-wrapped"]'])).toEqual([])
      await page.keyboard.press('Escape')
    }
  })
}
