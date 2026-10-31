// ═══════════════════════════════════════════════════════
// Yer fotoları, xəritələr və xəttatlıq lövhələri
//   • hər <img>-in 5 dildə boş olmayan alt mətni, width/height (CLS yox),
//     srcset; hero-dan başqa hamısı loading="lazy"
//   • fotonun altında atribusiya (müəllif + lisenziya)
//   • xəritələr role="img" + başlıq; səhabə lövhəsi ərəbcə adı göstərir
//   • axe: ciddi əlçatanlıq pozuntusu yoxdur (işıqlı və qaranlıq)
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const LANGS = ['', '/en', '/ru', '/ar', '/tr']
const PAGES = ['/holyplaces', '/hajjguide', '/history']

for (const prefix of LANGS) {
  test(`${prefix || '/az'}: fotoların alt mətni, ölçüsü və atribusiyası`, async ({ page, consoleProblems }, info) => {
    test.skip(info.project.name === 'mobile' && prefix !== '' && prefix !== '/ar', 'mobil: az + ar')
    for (const p of PAGES) {
      await page.goto(`${prefix}${p}`)
      await settle(page)
      const imgs = page.locator('img.ph__img')
      expect(await imgs.count(), `${p}: foto var`).toBeGreaterThan(0)
      const bad = await imgs.evaluateAll(list => list
        .filter(i => !i.alt.trim() || !i.getAttribute('width') || !i.getAttribute('height') || !i.srcset.includes('1600'))
        .map(i => i.src))
      expect(bad, `${p}: alt/width/height/srcset`).toEqual([])
      // Hero-dakı birinci foto dərhal, qalanları tənbəl yüklənir
      const eager = await imgs.evaluateAll(list => list.filter(i => i.loading !== 'lazy').length)
      expect(eager).toBeLessThanOrEqual(1)
      // Hər fotonun altında "Foto/Photo/…: müəllif · lisenziya"
      await expect(page.locator('.ph__credit').first()).toContainText(/CC|Public domain/)
    }
    expectCleanConsole(consoleProblems)
  })
}

test('xəritələr: role="img", başlıq və təsvir; həcc və siyər xəritələri', async ({ page }) => {
  await page.goto('/hajjguide')
  await settle(page)
  const hajj = page.locator('.hg-media svg[role="img"]')
  await expect(hajj).toHaveCount(1)
  await expect(hajj.locator('title')).toHaveText(/Həcc/)
  await page.goto('/history')
  await settle(page)
  await page.getByRole('button', { name: /Tarixi hadisələr/ }).click()
  await expect(page.locator('.history-maps svg[role="img"]')).toHaveCount(3)
  await expect(page.getByRole('img', { name: /Hicrət yolu/ })).toBeVisible()
})

test('səhabə: kartda və profildə xəttatlıq lövhəsi (canlı təsvir yoxdur)', async ({ page, isMobile }) => {
  await page.goto('/sahaba')
  await settle(page)
  // Səhabə səhifələrində heç bir foto/şəkil yoxdur — yalnız yazı və naxış
  await expect(page.locator('.sahabe-page img')).toHaveCount(0)
  if (!isMobile) await expect(page.locator('.sahabe-card .cq').first()).toContainText('أبو بكر الصديق')
  await page.goto('/sahaba/aisha-bint-abi-bakr')
  await settle(page)
  const plaque = page.locator('.sp-hero .cq')
  await expect(plaque).toBeVisible()
  await expect(plaque).toContainText('عائشة بنت أبي بكر')
  await expect(plaque).toContainText('عَنْهَا')   // qadın səhabə — "رَضِيَ اللهُ عَنْهَا" (hərəkəli)
  await expect(plaque).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('.sahabe-page img')).toHaveCount(0)
})

for (const theme of ['light', 'dark']) {
  test(`axe (${theme}): müqəddəs yerlər, həcc, tarix, səhabə — ciddi pozuntu yoxdur`, async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'kompüterdə kifayətdir')
    await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* yaddaş bağlıdır */ } }, theme)
    for (const url of ['/holyplaces', '/hajjguide', '/history', '/sahaba', '/sahaba/abu-bakr-as-siddiq', '/ar/holyplaces']) {
      await page.goto(url)
      await settle(page)
      if (url === '/history') await page.getByRole('button', { name: /Tarixi hadisələr/ }).click()
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze()
      const serious = violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
        .flatMap(v => v.nodes.map(n => `${url} · ${v.id} · ${n.target.join(' ')}`))
      expect(serious).toEqual([])
    }
  })
}
