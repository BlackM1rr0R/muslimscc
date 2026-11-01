// ═══════════════════════════════════════════════════════
// Oxuyucuda tərcümə seçimi — QuranEnc.com (utils/quranEnc.js).
// QuranEnc API page.route ilə saxtalaşdırılır (fixtures.js susmaya görə
// quranenc.com sorğularını kəsir). Fikstür Fatihəni (7 ayə) qaytarır.
// Seçim: localStorage.quran_translation = { <dil>: <açar> }
// ═══════════════════════════════════════════════════════
import { test, expect, expectCleanConsole, settle } from './fixtures.js'

const SURA_RE = /quranenc\.com\/api\/v1\/translation\/sura\/([a-z_]+)\/(\d+)/
const LIST_RE = /quranenc\.com\/api\/v1\/translations\/list\/([a-z]+)/

/** Sorğuları sayır; fail — sura sorğusu 503 qaytarır */
async function mockQuranEnc(page, { fail = false } = {}) {
  const calls = { sura: [], list: [] }
  await page.route(SURA_RE, route => {
    const [, key, sura] = route.request().url().match(SURA_RE)
    calls.sura.push(`${key}/${sura}`)
    if (fail) return route.fulfill({ status: 503, json: {} })
    route.fulfill({ json: { result: Array.from({ length: 7 }, (_, i) => ({
      id: String(i + 1), sura, aya: String(i + 1), arabic_text: 'x',
      translation: `QE-${key} ${i + 1}${i === 0 ? '[1]' : ''}`,
      // Haşiyə düz mətndir — HTML kimi işlənməməlidir
      footnotes: i === 0 ? '[1] Haşiyə <b>qalın deyil</b><img src=x onerror="window.__xss=1">' : '',
    })) } })
  })
  await page.route(LIST_RE, route => {
    calls.list.push(route.request().url().match(LIST_RE)[1])
    route.fulfill({ json: { translations: [{
      key: 'azeri_musayev', direction: 'ltr', language_iso_code: 'az', version: '9.9.9', last_update: 1748378549,
      title: 'Azerbaijani Translation - Ali Khan Musayev',
    }] } })
  })
  return calls
}

const picker = page => page.getByRole('combobox', { name: 'Tərcümə' })

test('susmaya görə standart tərcümə: QuranEnc-ə sorğu yoxdur', async ({ page, consoleProblems }) => {
  const calls = await mockQuranEnc(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('#ayah-1 .ayah-trans')).toHaveText('[test ayə 1]')
  await expect(picker(page)).toHaveValue('')
  await expect(picker(page).locator('option').first()).toContainText('Vasim Məmmədəliyev və Ziya Bünyadov')
  expect(calls.sura).toEqual([])
  expect(calls.list).toEqual([])
  expectCleanConsole(consoleProblems)
})

test('QuranEnc tərcüməsi seçilir: mətn, haşiyə (düz mətn), mənbə + versiya, seçim yadda qalır', async ({ page, consoleProblems }) => {
  const calls = await mockQuranEnc(page)
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('#ayah-1 .ayah-trans')).toHaveText('[test ayə 1]')

  await picker(page).selectOption('azeri_musayev')
  await expect(page.locator('#ayah-1 .ayah-trans')).toHaveText('QE-azeri_musayev 1[1]')
  await expect(page.locator('#ayah-7 .ayah-trans')).toHaveText('QE-azeri_musayev 7')
  // Mənbə: QuranEnc.com linki, rəsmi ad, versiya (siyahı API-sindən — ən son)
  const meta = page.locator('.qp-trans-src__meta')
  await expect(meta.getByRole('link', { name: 'QuranEnc.com' })).toHaveAttribute('href', 'https://quranenc.com/az/browse/azeri_musayev/1')
  await expect(meta).toContainText('Azerbaijani Translation - Ali Khan Musayev')
  await expect(meta).toContainText('versiya 9.9.9')
  // Haşiyə: yalnız 1-ci ayədə, bağlı; açılanda mətn olduğu kimi (HTML işlənmir)
  await expect(page.locator('#ayah-2 .ayah-fn')).toHaveCount(0)
  const fn = page.locator('#ayah-1 .ayah-fn')
  await fn.getByText('Haşiyələr').click()
  await expect(fn.locator('p')).toHaveText('[1] Haşiyə <b>qalın deyil</b><img src=x onerror="window.__xss=1">')
  await expect(fn.locator('b, img')).toHaveCount(0)
  expect(await page.evaluate(() => window.__xss)).toBeUndefined()

  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_translation')))).toEqual({ az: 'azeri_musayev' })
  expect(calls.sura).toEqual(['azeri_musayev/1'])

  // Yenidən yükləmə: seçim qalır, surə sessiya keşindən gəlir (təkrar sorğu yoxdur)
  await page.reload()
  await settle(page)
  await expect(picker(page)).toHaveValue('azeri_musayev')
  await expect(page.locator('#ayah-1 .ayah-trans')).toHaveText('QE-azeri_musayev 1[1]')
  expect(calls.sura).toEqual(['azeri_musayev/1'])

  // Standarta qayıdış
  await picker(page).selectOption('')
  await expect(page.locator('#ayah-1 .ayah-trans')).toHaveText('[test ayə 1]')
  await expect(page.locator('#ayah-1 .ayah-fn')).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('quran_translation')))).toEqual({})
  expectCleanConsole(consoleProblems)
})

test('QuranEnc xətası: standart tərcümə qalır, kiçik bildiriş görünür', async ({ page, consoleProblems }) => {
  await page.addInitScript(() => localStorage.setItem('quran_translation', JSON.stringify({ az: 'azeri_musayev' })))
  const calls = await mockQuranEnc(page, { fail: true })
  await page.goto('/quran/1-al-faatiha')
  await settle(page)
  await expect(page.locator('.qp-trans-src__error')).toContainText('standart tərcümə göstərilir')
  await expect(page.locator('#ayah-1 .ayah-trans')).toHaveText('[test ayə 1]')
  expect(calls.sura.length).toBeGreaterThan(0)
  // 503 — brauzerin "Failed to load resource" qeydi (fixtures.js quranenc-i nəzərə almır)
  expectCleanConsole(consoleProblems)
})

test('en: QuranEnc tərcümələrinin siyahısı (Saheeh International, Hilali & Khan, Rowwad)', async ({ page, consoleProblems }) => {
  await mockQuranEnc(page)
  await page.goto('/en/quran/1-al-faatiha')
  await settle(page)
  const sel = page.getByRole('combobox', { name: 'Translation' })
  await expect(sel.locator('option')).toHaveText(['Muhammad Asad (default)', 'Saheeh International', 'Hilali & Khan', 'Rowwad Translation Center'])
  expectCleanConsole(consoleProblems)
})
