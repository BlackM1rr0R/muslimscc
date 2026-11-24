// ═══════════════════════════════════════════════════════
// Əmanət qutusu (/trust-box, server/trustBox.js — burada /api saxtadır):
//   • girişsiz — giriş kartı; hesab səhifəsində keçid kartı
//   • sahib: zəif parol rədd, "güclü parol təklif et", "anlayıram" təsdiqi → yarat; yaz, borc əlavə et, borc dəftərindən gətir,
//     saxla — serverə YALNIZ { salt, blob, ifVersion } gedir (açıq mətn yox) və blok həmin parolla Node-da açılır;
//     keçid — serverə yalnız SHA-256 heşi; məktub kartı; bağla → səhv parol → düzgün parol
//   • etibarlı şəxs: #t=… → token POST gövdəsində; səhv parol; düzgün parol → yalnız oxumaq; etibarsız keçid; ərəbcə RTL
//   • axe (ciddi pozuntu yoxdur), 360px-də üfüqi daşma yoxdur
// ═══════════════════════════════════════════════════════
import { createHash, webcrypto } from 'node:crypto'
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { fakeUserSession } from './userAuth.js'

const subtle = webcrypto.subtle
const enc = new TextEncoder()
const AAD = enc.encode('muslims.cc/trust-box/v1')
const b64u = (u8) => Buffer.from(u8).toString('base64url')
const TOKEN = 'T'.repeat(43)
const PASS = 'three apple trees and a well'
const MARK = 'Papers are in the top kitchen shelf QZX91'

async function keyOf(pass, saltBytes) {
  const base = await subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
  return subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 600000 }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
/** Müstəqil (Node) reallaşdırma — klientin formatı ilə uyğunluğu da yoxlanır */
async function seal(payload, pass) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16))
  const iv = webcrypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: AAD }, await keyOf(pass, salt), enc.encode(JSON.stringify(payload))))
  return { salt: `pbkdf2-sha256$600000$${b64u(salt)}`, blob: b64u(Buffer.concat([Buffer.from([1]), iv, ct])) }
}
async function unseal({ salt, blob }, pass) {
  const s = Buffer.from(salt.split('$')[2], 'base64url')
  const all = Buffer.from(blob, 'base64url')
  expect(all[0]).toBe(1)
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: all.subarray(1, 13), additionalData: AAD }, await keyOf(pass, s), all.subarray(13))
  return JSON.parse(Buffer.from(pt).toString('utf8'))
}

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

test('girişsiz — giriş kartı və "necə işləyir"', async ({ page, consoleProblems }) => {
  await page.goto('/en/trust-box')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trust box')
  await expect(page.getByTestId('tb-signin')).toBeVisible()
  await expect(page.getByText('If the passphrase is lost, nobody can recover it')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('hesab səhifəsində əmanət qutusu kartı', async ({ page, consoleProblems }) => {
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await page.addInitScript(() => localStorage.setItem('mcc_logged_in', '1'))
  await page.goto('/en/account')
  const card = page.getByTestId('acc-trustbox')
  await expect(card).toBeVisible({ timeout: 15000 })
  await expect(card.getByRole('link', { name: 'Open the trust box' })).toHaveAttribute('href', '/en/trust-box')
  expectCleanConsole(consoleProblems)
})

test('sahib: yarat, yaz, borc gətir, saxla — serverə yalnız şifrəli mətn; keçid heşi; məktub; bağla/aç', async ({ page, consoleProblems }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 360, height: 800 })
  await fakeUserSession(page, { signedIn: true, user: { emailVerified: true } })
  await page.addInitScript(() => {
    localStorage.setItem('mcc_logged_in', '1')
    localStorage.setItem('debt_ledger_v1', JSON.stringify({ v: 1, l: [
      { id: 'dseed01', k: 'owed', p: 'Kamran', a: 50, cu: 'USD', d: '2026-11-01', r: [{ id: 'rseed01', d: '2026-11-02', a: 10 }], u: 1 },
      { id: 'dseed02', k: 'owe', p: 'Closed', a: 5, cu: 'AZN', d: '2026-11-01', r: [], s: true, u: 1 },
    ] }))
  })
  let box = null
  const puts = []
  await page.route((u) => /^\/api\/trust-box(\/|$)/.test(u.pathname), (route) => {
    const req = route.request()
    const { pathname } = new URL(req.url())
    const m = req.method()
    if (m === 'GET' && pathname === '/api/trust-box') return route.fulfill({ json: { box, maxBlob: 262144 } })
    if (m === 'PUT' && pathname === '/api/trust-box') {
      const body = req.postDataJSON()
      puts.push({ body, xrw: req.headers()['x-requested-with'] })
      const hasLink = body.linkHash === undefined ? Boolean(box?.hasLink) : Boolean(body.linkHash)
      box = { salt: body.salt, blob: body.blob, hasLink, version: (box?.version || 0) + 1, createdAt: 1, updatedAt: Date.now(), lastOpenedAt: null }
      return route.fulfill({ json: { box } })
    }
    if (m === 'DELETE' && pathname === '/api/trust-box') { box = null; return route.fulfill({ json: { ok: true } }) }
    return route.fulfill({ status: 404, json: { error: 'Not found', code: 'not_found' } })
  })
  await page.goto('/en/trust-box')
  await settle(page)
  await expect(page.getByTestId('tb-setup')).toBeVisible()
  // vəsiyyət haqqında blok — saytın dərsindən, mənbə ilə
  await expect(page.getByTestId('tb-info')).toContainText('Bukhari 2742, Muslim 1628')
  await expect(page.getByTestId('tb-info')).toContainText('Tirmidhi 2120')

  const p1 = page.locator('input[name="trust-pass-new"]')
  const p2 = page.locator('input[name="trust-pass-new2"]')
  await p1.fill('short')
  await p2.fill('short')
  await page.getByTestId('tb-create').click()
  await expect(page.getByRole('alert')).toHaveText('The passphrase is too short — at least 12 characters.')
  await page.getByTestId('tb-generate').click()
  const code = (await page.getByTestId('tb-generated').innerText()).trim()
  expect(code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){5}$/)
  await page.getByTestId('tb-create').click()
  await expect(page.getByRole('alert')).toHaveText('Please confirm that you understand first.')
  await page.getByTestId('tb-understand').check()
  await page.getByTestId('tb-create').click()
  await expect(page.getByTestId('tb-editor')).toBeVisible({ timeout: 20000 })
  expect(puts).toHaveLength(1)
  expect(Object.keys(puts[0].body).sort()).toEqual(['blob', 'ifVersion', 'salt'])
  expect(puts[0].body.ifVersion).toBe(0)
  expect(puts[0].xrw).toBe('fetch')

  await page.getByTestId('tb-from').fill('Ali')
  await page.getByTestId('tb-will').fill('One third to the mosque')
  await page.getByTestId('tb-docs').fill(MARK)
  await page.getByTestId('tb-words').fill('Fear Allah and keep the family ties')
  await page.getByTestId('tb-debt-add').click()
  await page.getByTestId('tb-debt-p-0').fill('Rashad')
  await page.getByTestId('tb-debt-a-0').fill('150')
  await page.getByTestId('tb-debt-import').click()
  await expect(page.getByTestId('tb-import-note')).toHaveText('1 open debt imported.')
  await expect(page.getByTestId('tb-debt')).toHaveCount(2)
  await expect(page.getByTestId('tb-debt-p-1')).toHaveValue('Kamran')
  await expect(page.getByTestId('tb-debt-a-1')).toHaveValue('40')
  await page.getByTestId('tb-save').click()
  await expect(page.getByText('Saved. Only ciphertext was sent.')).toBeVisible({ timeout: 15000 })
  const saved = puts[1].body
  expect(Object.keys(saved).sort()).toEqual(['blob', 'ifVersion', 'salt'])
  expect(saved.ifVersion).toBe(1)
  const raw = JSON.stringify(saved)
  for (const s of [MARK, 'Rashad', 'Kamran', 'mosque', code]) expect(raw).not.toContain(s)
  // müstəqil açma: həmin parolla Node-da açılır
  const plain = await unseal(saved, code)
  expect(plain).toMatchObject({ v: 1, from: 'Ali', docs: MARK, will: 'One third to the mosque' })
  expect(plain.debts).toEqual([
    { k: 'owe', p: 'Rashad', a: 150, cu: '', no: '' },
    { k: 'owed', p: 'Kamran', a: 40, cu: 'USD', no: '', ref: 'dseed01' },
  ])

  // gizli keçid: serverə yalnız heş
  await page.getByTestId('tb-link-new').click()
  const url = page.getByTestId('tb-link-url')
  await expect(url).toHaveValue(/\/en\/trust-box#t=[A-Za-z0-9_-]{43}$/)
  const token = (await url.inputValue()).split('#t=')[1]
  const linkPut = puts[2].body
  expect(linkPut.linkHash).toBe(createHash('sha256').update(token).digest('hex'))
  expect(JSON.stringify(linkPut)).not.toContain(token)
  await expect(page.getByTestId('tb-link-revoke')).toBeVisible()
  await page.getByTestId('tb-card-toggle').click()
  const letter = page.getByTestId('tb-letter')
  await expect(letter).toContainText('A letter to my trusted person')
  await expect(letter).toContainText('I, Ali, am entrusting you')
  await expect(letter).toContainText(`#t=${token}`)
  await expect(page.getByTestId('tb-print')).toBeVisible()
  expect(await noOverflow(page)).toBe(true)
  expect(await serious(page, ['main'])).toEqual([])

  // bağla → səhv parol → düzgün parol
  await page.getByTestId('tb-lock').click()
  await expect(page.getByTestId('tb-locked')).toBeVisible()
  await page.locator('input[name="trust-pass"]').fill('wrong passphrase here')
  await page.getByTestId('tb-unlock').click()
  await expect(page.getByRole('alert')).toHaveText('This passphrase does not open the box. Check the letters and try again.', { timeout: 15000 })
  await page.locator('input[name="trust-pass"]').fill(code.toLowerCase())
  await page.getByTestId('tb-unlock').click()
  await expect(page.getByTestId('tb-docs')).toHaveValue(MARK, { timeout: 15000 })
  expectCleanConsole(consoleProblems)
})

test('etibarlı şəxs: token POST gövdəsində, səhv parol, düzgün parol → yalnız oxumaq', async ({ page, consoleProblems }) => {
  test.setTimeout(60000)
  const sealed = await seal({ v: 1, from: 'Ali', will: 'One third to the mosque', debts: [{ k: 'owe', p: 'Rashad', a: 150, cu: 'AZN', no: '' }], docs: MARK, words: 'Be patient', link: TOKEN, savedAt: 1 }, PASS)
  const bodies = []
  await page.route((u) => u.pathname === '/api/trust-box/open', (route) => {
    const req = route.request()
    bodies.push({ body: req.postDataJSON(), xrw: req.headers()['x-requested-with'], url: req.url() })
    return route.fulfill({ json: { ...sealed, updatedAt: Date.UTC(2026, 10, 20) } })
  })
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto(`/en/trust-box#t=${TOKEN}`)
  await settle(page)
  await expect(page.getByTestId('tb-trustee')).toBeVisible()
  expect(bodies[0].body).toEqual({ token: TOKEN })
  expect(bodies[0].xrw).toBe('fetch')
  expect(bodies[0].url).not.toContain(TOKEN)
  await page.locator('input[name="trust-pass"]').fill('not the passphrase')
  await page.getByTestId('tb-trustee-open').click()
  await expect(page.getByRole('alert')).toHaveText('This passphrase does not open the box. Check the letters and try again.', { timeout: 15000 })
  await page.locator('input[name="trust-pass"]').fill(`  ${PASS}  `)
  await page.getByTestId('tb-trustee-open').click()
  const read = page.getByTestId('tb-read')
  await expect(read).toBeVisible({ timeout: 15000 })
  await expect(read).toContainText('Read-only')
  await expect(read).toContainText(MARK)
  await expect(read).toContainText('Rashad')
  await expect(read.locator('textarea, input')).toHaveCount(0)
  expect(bodies).toHaveLength(1)                         // parol serverə getmir
  expect(await noOverflow(page)).toBe(true)
  expect(await serious(page, ['main'])).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('etibarsız keçid → mesaj; ərəbcə RTL', async ({ page, consoleProblems }) => {
  await page.goto(`/ar/trust-box#t=${TOKEN}`)
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.getByTestId('tb-invalid')).toHaveText('هذا الرابط غير صالح (أُوقف أو استُبدل برابط جديد).')
  expectCleanConsole(consoleProblems)
})
