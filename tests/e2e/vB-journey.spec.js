// ═══════════════════════════════════════════════════════
// vB: ömürlük Quran mozaikası, Quran dəftəri, xətm şəhadətnaməsi, mənəvi səyahət kitabçası
//   • oxuyucuda ayələr ekranda qalır → quran_life_v1 → mozaika yanır
//   • qeyd + rəngli vurğu → yazılma günü, tarixçə → dəftər (sıralama, .md ixracı)
//   • xətm (plan 604 səhifə / mozaikada son ayələr) → şəhadətnamə → PNG yüklənir
//   • kitabçada əkilmiş məlumatdan qazanılmış möhür; /account-da bölmələr
//   • /en-də azərbaycanca yazı yoxdur; axe (açıq + tünd)
// Fatihə fixtures.js-in saxta API-sindən gəlir (7 ayə).
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { fakeUserSession } from './userAuth.js'
import { newBits, setBit, encodeBits, TOTAL } from '../../src/utils/quranLife.js'

async function reach(page, testId) {
  const el = page.getByTestId(testId).first()
  for (let i = 0; i < 90 && !(await el.count()); i++) {
    await page.evaluate(() => window.scrollBy(0, 700))
    await page.waitForTimeout(120)
  }
  await el.scrollIntoViewIfNeeded()
  return el
}
const lifeCount = (page) => page.evaluate(() => {
  try {
    const v = JSON.parse(localStorage.getItem('quran_life_v1') || 'null')
    if (!v?.e) return 0
    const raw = atob(v.e)
    let n = 0
    for (let i = 0; i < raw.length; i++) { let b = raw.charCodeAt(i); while (b) { n += b & 1; b >>= 1 } }
    return n
  } catch { return -1 }
})
const seed = (page, data) => page.addInitScript((d) => {
  if (sessionStorage.getItem('vb-seeded')) return
  sessionStorage.setItem('vb-seeded', '1')
  for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
}, data)

test('oxuyucu: ekranda qalan ayələr mozaikada yanır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('#ayah-1')).toBeVisible()
  // hər ayə ≥ 1.5 s ekranda (kart hündürdür — sürüşdürürük) + ~1.2 s birləşdirilmiş yazma
  for (const n of [1, 2, 3]) {
    await page.evaluate((x) => document.getElementById('ayah-' + x)?.scrollIntoView({ block: 'center', behavior: 'instant' }), n)
    await page.waitForTimeout(1800)
  }
  await expect.poll(() => lifeCount(page), { timeout: 12_000 }).toBeGreaterThanOrEqual(3)
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_life_v1')))
  expect(st.d['1']).toHaveLength(2)

  await page.goto('/quran')
  await settle(page)
  const lm = await reach(page, 'life-mosaic')
  await expect.poll(async () => Number(await lm.getAttribute('data-read'))).toBeGreaterThanOrEqual(3)
  await expect(lm.getByTestId('lm-ayahs')).not.toHaveText('0')
  // klaviatura: kətan → Home → 1:1 oxunub
  await lm.getByTestId('lm-canvas').focus()
  await page.keyboard.press('Home')
  await expect(lm.getByTestId('lm-info')).toContainText('1:1')
  await expect(lm.getByTestId('lm-info')).toContainText('oxunub')
  await expect(lm.getByTestId('lm-open')).toHaveAttribute('href', /\/quran\/1.*\?a=1$/)
  expectCleanConsole(consoleProblems)
})

test('dəftər: qeyd + vurğu → yazılma günü, tarixçə → siyahı, sıralama, .md ixracı', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const openNote = async (n) => {
    // menyu sürüşmədə bağlanır — əvvəlcə ayəni ortaya gətir
    await page.evaluate((x) => document.getElementById('ayah-' + x)?.scrollIntoView({ block: 'center', behavior: 'instant' }), n)
    await page.waitForTimeout(300)
    await page.locator(`#ayah-${n}`).getByTestId('word-menu-btn').click()
    await page.getByRole('menu').getByRole('menuitem', { name: 'Qeyd' }).click()
    return page.getByTestId('word-popover')
  }
  let pop = await openNote(2)
  await pop.getByRole('radio', { name: 'Qızılı' }).check()
  await pop.getByRole('textbox').fill('Birinci fikir')
  await pop.getByTestId('note-save').click()
  await expect(pop.getByRole('status').filter({ hasText: 'Saxlanıldı' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('#ayah-2')).toHaveAttribute('data-note', 'gold')

  // yenidən açanda: «Bu qeydi … yazmısınız»; mətni dəyiş → köhnəsi tarixçədə
  pop = await openNote(2)
  await expect(pop.getByTestId('note-when')).toContainText('yazmısınız')
  await pop.getByRole('textbox').fill('İkinci fikir')
  await pop.getByTestId('note-save').click()
  await expect(pop.getByRole('status').filter({ hasText: 'Saxlanıldı' })).toBeVisible()
  await page.keyboard.press('Escape')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_notes_v1')))
  expect(saved['1:2']).toMatchObject({ c: 'gold', t: 'İkinci fikir', h: [{ t: 'Birinci fikir' }] })
  expect(saved['1:2'].d).toBeGreaterThan(0)

  // yalnız rəngli vurğu → kartda göstərici
  pop = await openNote(5)
  await pop.getByRole('radio', { name: 'Mavi' }).check()
  await pop.getByTestId('note-save').click()
  await page.keyboard.press('Escape')
  await expect(page.locator('#ayah-5').getByTestId('ayah-hl')).toBeVisible()

  pop = await openNote(2)
  await expect(pop.locator('.wm-note__hist summary')).toContainText('1')
  await page.keyboard.press('Escape')

  await page.goto('/quran')
  await settle(page)
  await page.getByRole('button', { name: /Saxlanılanlar/ }).click()
  const notes = page.getByTestId('quran-notes')
  await expect(notes).toContainText('İkinci fikir')
  await expect(notes.locator('.qn__card')).toHaveCount(2)
  await notes.getByRole('button', { name: /Qızılı/ }).click()
  await expect(notes.locator('.qn__card')).toHaveCount(1)
  await notes.getByRole('button', { name: 'Hamısı' }).click()
  await notes.getByTestId('qn-sort').selectOption('surah')
  await expect(notes.locator('.qn__card').first()).toContainText('1:2')
  const dl = page.waitForEvent('download')
  await notes.getByTestId('qn-export-md').click()
  const file = await dl
  expect(file.suggestedFilename()).toMatch(/^muslims-cc-quran-notes-\d{4}-\d{2}-\d{2}\.md$/)
  const fs = await import('node:fs')
  const md = fs.readFileSync(await file.path(), 'utf8')
  expect(md).toContain('# Quran dəftərim')
  expect(md).toContain('İkinci fikir')
  expect(md).toContain('(1:2)')
  expectCleanConsole(consoleProblems)
})

test('xətm planı bitib → şəhadətnamə → PNG yüklənir, kolleksiyada qalır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await seed(page, { quran_khatm_plan: JSON.stringify({ days: 30, start: '2026-10-01', done: 604, log: ['2026-10-29', '2026-10-30'] }) })
  await page.goto('/quran')
  await settle(page)
  const kc = await reach(page, 'khatm-certs')
  await expect(page.getByTestId('khatm-cert-link')).toBeVisible()
  await kc.getByTestId('kcx-create').click()
  const form = kc.getByTestId('kcx-form')
  await expect(form.getByLabel('Başlanğıc')).toHaveValue('2026-10-01')
  await expect(form.getByLabel('Xətm günü')).toHaveValue('2026-10-30')
  await form.getByLabel('Ad', { exact: true }).fill('')
  await kc.getByTestId('kcx-make').click()
  await expect(form.getByRole('alert')).toContainText('Adı yazın')
  await form.getByLabel('Ad', { exact: true }).fill('Əli Vəli')
  await form.getByLabel('İthaf (istəyə bağlı)').fill('Ailəm üçün')
  await kc.getByTestId('kcx-make').click()
  const res = kc.getByTestId('kcx-result')
  await expect(res.locator('img')).toBeVisible()
  await expect(res.locator('img')).toHaveAttribute('alt', /Əli Vəli/)
  const dl = page.waitForEvent('download')
  await res.getByTestId('kcx-download').click()
  expect((await dl).suggestedFilename()).toBe('muslims-cc-khatm-əli-vəli-2026-10-30.png')
  const certs = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_khatm_certs_v1')))
  expect(certs).toEqual([expect.objectContaining({ id: 'plan:2026-10-01', name: 'Əli Vəli', ded: 'Ailəm üçün', start: '2026-10-01', end: '2026-10-30' })])
  await expect(kc.getByTestId('kcx-list')).toContainText('Əli Vəli')
  await expect(kc.getByTestId('kcx-create')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('mozaikada son ayələr oxunur → xətm sayğacı, şəhadətnamə təklifi', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  // Fatihədən (0…6) başqa bütün ayələr cari dövrdə oxunub
  const b = newBits()
  for (let i = 7; i < TOTAL; i++) setBit(b, i)
  const life = { v: 1, e: encodeBits(b), c: encodeBits(b), r: '2026-09-01', k: 0 }
  await seed(page, { quran_life_v1: JSON.stringify(life) })
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  // Fatihənin hər ayəsi ən azı 1.5 s ekranda qalsın (telefonda hamısı birdən sığmaya bilər)
  for (const n of [1, 3, 5, 7]) {
    await page.evaluate((x) => document.getElementById('ayah-' + x)?.scrollIntoView({ block: 'center', behavior: 'instant' }), n)
    await page.waitForTimeout(1800)
  }
  await expect.poll(async () => (await page.evaluate(() => JSON.parse(localStorage.getItem('quran_life_v1') || '{}').k)) || 0, { timeout: 15_000 }).toBe(1)
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('quran_life_v1')))
  expect(st.ks).toEqual([{ s: '2026-09-01', e: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }])

  await page.goto('/quran')
  await settle(page)
  const lm = await reach(page, 'life-mosaic')
  await expect(lm.getByTestId('lm-khatms')).toHaveText('1')
  const kc = await reach(page, 'khatm-certs')
  await expect(kc).toContainText('Ömürlük mozaika')
  await expect(kc.getByTestId('kcx-create')).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('kitabça: əkilmiş məlumatdan qazanılmış möhürlər, qazanılma günü yazılır', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await seed(page, {
    hifz_progress: JSON.stringify({ 112: 2 }),
    dhikr_count_total: '1500',
    kahf_fridays_v1: JSON.stringify(['2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23']),
    names99_practice_v1: JSON.stringify({ known: [1, 2, 3] }),
  })
  await page.goto('/analytics')
  await settle(page)
  const pp = await reach(page, 'passport')
  for (const id of ['hifz_surah', 'dhikr_1000', 'kahf_4']) await expect(pp.locator(`[data-stamp="${id}"]`)).toHaveAttribute('data-earned', '')
  await expect(pp.locator('[data-stamp="names_99"]')).not.toHaveAttribute('data-earned', '')
  await expect(pp.locator('[data-stamp="names_99"]')).toContainText('3 / 99')
  // Hicrət yolu / ərəb kursu ölçüləri tənbəl yüklənir — "yoxlanılır…" yox olur
  await expect(pp.locator('[data-stamp="arabic"]')).not.toContainText('yoxlanılır')
  await expect(pp.getByTestId('passport-count')).toContainText('3')
  const dates = await page.evaluate(() => JSON.parse(localStorage.getItem('muslim_cc_passport_v1')))
  expect(Object.keys(dates).sort()).toEqual(['dhikr_1000', 'hifz_surah', 'kahf_4'])
  expectCleanConsole(consoleProblems)
})

test('/account: mozaika önizləməsi, dəftər, şəhadətnamələr, kitabça', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await fakeUserSession(page, { signedIn: true })
  const b = newBits(); for (let i = 0; i < 7; i++) setBit(b, i)
  await seed(page, {
    mcc_logged_in: '1',
    quran_life_v1: JSON.stringify({ v: 1, e: encodeBits(b), c: encodeBits(b), r: '2026-11-01', k: 0, d: { 1: ['2026-11-01', '2026-11-01'] } }),
    quran_notes_v1: JSON.stringify({ '2:255': { c: 'gold', t: 'Ayətul-Kürsi', u: Date.UTC(2026, 10, 2), d: Date.UTC(2026, 10, 1) } }),
    quran_khatm_plan: JSON.stringify({ days: 30, start: '2026-10-01', done: 604, log: ['2026-10-30'] }),
    hifz_progress: JSON.stringify({ 1: 2 }),
  })
  await page.goto('/account')
  await settle(page)
  const lm = await reach(page, 'life-mosaic')
  await expect(lm).toHaveAttribute('data-read', '7')
  await expect(page.getByTestId('quran-notes')).toContainText('Ayətul-Kürsi')
  const kc = page.getByTestId('khatm-certs')
  await kc.getByTestId('kcx-create').click()
  // ad hesabdan gəlir
  await expect(kc.getByLabel('Ad', { exact: true })).toHaveValue('Əli')
  const pp = await reach(page, 'passport')
  await expect(pp.locator('[data-stamp="hifz_surah"]')).toHaveAttribute('data-earned', '')
  await expect(pp.locator('[data-stamp="khatm"]')).toHaveAttribute('data-earned', '')
  expectCleanConsole(consoleProblems)
})

test('/en: yeni bölmələrdə azərbaycanca yazı yoxdur', async ({ page, consoleProblems }) => {
  test.setTimeout(60_000)
  await seed(page, { quran_khatm_plan: JSON.stringify({ days: 30, start: '2026-10-01', done: 604, log: ['2026-10-30'] }), hifz_progress: JSON.stringify({ 1: 2 }) })
  const AZ = /[əƏ]|Qeyd|Xətm|oxunub|möhür|Şəhadətnamə/
  await page.goto('/en/quran')
  await settle(page)
  const lm = await reach(page, 'life-mosaic')
  await expect(lm).toContainText('Lifetime Quran mosaic')
  await expect(lm).not.toContainText(AZ)
  const kc = await reach(page, 'khatm-certs')
  await kc.getByTestId('kcx-create').click()
  await expect(kc).toContainText('Khatm certificates')
  await expect(kc).not.toContainText(AZ)
  await page.getByRole('button', { name: /Saved/ }).first().click()
  await expect(page.getByTestId('quran-notes')).not.toContainText(AZ)
  await page.goto('/en/analytics')
  await settle(page)
  const pp = await reach(page, 'passport')
  await expect(pp).toContainText('Spiritual journey passport')
  await expect(pp.locator('[data-stamp="arabic"]')).not.toContainText('checking')
  await expect(pp).not.toContainText(AZ)
  expectCleanConsole(consoleProblems)
})

// ── Əlçatanlıq (tests/e2e/a11y.spec.js ilə eyni qayda: ciddi/kritik pozuntu olmamalıdır) ──
async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): mozaika, şəhadətnamə forması, dəftər, kitabça; ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(90_000)
    const b = newBits(); for (let i = 0; i < 300; i++) setBit(b, i)
    await page.addInitScript(({ theme, life }) => {
      localStorage.setItem('muslim_cc_theme', theme)
      localStorage.setItem('quran_life_v1', life)
      localStorage.setItem('quran_khatm_plan', JSON.stringify({ days: 30, start: '2026-10-01', done: 604, log: ['2026-10-30'] }))
      localStorage.setItem('quran_notes_v1', JSON.stringify({ '1:2': { c: 'green', t: 'Qeyd', u: Date.UTC(2026, 10, 2), d: Date.UTC(2026, 10, 1) } }))
      localStorage.setItem('hifz_progress', JSON.stringify({ 1: 2 }))
    }, { theme, life: JSON.stringify({ v: 1, e: encodeBits(b), c: encodeBits(b), k: 0 }) })
    for (const base of ['', '/ar']) {
      await page.goto(`${base}/quran`)
      await settle(page)
      await reach(page, 'life-mosaic')
      const kc = await reach(page, 'khatm-certs')
      await kc.getByTestId('kcx-create').click()
      expect(await serious(page, ['[data-testid="life-mosaic"]', '[data-testid="khatm-certs"]'])).toEqual([])
      await page.goto(`${base}/analytics`)
      await settle(page)
      const pp = await reach(page, 'passport')
      await expect(pp.locator('[data-stamp="hifz_surah"]')).toHaveAttribute('data-earned', '')
      expect(await serious(page, ['[data-testid="passport"]'])).toEqual([])
    }
    await page.goto('/quran')
    await settle(page)
    await page.getByRole('button', { name: /Saxlanılanlar/ }).click()
    await expect(page.getByTestId('quran-notes')).toBeVisible()
    expect(await serious(page, ['[data-testid="quran-notes"]'])).toEqual([])
  })
}
