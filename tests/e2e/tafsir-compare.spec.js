// ═══════════════════════════════════════════════════════
// Təfsirlərin müqayisəsi (components/quran/TafsirCompare.jsx).
// Quran.com API page.route ilə saxtalaşdırılır — internetdən asılı deyil.
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const TAFSIR_RE = /api\.quran\.com\/api\/v4\/tafsirs\/(\d+)\/by_ayah\/(\d+):(\d+)/

/** Sorğuları sayır; failIds — həmişə 500 qaytaran təfsirlər (bir sütunun xətası) */
async function mockTafsir(page, { failIds = [] } = {}) {
  const calls = []
  await page.route(TAFSIR_RE, route => {
    const [, id, s, a] = route.request().url().match(TAFSIR_RE)
    calls.push(`${id}:${s}:${a}`)
    if (failIds.includes(Number(id))) return route.fulfill({ status: 500, json: { error: 'x' } })
    return route.fulfill({
      json: {
        tafsir: {
          resource_id: Number(id),
          verses: { [`${s}:${a}`]: { id: Number(a) } },
          text: `<p>CMP-${id}-${s}:${a}</p><script>window.__xss = 1</script><img src="x" onerror="window.__xss = 2">`,
        },
      },
    })
  })
  return calls
}

async function openCompare(page, path, ayah, toggleName, compareName, dialogName = compareName) {
  await page.goto(path)
  await settle(page)
  const card = page.locator(`#ayah-${ayah}`)
  await card.getByRole('button', { name: toggleName }).click()
  const btn = card.locator('.tf-panel').getByRole('button', { name: compareName })
  await btn.click()
  const dlg = page.getByRole('dialog', { name: dialogName })
  await expect(dlg).toBeVisible()
  return { card, btn, dlg }
}

test('en: 3 təfsir yan-yana, lang/dir, mənbə + nəşr, ayə naviqasiyası, keş', async ({ page, consoleProblems }) => {
  const calls = await mockTafsir(page)
  const { dlg } = await openCompare(page, '/en/quran/1-al-faatiha', 2, /^Tafsir/, 'Compare tafsirs')
  // Susmaya görə (en): İbn Kəsir (ingiliscə), əs-Sədi (ərəbcə), əl-Müyəssər
  const cols = dlg.locator('.tfc-col')
  await expect(cols).toHaveCount(3)
  await expect(cols.locator('h3')).toHaveText(['Tafsir Ibn Kathir (abridged)', 'Tafsir al-Sa’di', 'Al-Tafsir al-Muyassar'])
  const en = dlg.locator('[data-tafsir="169"] .tf-text')
  const ar = dlg.locator('[data-tafsir="91"] .tf-text')
  await expect(en).toContainText('CMP-169-1:2')
  await expect(en).toHaveAttribute('lang', 'en')
  await expect(en).toHaveAttribute('dir', 'ltr')
  await expect(ar).toContainText('CMP-91-1:2')
  await expect(ar).toHaveAttribute('lang', 'ar')
  await expect(ar).toHaveAttribute('dir', 'rtl')
  await expect(dlg.locator('[data-tafsir="16"] .tf-text')).toContainText('CMP-16-1:2')
  // Sanitizer: script/img yoxdur
  expect(await dlg.locator('script, img, [onerror]').count()).toBe(0)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()
  // Mənbə + nəşr
  await expect(dlg.locator('[data-tafsir="91"] .tf-src a')).toHaveAttribute('href', 'https://quran.com/1:2/tafsirs/ar-tafseer-al-saddi')
  await expect(dlg.locator('[data-tafsir="91"] .tfc-col__ed')).toContainText('Quran.com API v4 · #91 · ar-tafseer-al-saddi')

  // Ayə naviqasiyası
  const ref = dlg.locator('.tfc-ref')
  await expect(ref).toContainText('1:2')
  await dlg.getByRole('button', { name: 'Next verse' }).click()
  await expect(ref).toContainText('1:3')
  await expect(en).toContainText('CMP-169-1:3')
  await expect(dlg.locator('[data-tafsir="169"] .tf-src a')).toHaveAttribute('href', 'https://quran.com/1:3/tafsirs/en-tafisr-ibn-kathir')
  await dlg.getByRole('button', { name: 'Previous verse' }).click()
  await dlg.getByRole('button', { name: 'Previous verse' }).click()
  await expect(ref).toContainText('1:1')
  await expect(dlg.getByRole('button', { name: 'Previous verse' })).toBeDisabled()
  await expect(en).toContainText('CMP-169-1:1')
  // 1:2-yə qayıdış keşdən (təkrar sorğu yoxdur)
  await dlg.getByRole('button', { name: 'Next verse' }).click()
  await expect(en).toContainText('CMP-169-1:2')
  expect(calls.filter(c => c === '169:1:2')).toHaveLength(1)
  expectCleanConsole(consoleProblems)
})

test('seçim: ən çox 3, sonuncu çıxarılmır, yeniləmədən sonra yadda qalır; ESC fokus qaytarır', async ({ page, consoleProblems }) => {
  await mockTafsir(page)
  const { btn, dlg } = await openCompare(page, '/en/quran/1-al-faatiha', 4, /^Tafsir/, 'Compare tafsirs')
  // 3 seçilib — qalanları bağlıdır
  await expect(dlg.getByRole('checkbox', { name: /Tafsir al-Tabari/ })).toBeDisabled()
  await expect(dlg.locator('.tfc-count')).toContainText('3 tafsirs selected (up to 3)')
  await dlg.getByRole('checkbox', { name: /Al-Tafsir al-Muyassar/ }).uncheck()
  await expect(dlg.locator('.tfc-col')).toHaveCount(2)
  await expect(dlg.locator('.tfc-count')).toContainText('2 tafsirs selected (up to 3)')
  await dlg.getByRole('checkbox', { name: /Tafsir al-Tabari/ }).check()
  await expect(dlg.locator('[data-tafsir="15"] .tf-text')).toContainText('CMP-15-1:4')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_tafsir_compare')))).toEqual({ en: [169, 91, 15] })

  // ESC → bağlanır, fokus "Compare tafsirs" düyməsinə qayıdır
  await page.keyboard.press('Escape')
  await expect(dlg).toHaveCount(0)
  await expect(btn).toBeFocused()

  await page.reload()
  await settle(page)
  const card = page.locator('#ayah-4')
  await card.getByRole('button', { name: /^Tafsir/ }).click()
  await card.locator('.tf-panel').getByRole('button', { name: 'Compare tafsirs' }).click()
  const again = page.getByRole('dialog', { name: 'Compare tafsirs' })
  await expect(again.locator('.tfc-col h3')).toHaveText(['Tafsir Ibn Kathir (abridged)', 'Tafsir al-Sa’di', 'Tafsir al-Tabari (Jami’ al-Bayan)'])

  // Yalnız biri qalanda o çıxarıla bilmir
  await again.getByRole('checkbox', { name: /Tafsir al-Tabari/ }).uncheck()
  await again.getByRole('checkbox', { name: /Tafsir al-Sa’di.*Arabic/ }).uncheck()
  await expect(again.getByRole('checkbox', { name: /Tafsir Ibn Kathir \(abridged\)/ })).toBeDisabled()
  await expect(again.locator('.tfc-count')).toContainText('1 tafsir selected (up to 3)')
  // Bağla düyməsi
  await again.getByRole('button', { name: 'Close' }).click()
  await expect(again).toHaveCount(0)
  expectCleanConsole(consoleProblems)
})

test('bir sütunda xəta — digərləri göstərilir, "Try again" var', async ({ page, consoleProblems }) => {
  await mockTafsir(page, { failIds: [91] })
  const { dlg } = await openCompare(page, '/en/quran/1-al-faatiha', 5, /^Tafsir/, 'Compare tafsirs')
  await expect(dlg.locator('[data-tafsir="169"] .tf-text')).toContainText('CMP-169-1:5')
  const bad = dlg.locator('[data-tafsir="91"] [role="alert"]')
  await expect(bad).toContainText('could not be loaded')
  await expect(bad.getByRole('button', { name: 'Try again' })).toBeVisible()
  // Boş role="alert" yoxdur
  for (const el of await dlg.locator('[role="alert"]').all()) expect((await el.textContent()).trim()).not.toBe('')
  expectCleanConsole(consoleProblems.filter(p => !/status of 500/.test(p)))
})

test('ar: dialoq RTL, ərəbcə yazılar; 360px-də sütunlar alt-alta', async ({ page, consoleProblems }) => {
  await page.setViewportSize({ width: 360, height: 780 })
  await mockTafsir(page)
  const { dlg } = await openCompare(page, '/ar/quran/1-al-faatiha', 2, /^تفسير/, 'قارن بين التفاسير', 'مقارنة التفاسير')
  await expect(dlg).toHaveAttribute('dir', 'rtl')
  await expect(dlg.getByRole('heading', { level: 2 })).toHaveText(/مقارنة التفاسير/)
  const cols = dlg.locator('.tfc-col')
  await expect(cols).toHaveCount(3)
  await expect(dlg.locator('[data-tafsir="14"] .tf-text')).toContainText('CMP-14-1:2')
  // Alt-alta: hamısı eyni sütunda, üfüqi daşma yoxdur
  const boxes = await Promise.all([0, 1, 2].map(i => cols.nth(i).boundingBox()))
  expect(Math.abs(boxes[0].x - boxes[1].x)).toBeLessThan(2)
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y)
  const overflow = await dlg.evaluate(d => d.scrollWidth - d.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
  expectCleanConsole(consoleProblems)
})
