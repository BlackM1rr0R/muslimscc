// ═══════════════════════════════════════════════════════
// Səhabələr: siyahı ↔ profil naviqasiyası
//   • kartdan profilə keçid, URL /sahaba/<slug>, h1 = səhabənin adı
//   • brauzerin "geri" düyməsi siyahıya qaytarır və sürüşmə yeri bərpa olunur
//   • Əvvəlki / Növbəti səhabə işləyir, "geri" yenə siyahıya aparır
//   • paylaşılan keçid (/sahaba/<slug>, köhnə /sahaba?id=…) birbaşa profili açır
//   • filtr çipləri siyahını daraldır
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

test('kartdan profilə keçid, URL /sahaba/<slug>, geri siyahıya qaytarır', async ({ page, consoleProblems }) => {
  await page.goto('/sahaba')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Səhabələr')

  // Siyahını bir az aşağı sürüşdür ki, qayıdanda yer bərpası yoxlansın
  const card = page.locator('.sahabe-card', { hasText: 'Bilal' })
  await card.scrollIntoViewIfNeeded()
  const yBefore = await page.evaluate(() => window.scrollY)
  await card.click()

  await expect(page).toHaveURL(/\/sahaba\/bilal-ibn-rabah$/)
  await expect(page.locator('h1')).toHaveText(/Bilal/)
  await expect(page.locator('h1')).toHaveCount(1)
  // Profil yuxarıdan açılır
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)
  await expect(page.getByRole('navigation', { name: 'İçindəkilər' })).toBeVisible()

  await page.goBack()
  await expect(page).toHaveURL(/\/sahaba$/)
  await expect(page.locator('h1')).toHaveText('Səhabələr')
  if (yBefore > 50) {
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(yBefore - 40)
  }
  expectCleanConsole(consoleProblems)
})

test('əvvəlki / növbəti səhabə işləyir, geri yenə siyahıdır', async ({ page, consoleProblems }) => {
  await page.goto('/sahaba')
  await settle(page)
  await page.locator('.sahabe-card', { hasText: 'Ömər ibn əl-Xəttab' }).click()
  await expect(page).toHaveURL(/\/sahaba\/umar-ibn-al-khattab$/)

  await page.getByRole('link', { name: /Növbəti səhabə/ }).click()
  await expect(page).toHaveURL(/\/sahaba\/uthman-ibn-affan$/)
  await expect(page.locator('h1')).toHaveText(/Osman/)

  await page.getByRole('link', { name: /Əvvəlki səhabə/ }).click()
  await expect(page).toHaveURL(/\/sahaba\/umar-ibn-al-khattab$/)
  await page.getByRole('link', { name: /Əvvəlki səhabə/ }).click()
  await expect(page).toHaveURL(/\/sahaba\/abu-bakr-as-siddiq$/)
  // Birinci səhabədə "Əvvəlki" yoxdur
  await expect(page.getByRole('link', { name: /Əvvəlki səhabə/ })).toHaveCount(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/sahaba$/)
  await expect(page.locator('.sahabe-card').first()).toBeVisible()
  expectCleanConsole(consoleProblems)
})

test('paylaşılan keçid profili birbaşa açır; "Bütün səhabələr" siyahıya aparır', async ({ page, consoleProblems }) => {
  // Köhnə ünvan (?id=) yeni /en/sahaba/<slug> ünvanına çevrilir
  await page.goto('/en/sahaba?id=aisha-bint-abi-bakr')
  await settle(page)
  await expect(page).toHaveURL(/\/en\/sahaba\/aisha-bint-abi-bakr$/)
  await expect(page.locator('h1')).toHaveText(/Aisha/)
  await expect(page.locator('#sp-glance')).toBeVisible()
  await expect(page.locator('#sp-sources li').first()).toBeVisible()

  await page.getByRole('button', { name: 'All companions' }).first().click()
  await expect(page).toHaveURL(/\/en\/sahaba$/)
  await expect(page.locator('h1')).toHaveText('Companions')
  expectCleanConsole(consoleProblems)
})

test('filtr çipləri siyahını daraldır', async ({ page }) => {
  await page.goto('/sahaba')
  await settle(page)
  await page.getByRole('button', { name: /Raşid xəlifələr/ }).click()
  await expect(page.locator('.sahabe-card')).toHaveCount(4)
  await page.getByRole('button', { name: /Qadın səhabələr/ }).click()
  await expect(page.locator('.sahabe-card')).toHaveCount(3)
  await page.getByRole('button', { name: /^Hamısı/ }).click()
  await expect(page.locator('.sahabe-card')).toHaveCount(20)
})

test('tanınmayan id siyahını göstərir', async ({ page }) => {
  await page.goto('/sahaba?id=yoxdur')
  await settle(page)
  await expect(page.locator('h1')).toHaveText('Səhabələr')
})

test.describe('animasiya açıq', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('kartdan keçid (View Transition) işləyir, profildə şəffaf qalan data-reveal yoxdur', async ({ page, consoleProblems }) => {
    await page.goto('/sahaba')
    await settle(page)
    await page.locator('.sahabe-card', { hasText: 'Ənəs ibn Malik' }).click()
    await expect(page).toHaveURL(/\/sahaba\/anas-ibn-malik$/)
    await expect(page.locator('h1')).toHaveText(/Ənəs/)

    const stuck = await page.evaluate(async () => {
      const sleep = (ms) => new Promise(r => setTimeout(r, ms))
      const targets = () => [...document.querySelectorAll('[data-reveal]')].flatMap(el =>
        String(el.getAttribute('data-reveal')).startsWith('stagger') ? [el, ...el.children] : [el])
      const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.bottom > 40 && r.top < innerHeight - 40 && r.width > 0 }
      const bad = []
      for (let y = 0; y <= document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.7)) {
        window.scrollTo(0, y)
        await sleep(300)
        const sus = targets().filter(el => onScreen(el) && parseFloat(getComputedStyle(el).opacity) < 0.5)
        if (!sus.length) continue
        await sleep(1500)
        sus.filter(el => onScreen(el) && parseFloat(getComputedStyle(el).opacity) < 0.5)
          .forEach(el => bad.push(`${el.tagName}.${String(el.className).split(' ')[0]}`))
      }
      return [...new Set(bad)]
    })
    expect(stuck).toEqual([])
    expectCleanConsole(consoleProblems)
  })
})
