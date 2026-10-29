// ═══════════════════════════════════════════════════════
// Əlçatanlıq (axe-core): əsas səhifələrdə "critical" və "serious"
// pozuntu olmamalıdır — işıqlı və qaranlıq rejimdə, kompüter və telefonda.
//
// Yoxlanılır: WCAG 2.0/2.1 A + AA və axe "best-practice" qaydaları.
// Animasiyalar testdə söndürülüb (reducedMotion: 'reduce' — playwright.config):
// reveal/keçid ortasında yarımşəffaf mətn kontrastı yalan nəticə verməsin.
//
// Müvəqqəti istisnalar (EXCLUDE) — yalnız BU agentin sahəsindən kənar,
// səbəbi yazılmış elementlər. Qaydanın özü heç yerdə söndürülmür.
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle } from './fixtures.js'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']

// Hazırda istisna yoxdur. (Ana səhifənin .hp-tw-facts / .hp-tw-info zolaqları
// əvvəl istisna idi — scrollable-region-focusable; indi tabIndex={0} +
// role="region" + aria-label alıblar, HomePage.jsx → TW_REGION.)
const EXCLUDE = []

/** Səhifədəki critical/serious pozuntular — oxunaqlı siyahı kimi */
async function seriousViolations(page) {
  let builder = new AxeBuilder({ page }).withTags(TAGS)
  for (const sel of EXCLUDE) builder = builder.exclude(sel)
  const { violations } = await builder.analyze()
  return violations
    .filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

const PAGES = ['/', '/prayer', '/quran', '/hadith', '/about', '/zakat', '/ar', '/calendar', '/charity', '/jamaat', '/aichat', '/en/prayer', '/ar/zakat']

for (const theme of ['light', 'dark']) {
  test.describe(`${theme === 'dark' ? 'qaranlıq' : 'işıqlı'} rejim`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* yaddaş bağlıdır */ } }, theme)
    })

    for (const url of PAGES) {
      test(`${url}: ciddi əlçatanlıq pozuntusu yoxdur`, async ({ page }, info) => {
        test.skip(info.project.name === 'mobile' && !['/', '/prayer', '/ar', '/zakat'].includes(url), 'mobil: əsas səhifələr')
        await page.goto(url)
        await settle(page)
        await expect(page.locator('h1').first()).toBeVisible()
        expect(await seriousViolations(page)).toEqual([])
      })
    }

    test('telefon menyusu açıq: ciddi pozuntu yoxdur', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'menyu düyməsi yalnız telefonda')
      await page.goto('/')
      await settle(page)
      await page.getByRole('button', { name: 'Menyu', exact: true }).click()
      await expect(page.getByRole('dialog').first()).toBeVisible()
      expect(await seriousViolations(page)).toEqual([])
    })

    test('şəhər seçicisi açıq: ciddi pozuntu yoxdur', async ({ page }) => {
      await page.goto('/prayer')
      await settle(page)
      await page.getByRole('button', { name: /Şəhəri dəyiş/ }).first().click()
      await expect(page.getByRole('dialog', { name: 'Şəhər seçin' })).toBeVisible()
      expect(await seriousViolations(page)).toEqual([])
    })
  })
}

// Admin paneli: hər bölmə (formalar daxil). Giriş sessionStorage ilə;
// Firestore fikstürdə bağlıdır — heç nə yazılmır.
test('admin paneli: bütün bölmələrdə sahələrin adı var, ciddi pozuntu yoxdur', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile', 'masaüstü kifayətdir')
  test.setTimeout(90_000)
  await page.addInitScript(() => sessionStorage.setItem('muslim_cc_admin', 'true'))
  await page.goto('/admin')
  await settle(page)
  const nav = page.locator('.admin-nav-btn')
  const n = await nav.count()
  expect(n).toBeGreaterThan(10)
  const problems = []
  for (let i = 0; i < n; i++) {
    await nav.nth(i).click()
    await expect(page.locator('.admin-main h1')).toBeVisible()
    // Hər <input>/<select>/<textarea> öz <label>-ı (htmlFor) və ya aria-label ilə adlanır
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('.admin-main input:not([type=hidden]):not([hidden]), .admin-main select, .admin-main textarea')]
      .filter(el => !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
      .map(el => `${el.tagName.toLowerCase()} placeholder="${el.placeholder || ''}"`))
    problems.push(...unnamed.map(u => `bölmə ${i}: adsız sahə ${u}`))
    problems.push(...(await seriousViolations(page)).map(v => `bölmə ${i}: ${v}`))
  }
  expect(problems).toEqual([])
})
