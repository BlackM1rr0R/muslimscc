// ═══════════════════════════════════════════════════════
// 1) "Namaz vaxtına görə" tema (utils/prayerTheme.js): sübhdən məğribə işıqlı,
//    məğribdən sübhə tünd; açıq səhifədə məğrib anında özü keçir; ilk kadr
//    index.html skriptindən düzgündür; şəhər yoxdursa — sistem rejimi + ipucu.
// 2) "Təsadüfi hədis" (/hadith): siyahıdan bir hədis açır, ardıcıl təkrarsız.
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'
import { computeTimes, CALC_METHODS } from '../../src/utils/prayCalc.js'
import { HADITH_IDS } from '../../src/seo/hadithIds.js'

const PAGE_IDS = new Set(HADITH_IDS)
/** Ünvan /hadith/<id>-dir və id indekslənən hədis səhifəsidir */
async function expectHadithPage(page) {
  await expect(page).toHaveURL(/\/hadith\/\d+$/)
  const id = new URL(page.url()).pathname.split('/').pop()
  expect(PAGE_IDS.has(id), `/hadith/${id} indekslənən səhifə deyil`).toBe(true)
  return id
}

const H = 3600000
// Bakı (UTC+4, yay vaxtı yoxdur), 2026-11-28 — saytın öz hesabı (Əbu Bəkr metodu)
const BAKU_CITY = { lat: 40.4093, lng: 49.8671 }
const T = computeTimes({ year: 2026, month: 11, day: 28 }, BAKU_CITY.lat, BAKU_CITY.lng, 4, CALC_METHODS.abubakr)
const at = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return Date.UTC(2026, 10, 28, h, m) - 4 * H }
const FAJR = at(T.fajr)
const MAGHRIB = at(T.maghrib)

/** Tərcihlər səhifənin skriptlərindən ƏVVƏL (fixtures.js qaydası) */
async function seed(page, { city = 'Baku', cache = null } = {}) {
  await page.addInitScript(([c, k]) => {
    try {
      localStorage.setItem('muslim_cc_a11y_prefs_v2', JSON.stringify({ theme: 'prayer' }))
      if (c) localStorage.setItem('muslim_cc_selected_city', c)
      if (k && !localStorage.getItem('muslim_cc_ptheme')) localStorage.setItem('muslim_cc_ptheme', k)
    } catch { /* */ }
  }, [city, cache && JSON.stringify(cache)])
}

const isDark = (page) => page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark')

test.describe('namaz vaxtına görə tema', () => {
  test('gündüz işıqlı, məğrib anında açıq səhifədə tündə keçir', async ({ page, consoleProblems }) => {
    await seed(page)
    await page.clock.install({ time: MAGHRIB - 20_000 })
    await page.goto('/about')
    await settle(page)
    await expect(page.locator('h1').first()).toBeVisible()
    // İdarəçi (tənbəl chunk) keşi yazıb — vaxtlar saytın hesabı ilə eynidir
    await expect.poll(() => page.evaluate(() => localStorage.getItem('muslim_cc_ptheme'))).not.toBeNull()
    const cache = JSON.parse(await page.evaluate(() => localStorage.getItem('muslim_cc_ptheme')))
    expect(cache).toEqual({ f: FAJR, m: MAGHRIB })
    expect(await isDark(page)).toBe(false)
    // Tək setTimeout məğribdə işə düşür
    await page.clock.runFor(40_000)
    await expect.poll(() => isDark(page)).toBe(true)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0a1016')
    expectCleanConsole(consoleProblems)
  })

  test('sübhdən əvvəl tünd, sübhdə işıqlı (günəşin çıxması keçid deyil)', async ({ page }) => {
    await seed(page)
    await page.clock.install({ time: FAJR - 30_000 })
    await page.goto('/about')
    await settle(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await expect.poll(() => isDark(page)).toBe(true)
    await page.clock.runFor(60_000)
    await expect.poll(() => isDark(page)).toBe(false)
  })

  test('ilk kadr: keşdən index.html skripti tünd temanı JS-siz qoyur', async ({ page }) => {
    // Gecə (yerli 23:00) — keş dünənki vaxtlardır, yenə də düzgün qərar
    await seed(page, { cache: { f: FAJR - 24 * H, m: MAGHRIB - 24 * H } })
    await page.clock.setFixedTime(at('23:00'))
    // Bütün JS paketləri bloklanır — yalnız inline tema skripti işləyir
    await page.route(/\/assets\/.*\.js(\?|$)/, (r) => r.abort())
    await page.goto('/about', { waitUntil: 'domcontentloaded' })
    expect(await isDark(page)).toBe(true)
  })

  test('şəhər yoxdursa — sistem rejimi və paneldə namaz vaxtları keçidi', async ({ page, isMobile }) => {
    // Köməkçi alətlər doku telefonda ilk açılışda yüklənmir (App.jsx → DockHost: geniş ekran və ya aktiv ayar)
    test.skip(isMobile, 'dok yalnız geniş ekranda')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript(() => {
      try { localStorage.setItem('muslim_cc_theme', 'light') } catch { /* */ }
    })
    await page.clock.setFixedTime(at('12:00'))
    await page.goto('/about')
    await settle(page)
    await expect(page.locator('h1').first()).toBeVisible()
    expect(await isDark(page)).toBe(false)   // saxlanmış "işıqlı" seçimi

    await page.getByRole('button', { name: 'Köməkçi alətlər' }).click()
    await page.getByRole('menuitem', { name: /Əlçatanlıq/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Əlçatanlıq' })
    await expect(dialog).toBeVisible()
    const btn = dialog.getByTestId('a11y-theme-prayer')
    await expect(btn).toContainText('Namaz vaxtına görə')
    await btn.click()
    await expect(btn).toHaveAttribute('aria-pressed', 'true')
    // Şəhər seçilməyib → sistem (qaranlıq), saxlanmış "light" sayılmır
    await expect.poll(() => isDark(page)).toBe(true)
    await expect.poll(() => page.evaluate(() => localStorage.getItem('muslim_cc_ptheme'))).toBe('{"s":1}')
    const hint = dialog.getByTestId('a11y-theme-prayer-hint')
    await expect(hint).toBeVisible()
    await expect(hint.getByRole('link', { name: 'namaz vaxtları' })).toHaveAttribute('href', '/prayer')

    // Rejimdən çıxanda keş silinir və əvvəlki qayda qayıdır
    await dialog.getByRole('button', { name: 'Avto' }).click()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('muslim_cc_ptheme'))).toBeNull()
    await expect.poll(() => isDark(page)).toBe(false)
  })
})

// Əlçatanlıq: paneldəki yeni düymə + ipucu (işıqlı/tünd, ərəbcə RTL) və hədis düyməsi
for (const [url, theme] of [['/about', 'light'], ['/about', 'dark'], ['/ar/about', 'light'], ['/ar/about', 'dark']]) {
  test(`axe: ${url} ${theme} — namaz teması seçimi açıq panel`, async ({ page, isMobile }) => {
    test.skip(isMobile, 'dok yalnız geniş ekranda')
    // Rejim açıq, şəhər yoxdur (ipucu görünür); tema sistemdən — emulateMedia ilə
    await page.emulateMedia({ colorScheme: theme })
    await seed(page, { city: null })
    await page.goto(url)
    await settle(page)
    await expect(page.locator('h1').first()).toBeVisible()
    await page.locator('.qm-dock-toggle').click()
    await page.getByRole('menuitem', { name: /Əlçatanlıq|إمكانية الوصول/ }).click()
    const dialog = page.locator('.a11y-panel[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByTestId('a11y-theme-prayer')).toHaveAttribute('aria-pressed', 'true')
    await expect(dialog.getByTestId('a11y-theme-prayer-hint')).toBeVisible()
    if (url.startsWith('/ar')) await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    const { violations } = await new AxeBuilder({ page }).include('.a11y-panel')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
    expect(violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
      .flatMap(v => v.nodes.map(n => `${v.id} · ${n.target.join(' ')}`))).toEqual([])
  })
}

test.describe('təsadüfi hədis', () => {
  test('düymə siyahıdan bir hədis açır, ardıcıl təkrarsız, klaviatura ilə', async ({ page, consoleProblems }) => {
    await page.goto('/hadith')
    await settle(page)
    await expect(page.locator('article.hadith-card').first()).toBeVisible()
    const btn = page.getByRole('button', { name: /^Təsadüfi hədis/ })
    await expect(btn).toBeVisible()
    await btn.click()
    await expectHadithPage(page)
    const focus = page.getByTestId('hadith-focus')
    await expect(focus).toBeVisible()
    await expect(focus).toBeFocused()
    await expect(focus.locator('article.hadith-card')).toHaveCount(1)
    const first = page.url()

    // Klaviatura: düyməyə fokus + Enter → başqa hədis
    await btn.focus()
    await page.keyboard.press('Enter')
    await expect(page).not.toHaveURL(first)
    await expectHadithPage(page)
    await expect(page.getByTestId('hadith-focus')).toBeVisible()
    expectCleanConsole(consoleProblems)
  })

  test('"Səhih və həsən" süzgəcində yalnız qəbul olunan hədis düşür', async ({ page }) => {
    await page.goto('/hadith')
    await settle(page)
    await expect(page.locator('article.hadith-card').first()).toBeVisible()
    await page.locator('.hadith-gradef__btn[data-tone="ok"]').click()
    let prev = ''
    for (let i = 0; i < 8; i++) {
      await page.getByRole('button', { name: /^Təsadüfi hədis/ }).click()
      if (prev) await expect(page).not.toHaveURL(prev)
      const id = await expectHadithPage(page)
      prev = page.url()
      const card = page.getByTestId('hadith-focus').locator('article.hadith-card')
      await expect(card.locator('.hadith-num')).toHaveText(`#${id}`)
      const grade = card.locator('[data-grade]')
      await expect(grade).toHaveCount(1)
      expect(['s', 'h', 'mq']).toContain(await grade.getAttribute('data-grade'))
    }
  })
})
