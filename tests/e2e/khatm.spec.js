// ═══════════════════════════════════════════════════════
// /khatm — "Ümmətin Canlı Xətmi" (server/globalKhatm.js saxtası + saxta SSE):
//   qonaq izləyir (giriş keçidi ?next=), daxil olub səhifə götür → oxu → "Oxudum" → halqada bölmə yanır,
//   canlı "round" hadisəsi → təbrik pəncərəsi + iştirak yaddaşı, ana səhifədə sayğac (SSE açılmır),
//   /en-də azərbaycanca yoxdur, axe (açıq / tünd).
// Real təhlükəsizlik (atomik götürmə, minimum vaxt, limitlər) — tests/unit/server-global-khatm.test.js.
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { fakeUserSession, setLoginHint } from './userAuth.js'

// 604 bitlik base64 (səhifə p → bit p-1)
const bitsOf = (pages) => {
  const b = Buffer.alloc(76)
  for (const p of pages) b[(p - 1) >> 3] |= 1 << ((p - 1) & 7)
  return b.toString('base64')
}
function fakePage(n) {
  const words = []
  let pos = 1
  for (let line = 1; line <= 15; line++) {
    for (let k = 0; k < 5; k++) words.push({ position: pos++, line_number: line, page_number: n, char_type_name: 'word', text_uthmani: 'كلمة', translation: { text: `w${pos}` }, transliteration: { text: 'kalima' } })
  }
  words.push({ position: pos, line_number: 15, page_number: n, char_type_name: 'end', text_uthmani: '١' })
  return { verses: [{ verse_key: `29:${n - 395}`, juz_number: 21, rub_el_hizb_number: 161, words }] }
}
const mushafMock = (p) => p.route(/api\.quran\.com\/api\/v4\/verses\/by_page\/\d+/, (route) => route.fulfill({ json: fakePage(Number(route.request().url().match(/by_page\/(\d+)/)[1])) }))
const ls = (p, k) => p.evaluate((key) => localStorage.getItem(key), k)

const ROUND_DONE = { roundNo: 1, participants: 512, countries: 38, dedications: 7, startedAt: Date.UTC(2026, 10, 18, 6, 0), completedAt: Date.UTC(2026, 10, 18, 9, 12), durationMs: (3 * 60 + 12) * 60e3, nextRoundNo: 2 }

/** Saxta server: S.done — oxunan səhifələr; S.events — SSE-də "hello"-dan sonra göndəriləcək hadisələr */
function createKhatm(over = {}) {
  return {
    roundNo: 1, done: new Set([1, 2, 4, 5, 9]), active: 3, claim: null, requests: [], bodies: {}, events: [], loved: ['Nənəm Səkinə'],
    rounds: [{ no: 1246, startedAt: Date.UTC(2026, 10, 16, 8, 0), completedAt: Date.UTC(2026, 10, 17, 2, 30), durationMs: 18.5 * 3600e3, participants: 431, countries: 29, dedications: 12 }],
    ramadan: { year: 1447, current: false, count: 3 }, liveHits: 0, ...over,
  }
}
async function attachKhatm(page, S) {
  const snap = () => ({ roundNo: S.roundNo, startedAt: Date.UTC(2026, 10, 18, 6, 0), bits: bitsOf(S.done), readCount: S.done.size, active: S.active, total: 604 })
  await page.route((u) => u.pathname.startsWith('/api/khatm/'), async (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const key = `${req.method()} ${pathname}`
    S.requests.push(key)
    try { S.bodies[key] = req.postDataJSON() } catch { /* gövdəsiz */ }
    if (req.method() !== 'GET' && !req.headers()['x-requested-with']) return route.fulfill({ status: 403, json: { error: 'forbidden', code: 'forbidden' } })
    switch (key) {
      case 'GET /api/khatm/state': return route.fulfill({ json: snap() })
      case 'GET /api/khatm/stats': return route.fulfill({ json: { roundNo: S.roundNo, readCount: S.done.size, active: 214, rounds: 1246 } })
      case 'GET /api/khatm/rounds': return route.fulfill({ json: { rounds: S.rounds, page: 1, pages: 1, total: S.rounds.length, ramadan: S.ramadan } })
      case 'GET /api/khatm/live': {
        S.liveHits++
        const ev = [['hello', snap()], ...S.events].map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('')
        return route.fulfill({ status: 200, contentType: 'text/event-stream', body: `retry: 86400000\n\n${ev}` })
      }
      case 'GET /api/khatm/me': return route.fulfill({ json: { claim: S.claim, rounds: [], dedications: [], loved: S.loved, minReadMs: 40000, claimMs: 1800000 } })
      case 'POST /api/khatm/claim': {
        const t = Date.now()
        // readyAt keçmişdədir — testdə yalnız klientin 10 s "ekranda qalma" şərti gözlənilir
        S.claim = { page: 400, roundNo: S.roundNo, claimedAt: t - 60e3, expiresAt: t + 29 * 60e3, readyAt: t - 20e3, dedication: S.bodies[key]?.dedication || null, cell: null }
        S.active++
        return route.fulfill({ status: 201, json: { claim: S.claim, existing: false } })
      }
      case 'POST /api/khatm/complete': {
        const page = S.bodies[key]?.page
        if (!S.claim || S.claim.page !== page) return route.fulfill({ status: 409, json: { error: 'not_yours', code: 'not_yours' } })
        S.done.add(page); S.claim = null; S.active--
        return route.fulfill({ json: { ok: true, page, roundNo: S.roundNo, readCount: S.done.size, roundCompleted: null } })
      }
      case 'POST /api/khatm/release': S.claim = null; return route.fulfill({ json: { ok: true, released: true } })
      default: return route.fulfill({ status: 404, json: { error: 'not_found', code: 'not_found' } })
    }
  })
}

test('qonaq: izləmə rejimi — canlı rəqəmlər, arxiv, Ramazan, giriş keçidi', async ({ page, consoleProblems }) => {
  const S = createKhatm()
  await attachKhatm(page, S)
  await page.goto('/khatm')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ümmətin Canlı Xətmi')
  await expect(page.getByTestId('khatm-read')).toHaveText('5')
  await expect(page.getByTestId('khatm-active')).toHaveText('3')
  await expect(page.getByTestId('khatm-ring')).toHaveAttribute('data-read', '5')
  await expect(page.getByRole('heading', { name: 'Xətm №1' })).toBeVisible()
  const guest = page.getByTestId('khatm-guest')
  await expect(guest).toContainText('izləmə rejimindəsiniz')
  await expect(guest.getByRole('link', { name: 'Daxil ol və səhifə götür' })).toHaveAttribute('href', '/login?next=%2Fkhatm')
  await expect(page.getByTestId('khatm-action')).toContainText('Oxunmanı yoxlamırıq — niyyət sənindir.')
  const arch = page.getByTestId('khatm-archive')
  await expect(arch.getByRole('heading', { name: 'Ümmətin xətm kitabı' })).toBeVisible()
  await expect(arch.locator('tbody tr')).toHaveCount(1)
  await expect(arch.locator('tbody tr')).toContainText('№1246')
  await expect(arch.locator('tbody tr')).toContainText('18 saat 30 dəqiqə')
  await expect(page.getByTestId('khatm-ramadan')).toHaveText('1447 hicri ilinin Ramazanında ümmət 3 dəfə xətm etdi')
  // qonaq üçün /me sorğusu getmir
  expect(S.requests).not.toContain('GET /api/khatm/me')
  expect(S.liveHits).toBe(1)
  expectCleanConsole(consoleProblems)
})

test('daxil olub: səhifə götür (ithafla) → oxu → «Oxudum» → halqada bölmə yanır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  const S = createKhatm()
  await fakeUserSession(page, { signedIn: true, user: { displayName: 'Əli' } })
  await setLoginHint(page)
  await attachKhatm(page, S)
  await mushafMock(page)
  await page.goto('/khatm')
  await settle(page)
  const take = page.getByTestId('khatm-take')
  await expect(take).toBeVisible()
  // "Sevdiklərim üçün dua" siyahısından bir toxunuşla
  await take.getByRole('button', { name: 'Nənəm Səkinə' }).click()
  await expect(take.getByLabel('İthaf (istəyə bağlı): mərhum yaxınınızın adı')).toHaveValue('Nənəm Səkinə')
  await take.getByTestId('khatm-take-btn').click()
  const reader = page.getByTestId('khatm-reader')
  await expect(reader).toBeVisible()
  expect(S.bodies['POST /api/khatm/claim']).toEqual({ dedication: 'Nənəm Səkinə' })
  await expect(page.getByTestId('khatm-page-title')).toHaveText('Səhifə 400 — Ənkəbut')
  await expect(reader).toContainText('İthaf: Nənəm Səkinə')
  await expect(reader.locator('.mp-word').first()).toBeVisible()
  const done = page.getByTestId('khatm-done')
  await expect(done).toBeDisabled()
  // səhifə ekranda ≥ 10 s → "Oxudum" açılır, ayələr ömürlük mozaikaya yazılır
  await expect(done).toBeEnabled({ timeout: 15_000 })
  await done.click()
  await expect(page.getByTestId('khatm-thanks')).toHaveText(/Səhifə 400 xətmə əlavə olundu/)
  await expect(page.getByTestId('khatm-ring')).toHaveAttribute('data-read', '6')
  await expect(page.getByTestId('khatm-ring')).toHaveAttribute('data-last', '400')
  await expect(page.getByTestId('khatm-read')).toHaveText('6')
  expect(S.bodies['POST /api/khatm/complete']).toEqual({ page: 400 })
  expect(JSON.parse(await ls(page, 'world_khatm_v1'))).toEqual({ v: 1, r: { 1: { p: [400] } } })
  await expect.poll(async () => JSON.parse((await ls(page, 'quran_life_v1')) || 'null')?.e || '').not.toBe('')
  await expect(page.getByTestId('khatm-take-btn')).toHaveText(/Daha bir səhifə götür/)
  expectCleanConsole(consoleProblems)
})

test('canlı: xətm tamamlananda təbrik pəncərəsi; iştirakçının yaddaşında «tamamlandı» → möhür', async ({ page, consoleProblems }) => {
  const S = createKhatm({ events: [['page', { page: 3, cell: { lat: 41, lon: 29 }, roundNo: 1, readCount: 6, active: 3 }], ['round', ROUND_DONE]] })
  await page.addInitScript(() => { try { if (!localStorage.getItem('world_khatm_v1')) localStorage.setItem('world_khatm_v1', JSON.stringify({ v: 1, r: { 1: { p: [12] } } })) } catch { /* */ } })
  await attachKhatm(page, S)
  await page.goto('/khatm')
  const dlg = page.getByTestId('khatm-done-overlay')
  await expect(dlg).toBeVisible()
  await expect(dlg.getByRole('heading', { name: 'Xətm №1 tamamlandı' })).toBeVisible()
  await expect(page.getByTestId('khatm-done-line')).toHaveText('38 ölkədən 512 nəfər, 3 saat 12 dəqiqə')
  await expect(dlg).toContainText('Bu xətmdə 7 ad yad edildi.')
  await expect(dlg).toContainText('Siz də bu xətmin iştirakçısısınız.')
  await expect(dlg).toContainText('Xətm №2 artıq başladı.')
  await expect(dlg.getByRole('button', { name: 'Bağla' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  // yeni dövr — halqa boşdur
  await expect(page.getByRole('heading', { name: 'Xətm №2' })).toBeVisible()
  await expect(page.getByTestId('khatm-ring')).toHaveAttribute('data-read', '0')
  const st = JSON.parse(await ls(page, 'world_khatm_v1'))
  expect(st.r[1]).toMatchObject({ p: [12], d: '2026-11-18' })
  // möhür (analitika səhifəsindəki kitabça)
  test.setTimeout(60_000)
  await page.goto('/analytics')
  await settle(page)
  const pp = page.getByTestId('passport')
  for (let i = 0; i < 80 && !(await pp.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(150)
  }
  const stamp = pp.locator('[data-stamp="ummah_khatm"]')
  await stamp.scrollIntoViewIfNeeded()
  await expect(stamp).toHaveAttribute('data-earned', '')
  await expect(stamp).toContainText('Ümmət xətmində iştirak')
  expectCleanConsole(consoleProblems)
})

test('ana səhifə: canlı sayğac /khatm-a aparır, SSE açılmır', async ({ page, consoleProblems }) => {
  const S = createKhatm()
  await attachKhatm(page, S)
  await page.goto('/')
  const pulse = page.getByTestId('khatm-pulse')
  for (let i = 0; i < 60 && !(await pulse.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 600))
    await page.waitForTimeout(150)
  }
  await pulse.scrollIntoViewIfNeeded()
  await expect(pulse).toHaveText('İndi 214 nəfər dünya xətmini oxuyur')
  await expect(pulse).toHaveAttribute('href', '/khatm')
  expect(S.requests).toContain('GET /api/khatm/stats')
  expect(S.liveHits).toBe(0)
  await pulse.click()
  await expect(page).toHaveURL(/\/khatm$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Ümmətin Canlı Xətmi' })).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('/en/khatm: azərbaycanca yazı yoxdur; ərəbcə RTL', async ({ page, consoleProblems }) => {
  const S = createKhatm()
  await attachKhatm(page, S)
  await page.goto('/en/khatm')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Ummah’s Live Khatm')
  await expect(page.getByTestId('khatm-ramadan')).toHaveText('In Ramadan 1447 AH the Ummah completed the Quran 3 times')
  expect(await page.locator('main').innerText()).not.toMatch(/[əƏ]|Xətm|səhifə/)
  await page.goto('/ar/khatm')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ختمة الأمة الحيّة')
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`axe: /khatm qonaq və oxu görünüşü (${theme})`, async ({ page }) => {
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* */ } }, theme)
    const S = createKhatm()
    await fakeUserSession(page, { signedIn: true, user: { displayName: 'Ali' } })
    await setLoginHint(page)
    await attachKhatm(page, S)
    await mushafMock(page)
    const axe = async () => {
      await settle(page)
      const { violations } = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
      return violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').flatMap((v) => v.nodes.map((n) => `${v.id} · ${n.target.join(' ')}`))
    }
    await page.goto('/khatm')
    await expect(page.getByTestId('khatm-take')).toBeVisible()
    expect(await axe()).toEqual([])
    await page.getByTestId('khatm-take-btn').click()
    await expect(page.locator('.kt-stage .mp-word').first()).toBeVisible()
    expect(await axe()).toEqual([])
  })
}
