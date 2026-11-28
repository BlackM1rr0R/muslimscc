// ═══════════════════════════════════════════════════════
// /quran-history — "Quran necə toplandı": 6 mərhələli scrollytelling
//   • səhifə açılır, 6 mərhələ, hər birində mənbə sətri; Buxari 4986/4987 sunnah.com linkləri
//   • azaldılmış hərəkət (config defoltu) → statik düzülüş: yapışıq səhnə gizli, hər mərhələnin öz şəkli
//   • hərəkətə icazə → yapışıq səhnə; sürüşmə aktiv mərhələni dəyişir (IntersectionObserver)
//   • irəliləyiş nöqtəsi → mərhələyə keçid, başlığa fokus, aria-current="step"
//   • Quran səhifəsindən link; axe (açıq + tünd), ərəbcə RTL, 360px-də üfüqi daşma yoxdur
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

const IDS = ['hira', 'revelation', 'yamama', 'suhuf', 'uthman', 'today']

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}

async function open(page, path = '/en/quran-history') {
  await page.goto(path)
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('qh-scene')).toHaveCount(6)
}

// Mərhələni səhifənin "oxu xəttinə" gətir (səhifədəki IO ilə eyni: telefonda ~67%, masaüstündə ~49%)
async function scrollToScene(page, id) {
  await page.locator(`#step-${id}`).evaluate((el) => {
    const narrow = window.innerWidth < 900
    const y = el.getBoundingClientRect().top - window.innerHeight * (narrow ? 0.62 : 0.4)
    window.scrollBy(0, y)
  })
}

test('səhifə açılır: 6 mərhələ, mənbələr, sitatlar və Quran/mushaf linkləri', async ({ page, consoleProblems }) => {
  await open(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How the Quran was compiled')
  for (const id of IDS) await expect(page.locator(`#step-${id}`)).toBeAttached()
  // Hər mərhələdə mənbə sətri
  await expect(page.getByTestId('qh-sources')).toHaveCount(6)
  // Yəmamə və Həfsə — Buxari 4986, Osman — Buxari 4987 (sunnah.com, yeni tabda)
  const y = page.locator('#step-yamama')
  await expect(y.getByRole('link', { name: /Bukhari 4986/ })).toHaveAttribute('href', 'https://sunnah.com/bukhari:4986')
  await expect(page.locator('#step-suhuf').getByRole('link', { name: /Bukhari 4986/ })).toHaveAttribute('href', 'https://sunnah.com/bukhari:4986')
  const u = page.locator('#step-uthman')
  await expect(u.getByRole('link', { name: /Bukhari 4987/ })).toHaveAttribute('href', 'https://sunnah.com/bukhari:4987')
  await expect(u.getByRole('link', { name: /Bukhari 4987/ })).toHaveAttribute('target', '_blank')
  // Hədis sitatı + saytın hədis kitabxanasına link
  await expect(page.locator('#step-revelation').getByTestId('qh-quote')).toContainText('الْعُسُبِ')
  await expect(y.getByRole('link', { name: 'In the site’s hadith library' }).first()).toHaveAttribute('href', '/en/hadith-library#bukhari/66/4986')
  // İlk vəhy: ərəb mətni + Quran oxuyucusuna link
  const hira = page.locator('#step-hira')
  await expect(hira.getByTestId('qh-ayahs')).toContainText('عَلَقٍ')
  await expect(hira.getByRole('link', { name: 'Quran 96:1-5' })).toHaveAttribute('href', /\/en\/quran\/96-[a-z-]+\?a=1$/)
  // Osman: şəhərlər + tarixçilərin rəyi qeydi
  await expect(u.getByTestId('qh-cities')).toContainText('Kufa')
  await expect(u.getByTestId('qh-cities')).toContainText('historians')
  // Bu gün: /quran və /mushaf
  await expect(page.getByTestId('qh-open-quran')).toHaveAttribute('href', '/en/quran')
  await expect(page.getByTestId('qh-open-mushaf')).toHaveAttribute('href', '/en/mushaf')
  await expect(page.locator('[role="alert"]:empty')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('azaldılmış hərəkət: statik ardıcıl düzülüş (səhnə gizli, hər mərhələnin öz şəkli)', async ({ page }) => {
  await open(page)
  await expect(page.getByTestId('qh-stage')).toBeHidden()
  const figs = page.locator('.qh-scene__fig')
  await expect(figs).toHaveCount(6)
  for (let i = 0; i < 6; i++) await expect(figs.nth(i)).toBeVisible()
  // Kartlar tam görünür (sönük/sürüşmüş deyil)
  const op = await page.locator('#step-uthman .qh-card').evaluate(el => getComputedStyle(el).opacity)
  expect(op).toBe('1')
})

test('sayt seçimi "hərəkəti azalt" (html.a11y-motion-user) da statik düzülüş verir', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await open(page)
  await expect(page.getByTestId('qh-stage')).toBeVisible()
  await page.evaluate(() => document.documentElement.classList.add('a11y-motion-user'))
  await expect(page.getByTestId('qh-stage')).toBeHidden()
  await expect(page.locator('#step-hira .qh-scene__fig')).toBeVisible()
})

test.describe('hərəkətə icazə', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('sürüşmə aktiv mərhələni və səhnəni dəyişir; nöqtə ilə keçid başlığa fokus verir', async ({ page, consoleProblems }) => {
    await open(page)
    const svg = page.getByTestId('qh-stage-svg')
    await expect(page.getByTestId('qh-stage')).toBeVisible()
    await expect(svg).toHaveAttribute('data-active', 'hira')
    await expect(page.locator('#step-hira .qh-scene__fig')).toBeHidden()
    await expect(page.getByTestId('qh-dot-hira')).toHaveAttribute('aria-current', 'step')

    await scrollToScene(page, 'yamama')
    await expect(svg).toHaveAttribute('data-active', 'yamama')
    await expect(page.locator('#step-yamama')).toHaveClass(/is-active/)
    await expect(svg.locator('g.qh-a[data-scene="yamama"]')).toHaveClass(/is-on/)
    await expect(page.getByTestId('qh-progress-now')).toContainText('Stage 3 of 6')

    await scrollToScene(page, 'uthman')
    await expect(svg).toHaveAttribute('data-active', 'uthman')
    await expect(page.getByTestId('qh-dot-uthman')).toHaveAttribute('aria-current', 'step')

    // Nöqtə düyməsi → mərhələ, başlığa fokus
    await page.getByTestId('qh-dot-suhuf').click()
    await expect(page.locator('#step-suhuf-h')).toBeFocused()
    await expect(svg).toHaveAttribute('data-active', 'suhuf')
    // Klaviatura
    await page.getByTestId('qh-dot-today').focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('#step-today-h')).toBeFocused()
    await expect(page.getByTestId('qh-dot-today')).toHaveAttribute('aria-current', 'step')
    expectCleanConsole(consoleProblems)
  })
})

test('Quran səhifəsindən keçid', async ({ page }) => {
  await page.goto('/en/quran')
  await settle(page)
  const more = page.getByTestId('qp-history-more')
  await more.scrollIntoViewIfNeeded()
  await expect(more).toHaveAttribute('href', '/en/quran-history')
  await more.click()
  await expect(page.getByRole('heading', { level: 1, name: 'How the Quran was compiled' })).toBeVisible()
  await expect(page).toHaveURL(/\/en\/quran-history$/)
})

for (const theme of ['light', 'dark']) {
  test(`a11y (${theme}): ingiliscə və ərəbcə (RTL)`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.addInitScript((th) => { localStorage.setItem('muslim_cc_theme', th) }, theme)
    for (const base of ['/en', '/ar']) {
      await open(page, `${base}/quran-history`)
      if (base === '/ar') {
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('كيف جُمع القرآن')
      }
      expect(await serious(page, ['.qh-page']), `${base}/quran-history (${theme})`).toEqual([])
    }
  })
}

test('360px: üfüqi daşma yoxdur (az, en, ar; statik və hərəkətli)', async ({ page }) => {
  test.slow() // 6 səhifə yüklənməsi (3 dil × 2 hərəkət rejimi)
  await page.setViewportSize({ width: 360, height: 740 })
  for (const motion of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion: motion })
    for (const path of ['/quran-history', '/en/quran-history', '/ar/quran-history']) {
      await open(page, path)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(over, `${path} (${motion})`).toBeLessThanOrEqual(0)
      await expect(page.getByTestId('qh-progress')).toBeVisible()
    }
  }
})
