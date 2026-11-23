// ═══════════════════════════════════════════════════════
// D dəstəsi: "Yeniliklər" (/whats-new), menyuda "Yeni" nişanı və "Kəşf et" bələdçi turu
//   • /whats-new: tarixli siyahı, hər sətir keçiddir; açılan yeni səhifənin "Yeni" nişanı itir (yalnız cihaz)
//   • Menyu: yan panel (desktop) / çəkmə menyu (telefon) — nişan linkin adına qarışmır (aria-describedby)
//   • Tur: Növbəti/Geri/Esc, fokus başlıqda, Tab kartın içində, işıq ləkəsi, sonda 3 yerli təklif;
//     PageHelp və çəkmə menyudan açılır; ərəbcə RTL (oxlar güzgülü); 360px; axe
//   • İlk gəliş təklifi: fikstür onu söndürür (qm_tour_v1) — burada açar silinir
// Şəbəkə: yeni /api endpoint YOXDUR (hamısı yerli). Tarixdən asılı yoxlamalar recentPageKeys ilə hesablanır.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { recentPageKeys } from '../../src/data/whatsNew.js'

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  let b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  for (const sel of include) b = b.include(sel)
  const { violations } = await b.analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')} — ${n.html.slice(0, 120)}`))
}
const over = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
const store = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), key)
// "bedtime" bu gün hələ "yeni"dirmi? (2026-11-23 + 30 gün) — sonra nişan yoxlamaları atlanır
const FRESH = recentPageKeys(Date.now())
const BEDTIME_FRESH = FRESH.has('bedtime')

test('/whats-new: tarixli siyahı, keçidlər, "Yeni" nişanı açılandan sonra itir', async ({ page, consoleProblems }) => {
  await page.goto('/en/whats-new')
  await settle(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What’s new')
  // Tarix başlıqları (h2 + <time>) və kartlar
  await expect(page.locator('.wn-day time').first()).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/)
  expect(await page.locator('[data-testid^="wn-item-"]').count()).toBeGreaterThan(40)
  const bed = page.getByTestId('wn-item-bedtime')
  await expect(bed.getByRole('link', { name: 'Bedtime Sunnah routine' })).toHaveAttribute('href', '/en/bedtime-sunnah')
  if (BEDTIME_FRESH) await expect(bed.locator('.wn-item__new')).toHaveText('New')
  // Mövcud səhifəyə əlavə olunan funksiya — "Yeni" nişanı yoxdur, "harada" göstərilir
  await expect(page.getByTestId('wn-item-star-qibla').locator('.wn-item__new')).toHaveCount(0)
  await expect(page.getByTestId('wn-item-star-qibla').locator('.wn-item__where')).toContainText('Qibla')

  await bed.getByRole('link').click()
  await expect(page).toHaveURL(/\/en\/bedtime-sunnah$/)
  await settle(page)
  // markSeen səhifə açılandan bir az sonra yazılır — bir dəfə oxumaq yarış yaradırdı (CI mobil)
  if (BEDTIME_FRESH) await expect.poll(() => store(page, 'qm_whatsnew_seen_v1')).toContain('bedtime')
  await page.goBack()
  await expect(page).toHaveURL(/\/en\/whats-new$/)
  await expect(page.getByTestId('wn-item-bedtime').locator('.wn-item__new')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test.describe('menyuda "Yeni" nişanı', () => {
  test.skip(!BEDTIME_FRESH, '"bedtime" artıq 30 gündən köhnədir')

  test('yan panel (desktop): nişan görünür, linkin adı dəyişmir, açandan sonra itir', async ({ page, isMobile }) => {
    test.skip(isMobile, 'yalnız desktop')
    await page.goto('/en/about')
    await settle(page)
    const rail = page.locator('.qm-sn--rail')
    const link = rail.getByRole('link', { name: 'Bedtime Sunnah routine', exact: true })
    await expect(link).toBeVisible()
    const pillId = await link.getAttribute('aria-describedby')
    expect(pillId).toBeTruthy()
    await expect(rail.locator(`#${pillId}`)).toHaveText('New')
    await link.click()
    await expect(page).toHaveURL(/\/en\/bedtime-sunnah$/)
    await expect(rail.locator('.qm-sn-li.has-new a[href="/en/bedtime-sunnah"]')).toHaveCount(0)
    // Başqa səhifəyə keçəndə də qayıtmır (cihazda yadda qalır)
    await page.goto('/en/about')
    await settle(page)
    await expect(page.locator('.qm-sn--rail a[href="/en/bedtime-sunnah"]')).not.toHaveAttribute('aria-describedby', /.+/)
  })

  test('çəkmə menyu (telefon): nişan görünür', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'yalnız telefon')
    await page.goto('/en/about')
    await settle(page)
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    const drawer = page.getByRole('dialog')
    const link = drawer.getByRole('link', { name: 'Bedtime Sunnah routine', exact: true })
    await link.scrollIntoViewIfNeeded()
    const pillId = await link.getAttribute('aria-describedby')
    await expect(drawer.locator(`#${pillId}`)).toBeVisible()
    await expect(drawer.locator(`#${pillId}`)).toHaveText('New')
  })
})

test('tur: Növbəti / Geri / Esc, fokus, Tab tələsi, fokus geri qayıdır', async ({ page, isMobile, consoleProblems }) => {
  await page.goto('/en/whats-new')
  await settle(page)
  const startBtn = page.getByTestId('wn-tour').getByRole('button', { name: 'Start the tour' })
  await startBtn.click()
  const tour = page.getByRole('dialog', { name: 'Site tour' })
  await expect(tour).toBeVisible()
  await expect(tour.getByText('Step 1 of 9')).toBeVisible()
  await expect(tour.getByRole('heading', { name: 'Welcome!' })).toBeFocused()
  await expect(tour.getByRole('button', { name: 'Back' })).toHaveCount(0)

  await tour.getByRole('button', { name: 'Next' }).click()
  await expect(tour.getByRole('heading', { name: 'Search everything' })).toBeFocused()
  await expect(tour.getByText('Step 2 of 9')).toBeVisible()
  // Hədəf (axtarış) bu ekranda var — işıq ləkəsi görünür
  await expect(page.locator('.tour-spot')).toBeVisible()
  // Tur açıqkən Ctrl+K arxada axtarış açmır
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog')).toHaveCount(1)

  await tour.getByRole('button', { name: 'Back' }).click()
  await expect(tour.getByRole('heading', { name: 'Welcome!' })).toBeFocused()
  // Oxlar: sağ = irəli (LTR)
  await page.keyboard.press('ArrowRight')
  await expect(tour.getByRole('heading', { name: 'Search everything' })).toBeFocused()

  // Tab kartdan çıxmır
  for (let k = 0; k < 6; k++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('.tour-card')))).toBe(true)
  }

  await page.keyboard.press('Escape')
  await expect(tour).toHaveCount(0)
  await expect(startBtn).toBeFocused()
  expect(await store(page, 'qm_tour_v1')).toMatchObject({ offered: true, done: true })

  // 360px: kart ekrandadır, üfüqi daşma yoxdur
  if (isMobile) {
    await page.setViewportSize({ width: 360, height: 740 })
    await startBtn.click()
    const box = await page.locator('.tour-card').boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(361)
    expect(await over(page)).toBeLessThanOrEqual(1)
    await page.keyboard.press('Escape')
  }
  expectCleanConsole(consoleProblems)
})

test('tur: sona qədər — 3 yerli təklif, keçid işləyir; axe (açıq + tünd)', async ({ page }) => {
  // Yerli siqnallar: Quran açılmayıb, şəhər yoxdur → Quran, namaz vaxtları, zikr
  await page.goto('/en/whats-new')
  await settle(page)
  await page.getByTestId('wn-tour').getByRole('button', { name: 'Start the tour' }).click()
  const tour = page.getByRole('dialog', { name: 'Site tour' })
  expect(await serious(page, ['.tour-card'])).toEqual([])
  for (let k = 1; k < 9; k++) await tour.getByRole('button', { name: 'Next' }).click()
  await expect(tour.getByRole('heading', { name: 'All set!' })).toBeFocused()
  const picks = tour.locator('.tour-pick')
  await expect(picks).toHaveCount(3)
  await expect(picks.nth(0)).toHaveAttribute('href', '/en/quran')
  await expect(picks.nth(1)).toHaveAttribute('href', '/en/prayer')
  await expect(tour.getByText(/nothing is sent anywhere/)).toBeVisible()
  expect(await serious(page, ['.tour-card'])).toEqual([])
  // Tünd rejim
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  expect(await serious(page, ['.tour-card'])).toEqual([])
  await picks.nth(1).click()
  await expect(page).toHaveURL(/\/en\/prayer$/)
  await expect(page.getByRole('dialog', { name: 'Site tour' })).toHaveCount(0)
})

test('tur: ərəbcə RTL — oxlar güzgülü', async ({ page }) => {
  await page.goto('/ar/whats-new')
  await settle(page)
  await page.getByTestId('wn-tour').getByRole('button').click()
  const root = page.getByTestId('discover-tour')
  await expect(root).toHaveAttribute('dir', 'rtl')
  await expect(page.getByRole('heading', { name: 'أهلًا بك!' })).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('heading', { name: 'ابحث في كل شيء' })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('heading', { name: 'أهلًا بك!' })).toBeFocused()
})

test('tur PageHelp-dən (ⓘ) açılır', async ({ page }) => {
  await page.goto('/en/quran')
  await settle(page)
  await page.getByRole('button', { name: 'How it works', exact: true }).click()
  // Yan paneldə də eyni adlı düymə var — PageHelp pəncərəsi ilə məhdudlaşdırılır
  await page.locator('.vx-help').getByRole('button', { name: 'What can I do here?' }).click()
  await expect(page.getByRole('dialog', { name: 'Site tour' })).toBeVisible()
})

test('tur çəkmə menyudan açılır (telefon), menyu bağlanır', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'yalnız telefon')
  await page.goto('/en/about')
  await settle(page)
  await page.getByRole('button', { name: 'Menu', exact: true }).click()
  const btn = page.locator('#qm-drawer').getByRole('button', { name: 'What can I do here?' })
  await btn.scrollIntoViewIfNeeded()
  await btn.click()
  await expect(page.getByRole('dialog', { name: 'Site tour' })).toBeVisible()
  await expect(page.locator('.qm-sn--drawer')).not.toHaveClass(/is-open/)
})

test('/whats-new: axe (açıq + tünd), 360px-də daşma yoxdur', async ({ page, isMobile }) => {
  await page.goto('/en/whats-new')
  await settle(page)
  expect(await serious(page, ['main'])).toEqual([])
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  expect(await serious(page, ['main'])).toEqual([])
  if (isMobile) {
    await page.setViewportSize({ width: 360, height: 740 })
    expect(await over(page)).toBeLessThanOrEqual(1)
  }
})

test.describe('ilk gəliş təklifi', () => {
  // Fikstür təklifi söndürür — burada açar silinir (ilk gəliş)
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.removeItem('qm_tour_v1') } catch { /* */ } })
  })

  test('bir dəfə çıxır, məzmunu bağlamır; "No, thanks" həmişəlik söndürür', async ({ page }) => {
    test.setTimeout(45_000)
    await page.goto('/en/about')
    await settle(page)
    const offer = page.getByTestId('tour-offer')
    await expect(offer).toBeVisible({ timeout: 20_000 })
    // Dialoq deyil — səhifə ilə işləmək olur
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(offer.getByRole('heading', { name: 'New here?' })).toBeVisible()
    await offer.getByRole('button', { name: 'No, thanks' }).click()
    await expect(offer).toHaveCount(0)
    expect(await store(page, 'qm_tour_v1')).toMatchObject({ offered: true, dismissed: true })
  })

  test('"Start the tour" turu açır', async ({ page }) => {
    test.setTimeout(45_000)
    await page.goto('/en/about')
    await settle(page)
    const offer = page.getByTestId('tour-offer')
    await expect(offer).toBeVisible({ timeout: 20_000 })
    await offer.getByRole('button', { name: 'Start the tour' }).click()
    await expect(page.getByRole('dialog', { name: 'Site tour' })).toBeVisible()
    await expect(offer).toHaveCount(0)
  })
})
