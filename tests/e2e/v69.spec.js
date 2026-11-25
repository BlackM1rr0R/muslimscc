// ═══════════════════════════════════════════════════════
// v6.9: hədisin rəsmi az tərcüməsi + şərh, ravi → səhabə, səhabənin rəvayətləri,
// hədis əzbərləmə, İsra və Merac, zikr mozaikası
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle, expectCleanConsole, reach } from './fixtures.js'

const axe = async (page, sel) => {
  const { violations } = await new AxeBuilder({ page }).include(sel)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))
}

test('tam mətn: rəsmi az tərcüməsi və şərh (HadeethEnc), ravi keçidi səhabəyə aparır', async ({ page, consoleProblems }) => {
  await page.goto('/hadith/14')
  await settle(page)
  const card = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await card.getByTestId('hadith-full-btn').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg.locator('.hfull__tr').first()).toContainText('qəzəb zamanı')
  await expect(dlg.locator('.hfull__expl')).toBeVisible()
  await expect(dlg.getByRole('link', { name: 'Mənbədə aç' })).toHaveAttribute('href', /hadeethenc\.com\/az\/browse\/hadith\/\d+/)
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  // Bağlanan pəncərə öz tarixçə girişini history.back() ilə (setTimeout 0) götürür. Ondan ƏVVƏL
  // linkə basılsa, gecikmiş back() yeni /sahaba girişindən /hadith/14-ə qaytarır — bölmə heç gəlmir
  await page.waitForFunction(() => !history.state?.qmOverlay)
  await card.getByRole('link', { name: 'Əbu Hureyrə' }).click()
  await expect(page).toHaveURL(/\/sahaba\/abu-hurairah$/)
  const n = page.getByTestId('sahaba-narrations')
  await n.scrollIntoViewIfNeeded()
  await expect(n.locator('li')).toHaveCount(6)
  await n.getByRole('button', { name: /Hamısını göstər/ }).click()
  expect(await n.locator('li').count()).toBeGreaterThan(100)
  expectCleanConsole(consoleProblems)
})

test('hədis əzbərləmə: sevimlilər → kart, ərəbcə, "Bildim" növbəni azaldır', async ({ page }) => {
  // Səhifə skriptlərindən ƏVVƏL yaz. goto → setItem → reload ardıcıllığında HadithPage-in [favs]
  // effekti (mount-da localStorage-ə yazır) boş massivi setItem-dən SONRA yaza bilirdi → reload-dan
  // sonra sevimli yoxdur, əzbər zolağı görünmür (CI mobil, 3 dəfə, 2026-11-25)
  await page.addInitScript(() => {
    if (!localStorage.getItem('hadith_favs')) localStorage.setItem('hadith_favs', '[1,3]')
  })
  await page.goto('/hadith')
  await settle(page)
  await page.locator('.hadith-chip-fav').click()
  const bar = page.getByTestId('hadith-mem-bar')
  await expect(bar).toContainText('2 təkrar gözləyir')
  await bar.getByRole('button', { name: 'Əzbərlə' }).click()
  const dlg = page.getByRole('dialog')
  await expect(dlg).toContainText('2 qaldı')
  await dlg.getByRole('button', { name: 'Ərəbcəni göstər' }).click()
  await expect(dlg.getByTestId('hmem-ar')).toBeVisible()
  expect(await axe(page, '[role=dialog]')).toEqual([])
  await dlg.getByRole('button', { name: 'Bildim' }).click()
  await expect(dlg).toContainText('1 qaldı')
  await dlg.getByRole('button', { name: 'Ərəbcəni göstər' }).click()
  await dlg.getByRole('button', { name: 'Bildim' }).click()
  await expect(dlg.getByTestId('hmem-done')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(bar).toContainText('Bu gün təkrar yoxdur')
})

for (const theme of ['light', 'dark']) {
  test(`İsra və Merac: ayə, 7 səma, əlçatanlıq (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/history')
    await settle(page)
    // DeferRender — yer tutucuya qədər gətirilir (fixtures.js → reach). Əvvəl .history-maps-pair-ə
    // scrollIntoViewIfNeeded + kor scrollBy idi: yuxarıda bölmələr qurulduqca element "stable" olmurdu
    const j = await reach(page, 'isra-journey')
    await expect(j.locator('.isj__stop')).toHaveCount(9)
    await expect(j.locator('.isj__ar')).toContainText('ٱلْمَسْجِدِ ٱلْأَقْصَا')
    await expect(j.locator('.isj__stop').nth(8)).toContainText('İbrahim')
    expect(await axe(page, '[data-testid=isra-journey]')).toEqual([])
  })

  test(`Nur mozaikası (zikr): say və əlçatanlıq (${theme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    // səhifə skriptlərindən əvvəl yaz (goto → setItem → reload yox — TEAM.md, e2e dərsləri)
    await page.addInitScript(() => { if (!localStorage.getItem('dhikr_count_total')) localStorage.setItem('dhikr_count_total', '245') })
    await page.goto('/dhikr')
    await settle(page)
    const m = page.getByTestId('nur-mosaic')
    await m.scrollIntoViewIfNeeded()
    await expect(m).toContainText('47')
    await expect(m.locator('.nm__tile.is-lit')).toHaveCount(47)
    expect(await axe(page, '[data-testid=nur-mosaic]')).toEqual([])
  })
}

test('isnad zənciri, kartın şərh üzü və Story düyməsi', async ({ page, consoleProblems }) => {
  await page.goto('/hadith/1')
  await settle(page)
  const card = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await expect(card.getByRole('link', { name: 'Kart yarat' })).toHaveAttribute('href', /\/quotes\?.*hadith=1/)
  await card.getByTestId('hadith-full-btn').click()
  const chain = page.getByRole('dialog').getByTestId('isnad-chain')
  await expect(chain.locator('.isn__node')).toHaveCount(6)   // Buxari + 4 ravi + Peyğəmbər ﷺ
  await expect(chain.locator('.isn__node').last()).toContainText('Peyğəmbər')
  expect(await axe(page, '[role=dialog]')).toEqual([])
  await page.keyboard.press('Escape')
  // pəncərənin gecikmiş history.back()-i yeni goto ilə toqquşmasın
  await page.waitForFunction(() => !history.state?.qmOverlay)
  await page.goto('/hadith/14')
  await settle(page)
  const c14 = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await c14.getByTestId('hadith-flip-btn').click()
  await expect(c14).toHaveClass(/is-flipped/)
  await expect(c14.locator('.hadith-back__x')).toContainText('qəzəb')
  await c14.getByRole('button', { name: 'Hədisə qayıt' }).click()
  await expect(c14).not.toHaveClass(/is-flipped/)
  expectCleanConsole(consoleProblems)
})

test('fon səsi: 4 təbiət səsi seçilir, söndürülür, xəta yoxdur', async ({ page, consoleProblems }) => {
  await page.goto('/dhikr')
  await settle(page)
  const btn = page.getByTestId('ambient-btn')
  await btn.click()
  const panel = page.getByTestId('ambient-panel')
  for (const name of ['Yağış', 'Külək', 'Dəniz', 'Gecə']) {
    await panel.getByRole('button', { name }).click()
    await expect(panel.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true')
    await page.waitForTimeout(300)
  }
  await expect(btn).toContainText('Gecə')
  expect(await axe(page, '[data-testid=ambient-panel]')).toEqual([])
  await panel.getByRole('button', { name: 'Söndür' }).click()
  await expect(btn).toContainText('Fon səsi')
  expectCleanConsole(consoleProblems)
})

for (const theme of ['light', 'dark']) {
  test(`planetari: göy çəkilir, vaxt sürgüsü, əlçatanlıq (${theme})`, async ({ page, consoleProblems }) => {
    await page.clock.setFixedTime(new Date('2026-11-15T19:30:00Z'))
    await page.emulateMedia({ colorScheme: theme })
    await page.goto('/qibla#sema')
    await settle(page)
    const s = await reach(page, 'sky-planetarium')
    await expect(s.locator('canvas')).toBeVisible()
    const label = s.locator('.skyp__time b')
    const before = await label.textContent()
    await s.locator('input[type=range]').fill('3')
    await expect(label).not.toHaveText(before)
    await s.getByRole('button', { name: 'İndi' }).click()
    await expect(label).toHaveText(before)
    expect(await axe(page, '[data-testid=sky-planetarium]')).toEqual([])
    expectCleanConsole(consoleProblems)
  })
}

test('usturlab: Günəşi üfüqə gətirəndə vaxt Bakının çıxış/batış vaxtına yaxındır', async ({ page, consoleProblems }) => {
  await page.clock.setFixedTime(new Date('2026-11-15T19:30:00Z'))
  await page.goto('/history#elm')
  await settle(page)
  const a = await reach(page, 'astrolabe')
  await a.getByRole('button', { name: 'Günəş çıxır' }).click()
  await expect(a.getByTestId('al-time')).toHaveText(/07:2\d/)
  await a.getByRole('button', { name: 'Günəş batır' }).click()
  await expect(a.getByTestId('al-time')).toHaveText(/17:2\d/)
  expect(await axe(page, '[data-testid=astrolabe]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('"Məscidi qur": sürüşdürdükcə addımlar 1 → 7, əlçatanlıq', async ({ page, consoleProblems }) => {
  await page.goto('/mosques')
  await settle(page)
  const m = await reach(page, 'mosque-builder')
  const step = m.getByTestId('mosque-step')
  const go = async (f) => {
    await m.evaluate((el, ff) => { const r = el.getBoundingClientRect(); window.scrollTo(0, r.top + window.scrollY + (el.offsetHeight - window.innerHeight) * ff) }, f)
  }
  await go(0.02)
  await expect(step).toContainText('1 / 7')
  await go(0.99)
  await expect(step).toContainText('7 / 7')
  await expect(step).toContainText('Minarə')
  expect(await axe(page, '[data-testid=mosque-builder]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

// Canlı saytda admin panelindən gələn surət (admin id-si) yerli hədislə birləşir —
// /hadith/<yerli id> fokus kartı, ravi, tam mətn yenə də yerli id ilə tapılmalıdır
test('admin surəti ilə birləşmiş hədis: fokus kartı, ravi və tam mətn işləyir', async ({ page }) => {
  await page.route((u) => u.pathname === '/api/content/hadiths', route => route.fulfill({ json: [{
    id: 'AdminDocAbc123', ar: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ عِنْدَ الغَضَبِ',
    text: { az: 'Güclü pəhləvan deyil; güclü qəzəb zamanı özünü saxlayan şəxsdir.' }, source: 'Buxari 6114', category: 'Character',
  }] }))
  await page.goto('/hadith/14')
  await settle(page)
  const card = page.getByTestId('hadith-focus').locator('article.hadith-card')
  await expect(card.locator('.hadith-num')).toHaveText('#14')
  await expect(card.locator('.hadith-narr')).toContainText('Əbu Hureyrə')
  await expect(card.getByTestId('hadith-full-btn')).toBeVisible()
  await expect(card.getByTestId('hadith-flip-btn')).toBeVisible()
})
