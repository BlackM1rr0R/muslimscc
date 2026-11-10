// Mushaf — vərəqi barmaqla (siçanla) çevirmək (components/quran/useMushafCurl, utils/pageCurl).
// Mushaf qaydası: növbəti səhifə SOLDADIR — sol kənardan sağa çəkmək növbəti,
// sağ kənardan sola əvvəlki. Masaüstü (1440px) — iki səhifə, telefon — tək səhifə.
import { test, expect, settle, expectCleanConsole } from './fixtures.js'

// Quran.com səhifə cavabı — yer tutucu sözlərlə (mətn saxlanmır, testdə şəbəkə yoxdur)
function fakePage(n) {
  const words = []
  let pos = 1
  for (let line = 1; line <= 15; line++) {
    for (let k = 0; k < 5; k++) {
      words.push({ position: pos++, line_number: line, page_number: n, char_type_name: 'word', text_uthmani: 'كلمة', translation: { text: `w${pos}` }, transliteration: { text: 'kalima' } })
    }
  }
  words.push({ position: pos, line_number: 15, page_number: n, char_type_name: 'end', text_uthmani: '١' })
  return { verses: [{ verse_key: `2:${n + 10}`, juz_number: 1, rub_el_hizb_number: 1, words }] }
}

test.beforeEach(async ({ page }) => {
  await page.route(/api\.quran\.com\/api\/v4\/verses\/by_page\/\d+/, route => {
    const n = Number(route.request().url().match(/by_page\/(\d+)/)[1])
    route.fulfill({ json: fakePage(n) })
  })
})

const pageParam = page => Number(new URL(page.url()).searchParams.get('p'))

/** Çevriləcək vərəq: iki səhifədə sol (növbəti) və ya sağ (əvvəlki), təkdə yeganə vərəq */
async function leafBox(page, dir) {
  const spread = await page.locator('.mp-book.is-spread').count() > 0
  const sel = !spread ? '.mp-book .mp-sheet' : dir === 1 ? '.mp-book .mp-sheet--left' : '.mp-book .mp-sheet--right'
  const leaf = page.locator(sel).first()
  await leaf.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const box = await leaf.boundingBox()
  const vh = page.viewportSize().height
  // Görünən hissənin ortası (vərəq ekrandan uzun ola bilər)
  const top = Math.max(box.y, 0)
  const bottom = Math.min(box.y + box.height, vh)
  return { box, spread, travel: spread ? 2 * box.width : box.width, midY: (top + bottom) / 2, top }
}

/** Kənardan tutub frac × yol qədər çəkir (dir: +1 sağa, -1 sola) */
async function drag(page, dir, frac, { steps = 12, release = true, pause = 0 } = {}) {
  const { box, travel, midY } = await leafBox(page, dir)
  const x0 = dir === 1 ? box.x + 10 : box.x + box.width - 10
  const y0 = midY + 40
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  for (let i = 1; i <= steps; i++) await page.mouse.move(x0 + dir * travel * frac * (i / steps), y0 - 8 * (i / steps))
  if (pause) await page.waitForTimeout(pause)   // dayanıb buraxmaq — atma sürəti yoxdur
  if (release) await page.mouse.up()
}

test('sol kənardan sağa çəkmək növbəti səhifəni açır, sağdan sola — əvvəlkini', async ({ page, consoleProblems }) => {
  await page.goto('/mushaf?p=9')
  await settle(page)
  await expect(page.locator('.mp-sheet .mp-word').first()).toBeVisible()
  const spread = await page.locator('.mp-book.is-spread').count() > 0
  const step = spread ? 2 : 1
  await drag(page, 1, 0.6)
  await expect.poll(() => pageParam(page)).toBe(9 + step)
  await expect(page.locator('.mp-pager__pos .ui-num')).toHaveText(spread ? '11–12' : '10')
  expect(await page.evaluate(() => localStorage.getItem('mushaf_last_page'))).toBe(String(9 + step))
  await drag(page, -1, 0.6)
  await expect.poll(() => pageParam(page)).toBe(9)
  // Düymə və klaviatura əvvəlki kimi
  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => pageParam(page)).toBe(9 + step)
  expectCleanConsole(consoleProblems)
})

test('qısa çəkmə yerinə qayıdır, şaquli çəkmə və ortadan siçanla çəkmə vərəqləmir', async ({ page, consoleProblems }) => {
  await page.goto('/mushaf?p=20')
  await settle(page)
  const p0 = pageParam(page)
  await drag(page, 1, 0.12, { pause: 200 })
  await page.waitForTimeout(400)
  expect(pageParam(page)).toBe(p0)
  // şaquli
  const { box, midY } = await leafBox(page, 1)
  await page.mouse.move(box.x + 10, midY - 100)
  await page.mouse.down()
  await page.mouse.move(box.x + 20, midY + 100, { steps: 10 })
  await page.mouse.up()
  // ortadan (siçan — mətn seçimi üçün)
  await page.mouse.move(box.x + box.width / 2, midY)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 300, midY + 5, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)
  expect(pageParam(page)).toBe(p0)
  await expect(page.locator('.mp-curl')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('söz-söz: qısa toxunuş sözü açır, kənardan çəkmə isə vərəqləyir (popover açılmır)', async ({ page, consoleProblems }) => {
  await page.goto('/mushaf?p=30')
  await settle(page)
  await page.getByRole('button', { name: 'Söz-söz' }).click()
  const word = page.locator('.mp-book button.mp-word').nth(2)
  await word.click()
  await expect(page.locator('.mp-pop')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.mp-pop')).toHaveCount(0)
  const p0 = pageParam(page)
  await drag(page, 1, 0.6)
  await expect.poll(() => pageParam(page)).toBeGreaterThan(p0)
  await expect(page.locator('.mp-pop')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test.describe('hərəkət açıq', () => {
  test.use({ reducedMotion: 'no-preference' })
  test('çəkərkən kağız qatlanır (qat qatı görünür), buraxanda tamamlanır', async ({ page, consoleProblems }) => {
    await page.goto('/mushaf?p=41')
    await settle(page)
    await expect(page.locator('.mp-sheet .mp-word').first()).toBeVisible()
    const p0 = pageParam(page)
    await drag(page, 1, 0.5, { release: false })
    const curl = page.locator('.mp-curl')
    await expect(curl).toBeVisible()
    await expect.poll(() => curl.locator('.mp-curl__flap').evaluate(el => el.style.transform)).toContain('matrix(')
    const clip = await curl.locator('.mp-curl__under').evaluate(el => el.style.clipPath)
    expect(clip).not.toBe('polygon(0px 0px, 0px 0px, 0px 0px)')
    expect(clip).toMatch(/^polygon\(/)
    await page.mouse.up()
    await expect.poll(() => pageParam(page)).toBeGreaterThan(p0)
    await expect(curl).toHaveCount(0)
    // geri qayıtma: qısa çəkmə → qat qatı yox olur, səhifə dəyişmir
    const p1 = pageParam(page)
    await drag(page, -1, 0.1, { pause: 200 })
    await expect(page.locator('.mp-curl')).toHaveCount(0)
    expect(pageParam(page)).toBe(p1)
    expectCleanConsole(consoleProblems)
  })
})

test('telefon: barmaqla (touch) vərəqin ortasından sağa çəkmək də növbəti səhifəni açır', async ({ page, consoleProblems }, info) => {
  test.skip(info.project.name !== 'mobile', 'yalnız toxunma ekranı')
  await page.goto('/mushaf?p=60')
  await settle(page)
  await expect(page.locator('.mp-sheet .mp-word').first()).toBeVisible()
  const { box, midY } = await leafBox(page, 1)
  const cdp = await page.context().newCDPSession(page)
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  const x0 = box.x + box.width * 0.3
  await touch('touchStart', x0, midY)
  for (let i = 1; i <= 10; i++) await touch('touchMove', x0 + box.width * 0.6 * (i / 10), midY + 4)
  await touch('touchEnd')
  await expect.poll(() => pageParam(page)).toBe(61)
  expectCleanConsole(consoleProblems)
})
