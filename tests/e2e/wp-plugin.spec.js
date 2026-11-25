// ═══════════════════════════════════════════════════════
// /widget → "WordPress plagini" bölməsi (src/components/widget/WpPluginSection.jsx)
//   • endirmə düyməsi build-də yığılan zip-ə aparır (scripts/build-wp-plugin.mjs → dist/downloads/)
//   • 3 addım, 3-cü addımda seçimə uyğun qısa kod (şəhər/dil/görünüş dəyişəndə yenilənir)
//   • istinad linkinin susmaya görə sönük olduğu deyilir; axe; ərəbcə RTL; 360px-də daşma yoxdur
//   • avtomatik hündürlük (utils/embedHeight.js): yığcam /mosque-tv iframe-də məzmun hündürlüyünü
//     yalnız rəqəm kimi göndərir; REAL dinləyici skript (plagin + /widget əl ilə kodu) iframe-i
//     böyüdür, minimumdan kiçiltmir, başqa mənşəni qəbul etmir; /widget önizləməsi də kəsilmir
// Şəbəkə: yeni /api YOXDUR.
// ═══════════════════════════════════════════════════════
import { test, expect, settle, expectCleanConsole } from './fixtures.js'
import { autoHeightScript } from '../../src/utils/embedHeight.js'

/** Yerli serverdən yığcam məscid ekranı iframe-ləri + dinləyici (mənşə parametrlə) olan boş səhifə. */
async function embedPage(page, baseURL, { listenOrigin, frames }) {
  const origin = new URL(baseURL).origin
  const src = `${origin}/en/mosque-tv?city=Baku&lang=en&theme=light&compact=1`
  const iframes = frames.map(f => `<iframe id="${f.id}" src="${src}" width="480" height="${f.height}" style="border:0;display:block" title="${f.id}"></iframe>`).join('')
  // Test üçün mesajları ayrıca yazırıq (formanı yoxlamaq üçün); dinləyici skriptin özü dəyişmir
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0">${iframes}
<script>window.__msgs=[];addEventListener('message',function(e){window.__msgs.push({o:e.origin,d:e.data})})</script>
<script>${autoHeightScript(listenOrigin || origin)}</script></body></html>`)
  return origin
}
const frameOf = async (page, id) => (await page.locator(`#${id}`).elementHandle()).contentFrame()
// Tam ədəd (CSS piksel) — mobil cihaz miqyasında boundingBox() 900.0001 qaytarır
const frameH = (page, id) => page.evaluate((x) => document.getElementById(x).offsetHeight, id)
const innerOverflow = (frame) => frame.evaluate(() => { const m = document.querySelector('.mtv'); return m ? m.scrollHeight - m.clientHeight : 999 })

async function serious(page, include) {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .include(include)
    .analyze()
  return violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
    .flatMap(v => v.nodes.map(n => `${v.impact} · ${v.id} · ${n.target.join(' ')}`))
}

test('WordPress bölməsi: endirmə, 3 addım, seçimə uyğun qısa kod, istinad linki sönük', async ({ page, consoleProblems }) => {
  await page.goto('/en/widget')
  await settle(page)
  const sec = page.getByTestId('wg-wp')
  await sec.scrollIntoViewIfNeeded()
  await expect(sec.getByRole('heading', { level: 2, name: 'WordPress plugin' })).toBeVisible()

  const dl = sec.getByTestId('wg-wp-download')
  await expect(dl).toHaveAttribute('href', '/downloads/muslimscc-prayer-times.zip')
  await expect(dl).toHaveAttribute('download', '')
  await expect(sec.getByRole('list', { name: 'Install in three steps' }).getByRole('listitem')).toHaveCount(3)
  await expect(sec).toContainText('Plugins → Add New Plugin → Upload Plugin')
  await expect(sec).toContainText('never adds a link to your site on its own')

  const code = page.locator('#wg-code-wp')
  await expect(code).toHaveText('[muslimscc_prayer city="baku" lang="en"]')
  // Seçim dəyişəndə qısa kod da dəyişir
  await page.getByRole('combobox', { name: 'City' }).selectOption('New York')
  await page.getByRole('radiogroup', { name: 'Appearance' }).getByRole('radio', { name: 'Dark' }).click()
  await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'Türkçe' }).click()
  await expect(code).toHaveText('[muslimscc_prayer city="new-york" lang="tr" theme="dark"]')

  expect(await serious(page, '[data-testid="wg-wp"]')).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('zip build-də yığılıb və verilir (PK imzası)', async ({ page }) => {
  const res = await page.request.get('/downloads/muslimscc-prayer-times.zip')
  expect(res.status()).toBe(200)
  const body = await res.body()
  expect(body.subarray(0, 4).toString('hex')).toBe('504b0304')
  expect(body.includes(Buffer.from('muslimscc-prayer-times/muslimscc-prayer-times.php'))).toBe(true)
})

test('ərəbcə RTL və 360px-də üfüqi daşma yoxdur', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const base of ['/ar', '/ru', '']) {
    await page.goto(`${base}/widget`)
    await settle(page)
    const sec = page.getByTestId('wg-wp')
    await sec.scrollIntoViewIfNeeded()
    await expect(sec.getByTestId('wg-wp-download')).toBeVisible()
    if (base === '/ar') {
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="wg-wp"]')).direction)).toBe('rtl')
      await expect(sec.getByRole('heading', { level: 2 })).toHaveText('إضافة ووردبريس')
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(over, `${base || '/az'} 360px`).toBeLessThanOrEqual(1)
  }
})

test('avtomatik hündürlük: iframe məzmuna qədər böyüyür (kəsilmir), minimumdan kiçilmir; mesajda yalnız rəqəm', async ({ page, baseURL }) => {
  const origin = await embedPage(page, baseURL, { frames: [{ id: 'a', height: 200 }, { id: 'b', height: 900 }] })
  const a = await frameOf(page, 'a')
  const b = await frameOf(page, 'b')
  await a.waitForSelector('.mtv-grid')
  await b.waitForSelector('.mtv-grid')
  // 480 px enində 3 sütunlu cədvəl 200 px-ə sığmır → iframe böyüyür, içəridə sürüşmə qalmır
  await expect.poll(() => innerOverflow(a), { timeout: 15000 }).toBeLessThanOrEqual(1)
  expect(await frameH(page, 'a')).toBeGreaterThan(200)
  // Hündür iframe (900 = minimum) kiçilmir
  expect(await frameH(page, 'b')).toBe(900)
  const msgs = await page.evaluate(() => window.__msgs)
  expect(msgs.length).toBeGreaterThan(1)
  for (const m of msgs) {
    expect(m.o).toBe(origin)
    expect(Object.keys(m.d).sort()).toEqual(['h', 'type'])
    expect(m.d.type).toBe('muslimscc:height')
    expect(Number.isInteger(m.d.h) && m.d.h > 0).toBe(true)
  }
})

test('avtomatik hündürlük: başqa mənşədən (yalnız https://muslims.cc qəbul olunur) mesaj nəzərə alınmır', async ({ page, baseURL }) => {
  await embedPage(page, baseURL, { listenOrigin: 'https://muslims.cc', frames: [{ id: 'a', height: 200 }] })
  const a = await frameOf(page, 'a')
  await a.waitForSelector('.mtv-grid')
  // Mesaj gəlib (yerli mənşədən), amma dinləyici onu rədd edir — hündürlük dəyişmir
  await expect.poll(() => page.evaluate(() => window.__msgs.length), { timeout: 15000 }).toBeGreaterThan(0)
  await page.waitForTimeout(500)
  expect(await frameH(page, 'a')).toBe(200)
})

test('/widget: əl ilə yerləşdirmə üçün dinləyici kodu; dar ekranda önizləmə kəsilmir', async ({ page, consoleProblems }) => {
  await page.setViewportSize({ width: 400, height: 900 })
  await page.goto('/en/widget')
  await settle(page)
  const code = page.locator('#wg-code-iframe-auto')
  await code.scrollIntoViewIfNeeded()
  await expect(code).toHaveText(`<script>${autoHeightScript('https://muslims.cc')}</script>`)
  const preview = page.getByTestId('wg-iframe-preview')
  await preview.scrollIntoViewIfNeeded()
  const frame = await (await preview.elementHandle()).contentFrame()
  await frame.waitForSelector('.mtv-grid')
  await expect.poll(() => innerOverflow(frame), { timeout: 15000 }).toBeLessThanOrEqual(1)
  expect(await preview.evaluate((el) => el.offsetHeight)).toBeGreaterThanOrEqual(280)
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(over).toBeLessThanOrEqual(1)
  expectCleanConsole(consoleProblems)
})
