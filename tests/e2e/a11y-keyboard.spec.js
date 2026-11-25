// ═══════════════════════════════════════════════════════
// Əlçatanlıq — klaviatura və ekran oxuyucusu yolları (a11y auditi 2026-11-25).
// axe-nin görmədiyi şeylər: Tab sırası, fokus tələsi, fokusun qayıtması,
// fokusun sabit başlığın altında qalmaması (WCAG 2.4.11), canlı elanlar,
// düymə adlarının unikallığı; + WCAG 2.2 (target-size) yeni səhifələrdə.
// ═══════════════════════════════════════════════════════
import AxeBuilder from '@axe-core/playwright'
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

/** Fokuslanmış element bağlı çəkmə menyunun (.qm-sn--drawer) içindədirmi? */
const focusInClosedDrawer = (page) => page.evaluate(() => {
  const el = document.activeElement
  const d = el?.closest('.qm-sn--drawer')
  return Boolean(d && !d.classList.contains('is-open'))
})

/** Bağlı menyuda görünən (visibility: visible) keçid / düymə sayı — 0 olmalıdır */
const visibleInClosedDrawer = (page) => page.evaluate(() => {
  const d = document.querySelector('.qm-sn--drawer:not(.is-open)')
  if (!d) return -1
  return [...d.querySelectorAll('a[href], button')].filter(e => getComputedStyle(e).visibility === 'visible').length
})

// Telefon və 200% böyüdülmüş kompüter ekranı (1280 → 640 CSS px) — hər ikisində menyu çəkmə rejimindədir
for (const zoom of [false, true]) {
  test.describe(zoom ? '200% böyütmə (640px)' : 'telefon', () => {
    test.beforeEach(async ({ page, isMobile }) => {
      test.skip(zoom ? isMobile : !isMobile, zoom ? 'kompüter layihəsi' : 'telefon layihəsi')
      if (zoom) await page.setViewportSize({ width: 640, height: 450 })
    })

    test('bağlı menyunun keçidləri Tab sırasında və ekran oxuyucusu ağacında deyil', async ({ page, consoleProblems }) => {
      await page.goto('/')
      await settle(page)
      const burger = page.getByRole('button', { name: 'Menyu', exact: true })
      // Menyunu açıb bağlayırıq — komponent DOM-da qalır (bağlı vəziyyətdə)
      await burger.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toBeHidden()
      await expect(burger).toBeFocused()
      expect(await visibleInClosedDrawer(page)).toBe(0)
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab')
        expect(await focusInClosedDrawer(page), `Tab #${i + 1}`).toBe(false)
      }
      expectCleanConsole(consoleProblems)
    })

    test('menyu klaviatura ilə: fokus içəridə dövr edir, Esc bağlayır və fokusu ☰-yə qaytarır', async ({ page, consoleProblems }) => {
      await page.goto('/ar')
      await settle(page)
      const burger = page.getByRole('button', { name: 'القائمة', exact: true })
      await burger.focus()
      await page.keyboard.press('Enter')
      const drawer = page.getByRole('dialog')
      await expect(drawer).toBeVisible()
      await expect.poll(() => drawer.evaluate(d => d.contains(document.activeElement))).toBe(true)
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press(i % 7 === 6 ? 'Shift+Tab' : 'Tab')
        expect(await drawer.evaluate(d => d.contains(document.activeElement)), `Tab #${i + 1}`).toBe(true)
      }
      await page.keyboard.press('Escape')
      await expect(drawer).toBeHidden()
      await expect(burger).toBeFocused()
      expectCleanConsole(consoleProblems)
    })
  })
}

test('"Məzmuna keç" ilk Tab-dır, görünür və fokusu əsas məzmuna aparır', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Məzmuna keç' })
  await expect(skip).toBeFocused()
  const box = await skip.boundingBox()
  expect(box && box.y >= 0 && box.height >= 24).toBe(true)
  await page.keyboard.press('Enter')
  await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('main')))).toBe(true)
  expectCleanConsole(consoleProblems)
})

// WCAG 2.4.11: Shift+Tab yuxarı gedəndə fokuslanan element sabit başlığın altında qalmamalıdır
for (const url of ['/prayer', '/zakat']) {
  test(`${url}: geriyə Tab — fokus başlığın altında gizlənmir`, async ({ page, consoleProblems }) => {
    await page.goto(url)
    await settle(page)
    // Səhifənin sonundan başla (footer-in son keçidi)
    await page.locator('footer a[href]').last().focus()
    const hidden = []
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Shift+Tab')
      const r = await page.evaluate(() => {
        const el = document.activeElement
        if (!el || el === document.body || el.closest('header.header, .qm-sn--rail, .qm-skip, .qm-sn--drawer')) return null
        // Üfüqi sürüşən zolaq daxilində olanlar — yalnız şaquli mövqe vacibdir
        const b = el.getBoundingClientRect()
        if (!b.height) return null
        const h = document.querySelector('header.header')?.getBoundingClientRect()
        return { bottom: b.bottom, top: b.top, hdr: h ? h.bottom : 0, html: el.outerHTML.slice(0, 100) }
      })
      // "Tam gizli" = elementin aşağı kənarı başlığın aşağı kənarından yuxarıdadır
      if (r && r.bottom <= r.hdr + 1) hidden.push(`${Math.round(r.top)}..${Math.round(r.bottom)} (başlıq ${Math.round(r.hdr)}) ${r.html}`)
    }
    expect(hidden).toEqual([])
    expectCleanConsole(consoleProblems)
  })
}

test('axtarış dialoqu: fokus sahəyə düşür, Esc bağlayır və fokusu düyməyə qaytarır', async ({ page, consoleProblems }) => {
  await page.goto('/')
  await settle(page)
  const btn = page.getByRole('button', { name: /^Axtar/ }).first()
  await btn.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect.poll(() => dialog.evaluate(d => d.contains(document.activeElement) && /INPUT/.test(document.activeElement.tagName))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(btn).toBeFocused()
  expectCleanConsole(consoleProblems)
})

test('zikr sayğacı: hər toxunuş ekran oxuyucusuna elan olunur (aria-live)', async ({ page, consoleProblems }) => {
  await page.goto('/dhikr')
  await settle(page)
  const live = page.getByTestId('dhikr-live')
  await expect(live).toHaveAttribute('aria-live', 'polite')
  await expect(live).toHaveText('')
  const tap = page.locator('.dhikr-tap-btn')
  await tap.click()
  await tap.click()
  await expect(live).toHaveText('2 / 33')
  expectCleanConsole(consoleProblems)
})

test('Quran: hər ayənin "dinlə" düyməsinin adı ayə nömrəsini daşıyır; Zen düyməsi görünən adı ehtiva edir', async ({ page, consoleProblems }) => {
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('.ayah-card')).toHaveCount(7)
  const names = await page.locator('.ayah-play').evaluateAll(els => els.map(e => e.getAttribute('aria-label')))
  expect(names).toHaveLength(7)
  expect(new Set(names).size).toBe(7)
  expect(names[0]).toMatch(/^Ayəni dinlə — 1/)
  await expect(page.getByTestId('zen-open')).toHaveAttribute('aria-label', /^Zen — /)
  expectCleanConsole(consoleProblems)
})

test('namaz səhifəsi: saat və geri sayım bütöv dəyər kimi oxunur (rəqəm-rəqəm yox)', async ({ page, consoleProblems }) => {
  await page.goto('/prayer')
  await settle(page)
  const timer = page.getByRole('timer').first()
  await expect(timer).toBeVisible()
  // Ekran oxuyucusu ağacında "0 1 : 0 6" kimi ayrı-ayrı simvollar olmamalıdır
  const snap = await page.locator('.prayer-clock, .next-prayer-card').first().ariaSnapshot()
  expect(snap).not.toMatch(/\d \d : \d \d/)
  expectCleanConsole(consoleProblems)
})

// WCAG 2.2 AA (target-size daxil) + moderate landmark qaydaları — yeni / auditdə düzəldilmiş səhifələr.
// Yan paneldəki (rail) sətirlər sürüşən qutunun kənarında "qismən örtülü" sayılır — axe-nin
// sürüşmə konteynerində yalan nəticəsi; onlar 34px-dir, ona görə yalnız rail sətirləri süzülür.
const WCAG22 = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const NEW_PAGES = ['/', '/ar', '/prayer', '/qibla', '/dhikr', '/road-to-ramadan', '/last-ten-nights', '/trust-box', '/janaza',
  '/prayer-rooms', '/volunteers', '/share', '/ar/hisnul-muslim/28-10', '/quran/1-al-faatiha', '/ar/quran/1-al-faatiha']
for (const theme of ['light', 'dark']) {
  for (const url of NEW_PAGES) {
    test(`WCAG 2.2 (${theme}) ${url}: ciddi pozuntu, landmark təkrarı, başlıq sırası yoxdur`, async ({ page }, info) => {
      test.skip(info.project.name === 'mobile' && !['/', '/ar', '/prayer', '/dhikr', '/last-ten-nights', '/ar/hisnul-muslim/28-10'].includes(url), 'mobil: seçilmiş səhifələr')
      await page.addInitScript((t) => { try { localStorage.setItem('muslim_cc_theme', t) } catch { /* yaddaş bağlıdır */ } }, theme)
      await page.goto(url)
      await settle(page)
      await expect(page.locator('h1').first()).toBeVisible()
      const { violations } = await new AxeBuilder({ page }).withTags(WCAG22).analyze()
      const bad = violations
        .filter(v => v.impact === 'critical' || v.impact === 'serious' || ['landmark-unique', 'heading-order', 'empty-table-header'].includes(v.id))
        .flatMap(v => v.nodes
          .filter(n => !(v.id === 'target-size' && /qm-sn-item/.test(n.html)))
          .map(n => `${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 100)}`))
      expect(bad).toEqual([])
    })
  }
}
