// ═══════════════════════════════════════════════════════
// "Ramazana hazırlıq yolu" (/road-to-ramadan) və "Son 10 gecə" (/last-ten-nights)
//   • yol: geri sayım (Ümmül-Qura: Ramazan 1448 = 2027-02-08), bugünkü addım bələdçidən sitatla (mənbə),
//     işarə yadda qalır (ramadan_prep_v1), gələcək addımlar kilidli, bütün yol açılır
//   • son 10 gecə: aktiv gecə (21-ci, tək), işarələr, Qədr gecəsinin duası mənbəsi ilə (Tirmizi 3513),
//     etikaf rejimi (dialoq: fokus, aria-pressed, sayğac, Esc → fokus düyməyə qayıdır); önizləmədə işarə bağlıdır
//   • İmsakiyyə səhifəsindən keçidlər; axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// Saat sabitdir (page.clock) — Bakı vaxtı ilə (+04:00), Node prosesinin yerli tarixindən asılı deyil.
// Şəbəkə: yeni /api YOXDUR — hər şey saytın öz məlumatı və brauzerin Intl Ümmül-Qura təqvimidir.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

const at = (iso) => new Date(`${iso}+04:00`)   // Bakı vaxtı
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('ramadan_prep_v1') || 'null'))

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

// ── 1. Yol: Ramazana 5 gün qalıb → "İftar duasını öyrənin" ──
test('yol: geri sayım, bugünkü addım mənbəli dua ilə, işarə yadda qalır, gələcək addım kilidli', async ({ page, consoleProblems }) => {
  await page.clock.setFixedTime(at('2027-02-03T10:00:00'))
  await page.goto('/en/road-to-ramadan')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Road to Ramadan')
  await expect(page.getByTestId('rpp-days-left')).toHaveText('5 days until Ramadan')
  await expect(page.getByTestId('rpp-dial')).toHaveAttribute('aria-label', /5 days until Ramadan\. Expected start: 8 Feb 2027/)

  const today = page.getByTestId('rpp-today-step')
  await expect(today.getByRole('heading', { level: 3 })).toHaveText('Learn the iftar dua')
  // Dua — saytın Ramazan bələdçisindən, olduğu kimi, mənbəsi ilə
  const quote = today.getByTestId('rpp-quote-suhoor-iftar-dua')
  await expect(quote).toContainText('ذَهَبَ الظَّمَأُ')
  await expect(quote).toContainText('Abu Dawud 2357')
  await expect(today.getByRole('link', { name: /Sunnahs of suhoor and iftar/ })).toHaveAttribute('href', '/en/ramadan#rp-g-suhoor-iftar')

  await expect(page.getByTestId('rpp-progress')).toContainText('0 of 86 steps done')
  await today.getByLabel('I did this step').check()
  await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toHaveCount(1)
  await expect(page.getByTestId('rpp-progress')).toContainText('1 of 86 steps done')
  expect((await store(page)).r['1448']).toEqual({ 5: '2027-02-03' })

  // Gələcək addım kilidli (işarə qutusu yoxdur), sabahkı — "Ramadan guide: Zakat al-Fitr"
  const tomorrow = page.getByTestId('rpp-step-4')
  await expect(tomorrow).toContainText('Opens on 4 Feb 2027')
  await expect(tomorrow.getByRole('checkbox')).toHaveCount(0)

  // Bütün yol: 90 addım (bugünkü yuxarıda ayrıca)
  await page.getByTestId('rpp-all').click()
  await expect(page.getByTestId('rpp-road').locator('> li')).toHaveCount(89)
  await expect(page.getByTestId('rpp-step-90')).toContainText('Count your missed fasts')
  await expect(page.getByTestId('rpp-step-90').getByTestId('rpp-quote-exempt-note')).toContainText('Bukhari 1950')

  await page.reload()
  await settle(page)
  await expect(page.getByTestId('rpp-today-step').getByLabel('I did this step')).toBeChecked()
  expectCleanConsole(consoleProblems)
})

// ── 2. Son 10 gecə — aktiv: 21-ci gecə (Ramazanın 20-si, axşam) ──
test('son 10 gecə: 21-ci gecə aktivdir və təkdir, işarələr, dua mənbəsi ilə, etikaf rejimi', async ({ page, consoleProblems }) => {
  await page.clock.setFixedTime(at('2027-02-27T22:00:00'))
  await page.goto('/en/last-ten-nights')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Last ten nights')
  await expect(page.getByTestId('rpp-nights-status')).toContainText('Tonight: Night 21')

  const n21 = page.getByTestId('rpp-night-21')
  await expect(n21).toHaveAttribute('aria-current', 'date')
  await expect(n21).toContainText('Odd night')
  await expect(page.getByTestId('rpp-night-22')).not.toContainText('Odd night')
  await expect(page.getByTestId('rpp-night-22').getByRole('checkbox').first()).toBeDisabled()
  await n21.getByLabel(/Night prayer \(qiyam\)/).check()
  await expect(n21).toContainText('1 of 5 done')
  expect((await store(page)).t['1448']).toEqual({ '21.qiyam': '2027-02-27' })

  // Qədr gecəsinin duası — Tirmizi 3513 (bələdçidən)
  const dua = page.getByTestId('rpp-dua')
  await expect(dua).toContainText('اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي')
  await expect(dua).toContainText('Tirmidhi 3513 (al-Albani: sahih)')

  // Etikaf rejimi
  const open = page.getByTestId('rpp-focus-open')
  await open.click()
  const dlg = page.getByRole('dialog', { name: 'Night 21' })
  await expect(dlg).toBeVisible()
  await expect(dlg.getByRole('heading', { name: 'Night 21' })).toBeFocused()
  await expect(dlg.getByTestId('rpp-focus-qiyam')).toHaveAttribute('aria-pressed', 'true')
  await dlg.getByTestId('rpp-focus-quran').click()
  await expect(dlg.getByTestId('rpp-focus-quran')).toHaveAttribute('aria-pressed', 'true')
  await expect(dlg.getByTestId('rpp-focus-duatext')).toContainText('Tirmidhi 3513')
  await dlg.getByTestId('rpp-focus-tap').click()
  await dlg.getByTestId('rpp-focus-tap').click()
  await expect(dlg.getByTestId('rpp-focus-tap')).toContainText('2')
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await page.waitForFunction(() => !history.state?.qmOverlay)
  await expect(open).toBeFocused()
  await expect(n21.getByLabel(/^Quran/)).toBeChecked()
  expect(Object.keys((await store(page)).t['1448']).sort()).toEqual(['21.qiyam', '21.quran'])
  expectCleanConsole(consoleProblems)
})

// ── 3. Önizləmə: ilin qalan vaxtı ──
test('son 10 gecə: önizləmədə geri sayım, işarələr bağlıdır; İmsakiyyədən keçid', async ({ page, consoleProblems }) => {
  await page.clock.setFixedTime(at('2026-11-24T12:00:00'))
  await page.goto('/en/last-ten-nights')
  await settle(page)
  await expect(page.getByTestId('rpp-nights-status')).toContainText('The last ten nights begin in 95 days')
  await expect(page.getByTestId('rpp-nights-status')).toContainText('Night 21 begins on the evening of 27 Feb 2027')
  await expect(page.getByTestId('rpp-nights').getByRole('checkbox').first()).toBeDisabled()
  await expect(page.getByTestId('rpp-nights').locator('.rpp-night.is-odd')).toHaveCount(5)
  // Etikaf rejimi önizləmədə açılır, düymələr bağlıdır
  await page.getByTestId('rpp-focus-open').click()
  await expect(page.getByTestId('rpp-focus-qiyam')).toBeDisabled()
  await page.getByTestId('rpp-focus-close').click()
  await expect(page.getByTestId('rpp-focus')).toHaveCount(0)
  await page.waitForFunction(() => !history.state?.qmOverlay)

  // İki səhifə arasında keçid (SPA)
  await page.getByTestId('rpp-switch-road').click()
  await expect(page).toHaveURL(/\/en\/road-to-ramadan$/)
  // Səhifə keçidində (PageTransition, AnimatePresence) köhnə <main> çıxış animasiyası bitənə qədər DOM-da
  // qalır — iki səhifədə də rpp-days-left var (strict mode, CI mobil). Yeni səhifənin <main>-inə bağla.
  const road = page.getByRole('main').filter({ has: page.getByRole('heading', { level: 1, name: 'Road to Ramadan' }) })
  await expect(road.getByTestId('rpp-days-left')).toHaveText('76 days until Ramadan')

  // İmsakiyyə səhifəsindən keçidlər
  await page.goto('/en/ramadan')
  await settle(page)
  const links = page.getByTestId('rp-prep-links')
  await expect(links.getByRole('link', { name: 'Road to Ramadan' })).toHaveAttribute('href', '/en/road-to-ramadan')
  await expect(links.getByRole('link', { name: 'Last ten nights' })).toHaveAttribute('href', '/en/last-ten-nights')
  expectCleanConsole(consoleProblems)
})

// ── 4. a11y (açıq + tünd), ərəbcə RTL ──
for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): yol və son 10 gecə, etikaf rejimi, ərəbcə RTL`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.clock.setFixedTime(at('2027-02-27T22:00:00'))
    await page.addInitScript((th) => localStorage.setItem('muslim_cc_theme', th), theme)
    for (const base of ['/en', '/ar']) {
      await page.goto(`${base}/road-to-ramadan`)
      await settle(page)
      if (base === '/ar') await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
      await expect(page.getByTestId('rpp-ramadan')).toBeVisible()
      expect(await serious(page, ['.rpp-page']), `${base} road`).toEqual([])
      await page.goto(`${base}/last-ten-nights`)
      await settle(page)
      await expect(page.getByTestId('rpp-night-21')).toHaveAttribute('aria-current', 'date')
      expect(await serious(page, ['.rpp-page']), `${base} nights`).toEqual([])
      await page.getByTestId('rpp-focus-open').click()
      await expect(page.getByTestId('rpp-focus')).toBeVisible()
      expect(await serious(page, ['.rpp-focus']), `${base} focus`).toEqual([])
      await page.keyboard.press('Escape')
      await expect(page.getByTestId('rpp-focus')).toHaveCount(0)
      await page.waitForFunction(() => !history.state?.qmOverlay)
    }
  })
}

// ── 5. 360px: üfüqi daşma yoxdur ──
test('360px: yol, son 10 gecə və etikaf rejimində üfüqi daşma yoxdur', async ({ page }) => {
  test.setTimeout(90_000)
  await page.clock.setFixedTime(at('2027-02-03T10:00:00'))
  await page.setViewportSize({ width: 360, height: 740 })
  const over = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  for (const base of ['/en', '/ar', '/ru']) {
    await page.goto(`${base}/road-to-ramadan`)
    await settle(page)
    await expect(page.getByTestId('rpp-today-step')).toBeVisible()
    expect(await over(), `${base} road`).toBeLessThanOrEqual(1)
    await page.goto(`${base}/last-ten-nights`)
    await settle(page)
    await expect(page.getByTestId('rpp-night-30')).toBeAttached()
    expect(await over(), `${base} nights`).toBeLessThanOrEqual(1)
    await page.getByTestId('rpp-focus-open').click()
    await expect(page.getByTestId('rpp-focus')).toBeVisible()
    expect(await over(), `${base} focus`).toBeLessThanOrEqual(1)
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('rpp-focus')).toHaveCount(0)
    await page.waitForFunction(() => !history.state?.qmOverlay)
  }
})
