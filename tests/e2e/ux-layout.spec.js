// ═══════════════════════════════════════════════════════
// UX auditi (2026-11-18) — layout düzəlişlərinin qoruyucuları:
//   • səhifə başlığının işıq keçidi hərfləri "yemir" (background-position 0–100% aralığında)
//   • 1280px-də başlıqdakı namaz halqası orta menyuya dəymir
//   • footer-in iri söz-nişanı sağdan kəsilmir (1280 və 360)
//   • telefon menyusu: alətlər bir sətirdədir, 780px hündürlükdə ən azı 12 bölmə sətri görünür; dillər "AZ ▾" arxasında
//   • telefonda (≤480px) səhifə hero-su aləti ekranın altına itələmir
// ═══════════════════════════════════════════════════════
import { test, expect, settle } from './fixtures.js'

test.describe('başlığın işıq keçidi', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('animasiya boyu qradiyent mətni örtür (0–100%), ehtiyat rəng var', async ({ page }) => {
    await page.goto('/prayer')
    const title = page.locator('.ui-page-hero .ui-display').first()
    await expect(title).toBeVisible()
    const read = (t) => title.evaluate((el, ms) => {
      const a = el.getAnimations().find((x) => x.animationName === 'hero-shine')
      if (!a) return null
      a.pause()
      a.currentTime = ms
      const cs = getComputedStyle(el)
      return { pos: cs.backgroundPositionX, bg: cs.backgroundColor }
    }, t)
    // 0.9 s gecikmə + 2.6 s: başlanğıc, orta və son (~3.3 s)
    for (const ms of [900, 2200, 3300, 3490]) {
      const r = await read(ms)
      expect(r, `animasiya ${ms} ms`).not.toBeNull()
      const pct = parseFloat(r.pos)
      expect(r.pos.endsWith('%'), r.pos).toBe(true)
      expect(pct).toBeGreaterThanOrEqual(0)
      expect(pct).toBeLessThanOrEqual(100)
      expect(r.bg).not.toBe('rgba(0, 0, 0, 0)')
    }
  })
})

test('1280px: namaz halqası və idarələr orta menyuya dəymir (/prayer, /quran)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'yalnız kompüter')
  await page.setViewportSize({ width: 1280, height: 800 })
  for (const path of ['/prayer', '/quran']) {
    await page.goto(path)
    await settle(page)
    const right = await page.locator('.header-right').boundingBox()
    const nav = await page.locator('.nav-desktop').boundingBox()
    expect(right && nav, path).toBeTruthy()
    // LTR: menyunun sağ kənarı idarələrdən solda qalır
    expect(nav.x + nav.width, path).toBeLessThanOrEqual(right.x + 1)
  }
})

for (const width of [1280, 360]) {
  test(`footer söz-nişanı kəsilmir (${width}px)`, async ({ page, isMobile }) => {
    test.skip(isMobile && width === 1280, 'telefon proyektində 1280 yoxdur')
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/about')
    await settle(page)
    const mark = page.locator('.vx-wordmark__fill')
    await mark.scrollIntoViewIfNeeded()
    const { sw, cw } = await mark.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }))
    expect(sw).toBeLessThanOrEqual(cw + 1)
  })
}

test.describe('telefon menyusu', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnız telefon')
  test('alətlər bir sətirdə, 780px-də ≥12 menyu sətri görünür; dil paneli açılır', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 })
    await page.goto('/')
    await settle(page)
    await page.getByRole('button', { name: 'Menyu', exact: true }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible()
    const bar = drawer.locator('.qm-sn-bar')
    const box = await bar.boundingBox()
    expect(box.height).toBeLessThanOrEqual(50)
    // Bütün alət düymələrinin adı var (ikon düymələri)
    for (const name of ['AI köməkçi', 'Əlçatanlıq', 'Bildirişlər', 'Qaranlıq rejim']) await expect(bar.getByRole('button', { name, exact: true })).toBeVisible()
    await expect(bar.getByRole('link', { name: 'Daxil ol' })).toBeVisible()
    // Panel yerinə çatsın
    await page.waitForTimeout(400)
    const body = await drawer.locator('.qm-sn-body').boundingBox()
    // Sətir = bölmə keçidi və ya qrup başlığı
    const rows = await drawer.locator('.qm-sn-item, .qm-sn-group-btn').evaluateAll((els, b) => els.filter((el) => {
      const r = el.getBoundingClientRect()
      return r.height > 0 && r.top >= b.y - 1 && r.bottom <= b.y + b.height + 1
    }).length, body)
    expect(rows).toBeGreaterThanOrEqual(12)
    // Dillər "AZ ▾" düyməsinin arxasında; "Digər dillər" seçicisinin boş olmayan yer tutucusu var
    await expect(drawer.getByRole('button', { name: 'EN — English' })).toHaveCount(0)
    const toggle = drawer.getByRole('button', { name: 'AZ — Dil', exact: true })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(drawer.getByRole('button', { name: 'EN — English' })).toBeVisible()
    await expect(drawer.getByRole('combobox', { name: /^Digər dillər/ }).locator('option').first()).toHaveText('Dil seçin…')
  })
})

test.describe('telefonda kompakt hero', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnız telefon')
  for (const path of ['/prayer', '/mushaf']) {
    test(`${path}: hero 360×780-də alətə yer saxlayır`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 })
      await page.goto(path)
      await settle(page)
      const hero = await page.locator('.ui-page-hero').first().boundingBox()
      // Hero bitən yerdən alət başlayır — ekranın üçdə ikisindən yuxarıda
      expect(hero.y + hero.height).toBeLessThan(520)
    })
  }
})
