// v6.1: Mushafda canlı qiraət, Elm yolları, Peyğəmbərlər şəcərəsi, xəttatlıq kompozisiyası, Siyər tuneli
import { test, expect, settle } from './fixtures.js'

const scrollTo = async (page, loc) => {
  for (let i = 0; i < 50 && !(await loc.count()); i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(150) }
  await loc.scrollIntoViewIfNeeded()
}

// 0.9 s səssiz WAV (8 kHz, 16 bit) — real oxutma üçün ("ended" hadisəsi gəlsin)
function silentWav(sec = 0.9) {
  const n = Math.round(8000 * sec), b = Buffer.alloc(44 + n * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12)
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24)
  b.writeUInt32LE(16000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40)
  return b
}
function fakePage(n) {
  const words = []
  let pos = 1
  for (let line = 1; line <= 15; line++) {
    for (let k = 0; k < 5; k++) words.push({ position: pos++, line_number: line, page_number: n, char_type_name: 'word', text_uthmani: 'كلمة', translation: { text: `w${pos}` }, transliteration: { text: 'kalima' } })
  }
  words.push({ position: pos, line_number: 15, page_number: n, char_type_name: 'end', text_uthmani: '١' })
  return { verses: [{ verse_key: `2:${n + 10}`, juz_number: 1, rub_el_hizb_number: 1, words }] }
}

test('Mushaf canlı qiraət: söz parlayır, səhifə bitəndə vərəq özü çevrilir', async ({ page }) => {
  const recPages = []
  await page.route(/api\.quran\.com\/api\/v4\/verses\/by_page\/\d+/, route => route.fulfill({ json: fakePage(Number(route.request().url().match(/by_page\/(\d+)/)[1])) }))
  await page.route(/api\.quran\.com\/api\/v4\/recitations\/7\/by_page\/\d+/, route => {
    const n = Number(route.request().url().match(/by_page\/(\d+)/)[1]); recPages.push(n)
    route.fulfill({ json: { audio_files: [{ verse_key: `2:${n + 10}`, url: `Alafasy/mp3/t${n}.wav`, segments: Array.from({ length: 8 }, (_, i) => [i, i + 1, i * 100, i * 100 + 99]) }] } })
  })
  await page.route(/verses\.quran\.com\//, route => route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav() }))
  await page.goto('/mushaf?p=3')
  await settle(page)
  await expect(page.locator('.mp-book [data-wk]').first()).toBeVisible()
  const startP = Number(new URL(page.url()).searchParams.get('p'))
  await page.getByTestId('mushaf-recite').click()
  await expect(page.getByTestId('mushaf-recite-bar')).toBeVisible()
  await expect(page.locator('.mp-book .is-rc-word')).toHaveCount(1, { timeout: 8000 })
  await expect(page.locator('.mp-book .is-rc-ayah').first()).toBeVisible()
  // Səs bitdi → növbəti səhifə (iki səhifəli görünüşdə +2)
  await expect.poll(() => Number(new URL(page.url()).searchParams.get('p')), { timeout: 12000 }).toBeGreaterThan(startP)
  await expect.poll(() => recPages.some(n => n > startP + 1), { timeout: 8000 }).toBe(true)
  // Dayandır / bağla
  await page.getByTestId('mushaf-recite').click()
  await expect(page.getByTestId('mushaf-recite-bar')).toHaveCount(0)
  await expect(page.locator('.mp-book .is-rc-word')).toHaveCount(0)
})

test('Elm yolları: xəritə, il sürüşdürücüsü sağ olan alimləri dəyişir', async ({ page }) => {
  await page.goto('/scholars')
  await settle(page)
  const sec = page.getByTestId('scholar-routes')
  await scrollTo(page, sec)
  await expect(sec.locator('.srt__land')).toHaveCount(1, { timeout: 10000 })
  const list = sec.getByTestId('srt-list')
  await sec.getByTestId('srt-year').fill('870')
  await expect(list).toContainText('Buxari')
  await sec.getByTestId('srt-year').fill('1999')
  await expect(list).toContainText('Albani')
  await expect(list).not.toContainText('Buxari')
  expect(await sec.getByTestId('srt-pt').count()).toBeGreaterThan(15)
})

test('Peyğəmbərlər şəcərəsi: İbrahimə toxunanda oğulları və ayələri görünür', async ({ page }) => {
  await page.goto('/history')
  await settle(page)
  const tr = page.getByTestId('prophet-tree')
  await scrollTo(page, tr)
  await tr.getByTestId('ptr-ibrahim').click()
  const box = tr.getByTestId('ptr-info')
  await expect(box).toContainText('İsmail')
  await expect(box).toContainText('14:39')
  await expect(box.locator('a[href*="/quran/14"]').first()).toHaveAttribute('href', /\?a=39$/)
  await tr.getByTestId('ptr-isa').click()
  await expect(box).toContainText('61:6')
})

test('Xəttatlıq kompozisiyası: kətan çəkilir, forma dəyişir, yükləmə PNG verir', async ({ page }) => {
  await page.goto('/quotes')
  await settle(page)
  const sec = page.getByTestId('calligraphy-composer')
  await scrollTo(page, sec)
  const cv = sec.getByTestId('ccm-canvas')
  await expect(cv).toBeVisible()
  const ink = () => cv.evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i] > 180 && d[i + 1] > 140) n++; return n })
  await expect.poll(ink, { timeout: 6000 }).toBeGreaterThan(200)
  await sec.getByTestId('ccm-form-seal').click()
  await sec.getByTestId('ccm-ph-subhan').click()
  await expect(cv).toHaveAttribute('aria-label', /سبحان الله/)
  await expect.poll(ink, { timeout: 6000 }).toBeGreaterThan(200)
  await page.evaluate(() => { navigator.canShare = () => false })
  const dl = page.waitForEvent('download')
  await sec.getByTestId('ccm-save').click()
  expect((await dl).suggestedFilename()).toMatch(/^muslims-cc-subhan-seal\.png$/)
})

test('Siyər tuneli: hadisələr 610–632, "Növbəti" mətni dəyişir', async ({ page }) => {
  await page.goto('/history')
  await settle(page)
  const fig = page.getByTestId('seerah-tunnel')
  await scrollTo(page, fig)
  const text = fig.getByTestId('seerah-text')
  await expect(text).toContainText('İlk vəhy')
  await fig.getByTestId('seerah-next').click()
  await expect(text).not.toContainText('İlk vəhy')
  const n = await fig.locator('.stn__dots button').count()
  expect(n).toBeGreaterThan(15)
  await fig.locator('.stn__dots button').last().click()
  await expect(text).toContainText('632')
})
