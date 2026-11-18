// ═══════════════════════════════════════════════════════
// Hədislər — sonsuz sürüşmə (useInfiniteList):
//   • aşağı sürüşdükcə növbəti partiya özü yüklənir (20-lik səhifə yoxdur)
//   • filtr dəyişəndə siyahı əvvəldən başlayır və yuxarı qalxır
//   • başqa səhifəyə keçib "Geri" ilə qayıdanda açıq kartlar və mövqe bərpa olunur
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const CARDS = 'article.hadith-card'

/** Səhifənin sonuna bir neçə dəfə sürüşdür — hər dəfə yeni partiya gəlir */
async function scrollToLoad(page, times = 3) {
  for (let i = 0; i < times; i++) {
    const before = await page.locator(CARDS).count()
    // Hər yoxlamada yenidən sona sürüşdür: bir dəfəlik scrollTo telefonda bəzən sentinel-i işə salmır
    // (və ya partiya hələ yüklənir) — poll yalnız gözləyirdisə, 7 san boşuna keçirdi
    await expect.poll(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      return page.locator(CARDS).count()
    }).toBeGreaterThan(before)
  }
}

test('aşağı sürüşdükcə yeni hədislər özü yüklənir', async ({ page, consoleProblems }) => {
  await page.goto('/hadith')
  await settle(page)
  await expect(page.locator(CARDS).first()).toBeVisible()
  const first = await page.locator(CARDS).count()
  expect(first).toBeGreaterThan(0)
  expect(first).toBeLessThanOrEqual(30)
  // Köhnə səhifələmə yoxdur
  await expect(page.locator('nav.pagination')).toHaveCount(0)

  await scrollToLoad(page, 2)
  expect(await page.locator(CARDS).count()).toBeGreaterThan(20)
  // Nömrələmə ardıcıl davam edir (#1 … #N) — səhifə başına sıfırlanmır
  // (bir evaluate-də oxunur: sürüşmə davam etdikcə yeni partiya gələ bilər)
  const [lastNum, total] = await page.evaluate((sel) => {
    const cards = document.querySelectorAll(sel)
    return [Number(cards[cards.length - 1].querySelector('.hadith-num').textContent.replace(/\D/g, '')), cards.length]
  }, CARDS)
  expect(lastNum).toBe(total)

  // Ehtiyat düymə də işləyir (klaviatura, IO-suz brauzer)
  const n = await page.locator(CARDS).count()
  await page.getByRole('button', { name: /Daha çox göstər/ }).click()
  await expect.poll(() => page.locator(CARDS).count()).toBeGreaterThan(n)

  // Uzun siyahıda "Yuxarı qayıt" görünür və yuxarı aparır
  const top = page.getByRole('button', { name: 'Yuxarı qayıt' })
  await expect(top).toBeVisible()
  await top.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(50)
  expectCleanConsole(consoleProblems)
})

test('filtr dəyişəndə siyahı sıfırlanır və yuxarı qalxır', async ({ page, consoleProblems }) => {
  await page.goto('/hadith')
  await settle(page)
  await expect(page.locator(CARDS).first()).toBeVisible()
  await scrollToLoad(page, 3)
  expect(await page.locator(CARDS).count()).toBeGreaterThan(48)

  // Kateqoriya (telefonda çip zolağı yapışqandır — sürüşmüş halda da görünür)
  const chip = page.getByRole('group', { name: 'Kateqoriyalar' }).getByRole('button', { name: 'Namaz', exact: true })
  await chip.click()
  await expect(chip).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.locator(CARDS).count()).toBeLessThanOrEqual(30)
  // Nəticələrin əvvəli (sayğac) ekrandadır
  await expect(page.locator('.hadith-count')).toBeInViewport()
  await expect(page.locator(`${CARDS} .hadith-num`).first()).toHaveText('#1')

  // Axtarış da sıfırlayır
  await page.getByRole('group', { name: 'Kateqoriyalar' }).getByRole('button', { name: 'Hamısı', exact: true }).click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('searchbox').fill('namaz')
  await expect(page.locator(CARDS).first()).toBeVisible()
  await expect.poll(() => page.locator(CARDS).count()).toBeLessThanOrEqual(30)
  expectCleanConsole(consoleProblems)
})

test('sevimlilər filtri sonsuz siyahıda işləyir', async ({ page, consoleProblems }) => {
  await page.goto('/hadith')
  await settle(page)
  // İlk iki hədisi sevimliyə əlavə et
  const favs = page.locator(`${CARDS} .hadith-fav-btn`)
  await favs.nth(0).click()
  await favs.nth(1).click()
  // Kartlardakı ürək düymələri də "Sevimlilərə …" adlanır — çip qrupunda axtar
  const favChip = page.getByRole('group', { name: 'Kateqoriyalar' }).getByRole('button', { name: /^Sevimlilər/ })
  await expect(favChip).toContainText('2')
  await favChip.click()
  await expect(page.locator(CARDS)).toHaveCount(2)
  // Qısa siyahıda "Daha çox göstər" yoxdur
  await expect(page.getByRole('button', { name: /Daha çox göstər/ })).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('başqa səhifəyə keçib geri qayıdanda mövqe bərpa olunur', async ({ page, consoleProblems }) => {
  await page.goto('/hadith')
  await settle(page)
  await expect(page.locator(CARDS).first()).toBeVisible()
  await scrollToLoad(page, 3)
  // Siyahının ortasına (yüklənmiş sahənin içinə) qal və yaddaşa yazılsın
  await page.evaluate(() => window.scrollTo(0, Math.round(document.documentElement.scrollHeight * 0.6)))
  await page.waitForTimeout(400)
  const count = await page.locator(CARDS).count()
  const y = await page.evaluate(() => window.scrollY)
  expect(y).toBeGreaterThan(1500)

  // SPA keçidi (başlıqdakı "Haqqımızda" linki) — tam yükləmə yox
  await page.evaluate(() => document.querySelector('a.nav-link[href="/about"]').click())
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator(CARDS)).toHaveCount(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/hadith$/)
  await expect.poll(() => page.locator(CARDS).count()).toBeGreaterThanOrEqual(count)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y - 60)
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(y + 60)
  expectCleanConsole(consoleProblems)
})

test('menyudan yenidən açılan siyahı yuxarıdan başlayır', async ({ page }) => {
  await page.goto('/hadith')
  await settle(page)
  await expect(page.locator(CARDS).first()).toBeVisible()
  await scrollToLoad(page, 2)
  await page.evaluate(() => document.querySelector('a.nav-link[href="/about"]').click())
  await expect(page).toHaveURL(/\/about$/)
  // Keçid tamamlansın (yeni səhifənin kodu yüklənənədək köhnəsi ekranda qalır)
  await expect(page.locator(CARDS)).toHaveCount(0)
  await page.evaluate(() => document.querySelector('a.nav-link[href="/hadith"]').click())
  await expect(page).toHaveURL(/\/hadith$/)
  await expect(page.locator(CARDS).first()).toBeVisible()
  expect(await page.locator(CARDS).count()).toBeLessThanOrEqual(30)
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50)
})

// v6.9: ravi sətri + "Tam mətn" pəncərəsi (hadith-api nəşrindən olduğu kimi)
test('tam mətn: ravi görünür, pəncərədə isnadlı ərəbcə və türkcə tərcümə, ingiliscəyə keçid', async ({ page, consoleProblems }) => {
  await page.goto('/hadith/1')
  await settle(page)
  const card = page.getByTestId('hadith-focus').locator(CARDS)
  await expect(card.locator('.hadith-narr')).toContainText('Abdullah ibn Ömər')
  await card.getByTestId('hadith-full-btn').click()
  const dlg = page.getByRole('dialog')
  await expect(dlg.getByTestId('hadith-full')).toBeVisible()
  await expect(dlg.locator('.hfull__ar')).toContainText('صلى الله عليه وسلم')
  await expect(dlg.locator('.hfull__tr')).toContainText('İslam beş şey üzerine')
  await dlg.getByRole('button', { name: 'English' }).click()
  await expect(dlg.locator('.hfull__tr')).toContainText("Narrated Ibn 'Umar")
  await page.keyboard.press('Escape')
  await expect(dlg).toBeHidden()
  expectCleanConsole(consoleProblems)
})
