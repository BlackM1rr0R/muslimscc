// ═══════════════════════════════════════════════════════
// Ayə təfsiri (components/TafsirPanel.jsx, utils/tafsir.js).
// Quran.com API page.route ilə saxtalaşdırılır — internetdən asılı deyil.
// Fikstür Fatihəni (7 ayə) qaytarır.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const TAFSIR_RE = /api\.quran\.com\/api\/v4\/tafsirs\/(\d+)\/by_ayah\/(\d+):(\d+)/

// Saxta cavab: mətndə təfsirin id-si və ayə görünür; zərərli HTML də var
function tafsirJson(id, s, a, extra = '') {
  return {
    tafsir: {
      resource_id: id,
      verses: { [`${s}:${a}`]: { id: a } },
      text: `<h2>Test ${id}</h2><p class="ar">TAFSIR-${id}-${s}:${a}</p><script>window.__xss = 1</script>`
        + `<img src="x" onerror="window.__xss = 2"><p onclick="window.__xss = 3">${extra}</p>`,
    },
  }
}

/** Sorğuları sayır; fail(n) — ilk n sorğu 500 qaytarır */
async function mockTafsir(page, { fail = 0, extra = '' } = {}) {
  const calls = []
  await page.route(TAFSIR_RE, route => {
    const [, id, s, a] = route.request().url().match(TAFSIR_RE)
    calls.push(`${id}:${s}:${a}`)
    if (calls.length <= fail) return route.fulfill({ status: 500, json: { error: 'x' } })
    return route.fulfill({ json: tafsirJson(Number(id), s, a, extra) })
  })
  return calls
}

test('düymə paneli açır: susmaya görə təfsir, təhlükəsiz HTML, mənbə linki; yalnız klikdə sorğu', async ({ page, consoleProblems }) => {
  const calls = await mockTafsir(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const card = page.locator('#ayah-2')
  await expect(card).toBeVisible()
  // Açılmamış panel yoxdur və heç bir sorğu getməyib
  await expect(page.locator('.tf-panel')).toHaveCount(0)
  expect(calls).toEqual([])

  const btn = card.getByRole('button', { name: /Təfsir/ })
  await expect(btn).toHaveAttribute('aria-expanded', 'false')
  await btn.click()
  await expect(btn).toHaveAttribute('aria-expanded', 'true')
  const panel = card.locator('.tf-panel')
  await expect(panel).toBeVisible()
  // az üçün susmaya görə rusca əs-Sədi (170) + dürüst qeyd
  await expect(panel.locator('.tf-text')).toContainText('TAFSIR-170-1:2')
  await expect(panel.locator('.tf-name')).toHaveText('Təfsir əs-Sədi')
  await expect(panel.locator('.tf-note')).toContainText('maşın tərcüməsi göstərmirik')
  await expect(panel.locator('.tf-text')).toHaveAttribute('lang', 'ru')
  // Sanitizer: script/img/onclick yoxdur, XSS işləməyib
  expect(await panel.locator('script, img, [onclick], [onerror]').count()).toBe(0)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  await expect(panel.locator('.tf-text h3')).toHaveText('Test 170')
  await expect(panel.locator('.tf-src a')).toHaveAttribute('href', 'https://quran.com/1:2/tafsirs/ru-tafseer-al-saddi')
  // Toxunma hədəfi ≥ 44px
  const box = await btn.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)

  // Bağla → yenidən aç: keşdən gəlir, təkrar sorğu yoxdur
  await btn.click()
  await expect(card.locator('.tf-panel')).toHaveCount(0)
  await btn.click()
  await expect(panel.locator('.tf-text')).toContainText('TAFSIR-170-1:2')
  expect(calls).toEqual(['170:1:2'])
  expectCleanConsole(consoleProblems)
})

test('təfsir seçimi dəyişir və yeniləmədən sonra yadda qalır', async ({ page, consoleProblems }) => {
  const calls = await mockTafsir(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const card = page.locator('#ayah-3')
  await card.getByRole('button', { name: /Təfsir/ }).click()
  const panel = card.locator('.tf-panel')
  await expect(panel.locator('.tf-text')).toContainText('TAFSIR-170-1:3')
  await panel.getByLabel('Təfsiri seçin').selectOption('169')
  await expect(panel.locator('.tf-text')).toContainText('TAFSIR-169-1:3')
  await expect(panel.locator('.tf-name')).toHaveText('Təfsir İbn Kəsir (ixtisarla)')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_tafsir')))).toEqual({ az: 169 })

  // Başqa ayədə də yeni seçim
  await page.locator('#ayah-4').getByRole('button', { name: /Təfsir/ }).click()
  await expect(page.locator('#ayah-4 .tf-text')).toContainText('TAFSIR-169-1:4')

  await page.reload()
  await settle(page)
  await page.locator('#ayah-3').getByRole('button', { name: /Təfsir/ }).click()
  await expect(page.locator('#ayah-3 .tf-text')).toContainText('TAFSIR-169-1:3')
  await expect(page.locator('#ayah-3').getByLabel('Təfsiri seçin')).toHaveValue('169')
  expect(calls).toContain('169:1:3')
  expectCleanConsole(consoleProblems)
})

test('xəta: dürüst mesaj + "Yenidən cəhd et" işləyir', async ({ page, consoleProblems }) => {
  await mockTafsir(page, { fail: 1 })
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const card = page.locator('#ayah-5')
  await card.getByRole('button', { name: /Təfsir/ }).click()
  const alert = card.locator('.tf-panel [role="alert"]')
  await expect(alert).toContainText('Təfsir yüklənmədi')
  await alert.getByRole('button', { name: 'Yenidən cəhd et' }).click()
  await expect(card.locator('.tf-text')).toContainText('TAFSIR-170-1:5')
  // 500 cavabı brauzer konsoluna "Failed to load resource" yazır — gözlənilən xətadır
  expectCleanConsole(consoleProblems.filter(p => !/status of 500/.test(p)))
})

test('oflayn: mesaj göstərilir, bağlantı qayıdanda özü yüklənir', async ({ page, context, consoleProblems }) => {
  await mockTafsir(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await context.setOffline(true)
  const card = page.locator('#ayah-6')
  await card.getByRole('button', { name: /Təfsir/ }).click()
  await expect(card.locator('.tf-panel [role="alert"]')).toContainText('İnternet bağlantısı yoxdur')
  await context.setOffline(false)
  await expect(card.locator('.tf-text')).toContainText('TAFSIR-170-1:6')
  expectCleanConsole(consoleProblems.filter(p => !/ERR_INTERNET_DISCONNECTED/.test(p)))
})

test('uzun mətn qısaldılmış açılır, "Daha çox göstər" genişləndirir', async ({ page, consoleProblems }) => {
  await mockTafsir(page, { extra: 'uzun mətn '.repeat(200) })
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  const card = page.locator('#ayah-1')
  await card.getByRole('button', { name: /Təfsir/ }).click()
  const text = card.locator('.tf-text')
  await expect(text).toHaveClass(/is-collapsed/)
  const more = card.getByRole('button', { name: /Daha çox göstər/ })
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await more.click()
  await expect(text).not.toHaveClass(/is-collapsed/)
  await expect(card.getByRole('button', { name: /Qısalt/ })).toHaveAttribute('aria-expanded', 'true')
  expectCleanConsole(consoleProblems)
})

test('ərəbcə (RTL): susmaya görə əl-Müyəssər, mətn rtl', async ({ page, consoleProblems }) => {
  const calls = await mockTafsir(page)
  await page.goto('/ar/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  const card = page.locator('#ayah-2')
  await card.getByRole('button', { name: /تفسير/ }).click()
  const text = card.locator('.tf-text')
  await expect(text).toContainText('TAFSIR-16-1:2')
  await expect(text).toHaveAttribute('dir', 'rtl')
  await expect(text).toHaveAttribute('lang', 'ar')
  await expect(card.locator('.tf-name')).toHaveText('التفسير الميسر')
  // ərəbcədə "öz dilində yoxdur" qeydi yoxdur
  await expect(card.locator('.tf-note')).toHaveCount(0)
  // Panel kartın içində qalır (RTL-də kənara çıxmır)
  const [c, p] = await Promise.all([card.boundingBox(), card.locator('.tf-panel').boundingBox()])
  expect(p.x).toBeGreaterThanOrEqual(c.x - 1)
  expect(p.x + p.width).toBeLessThanOrEqual(c.x + c.width + 1)
  // Seçim: əs-Sədi (ərəbcə)
  await card.getByLabel('اختر التفسير').selectOption('91')
  await expect(text).toContainText('TAFSIR-91-1:2')
  expect(calls).toEqual(['16:1:2', '91:1:2'])
  expectCleanConsole(consoleProblems)
})

test('ingiliscə: İbn Kəsir (ixtisarla), ltr', async ({ page, consoleProblems }) => {
  await mockTafsir(page)
  await page.goto('/en/quran/1-al-faatiha')
  await settle(page)
  const card = page.locator('#ayah-7')
  await card.getByRole('button', { name: /Tafsir/ }).click()
  await expect(card.locator('.tf-text')).toContainText('TAFSIR-169-1:7')
  await expect(card.locator('.tf-text')).toHaveAttribute('dir', 'ltr')
  await expect(card.locator('.tf-note')).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})
