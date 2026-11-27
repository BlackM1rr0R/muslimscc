// Surə atmosferi (components/quran/SurahAtmosphere, data/surahAtmosphere) + ünvan başlığı (UnwanFrame):
// düymə ilə söndürmə və yadda qalma, səhnəsiz surədə düymə yoxdur, hərəkət azaldılıbsa tam statik,
// hərəkət açıqdırsa vərəq gizlənəndə fasilə; Mushaf vərəqində surə başlanğıcının çərçivəsi.
import { test, expect, settle } from './fixtures.js'

const SURAHS = {
  89: { name: 'سُورَةُ ٱلْفَجْرِ', en: 'Al-Fajr', tr: 'The Dawn', n: 30 },
  92: { name: 'سُورَةُ ٱللَّيْلِ', en: 'Al-Lail', tr: 'The Night', n: 21 },
  1: { name: 'سُورَةُ ٱلْفَاتِحَةِ', en: 'Al-Faatiha', tr: 'The Opening', n: 7 },
}

// alquran.cloud — istənən surənin nömrəsi ilə (fikstürün standartı həmişə Fatihəni qaytarır)
async function mockSurah(page) {
  await page.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, route => {
    const url = route.request().url()
    const num = Number(url.match(/surah\/(\d+)\//)[1])
    const s = SURAHS[num] || SURAHS[1]
    const eds = decodeURIComponent(url.split('/editions/')[1].split('?')[0]).split(',')
    route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => ({
      number: num, name: s.name, englishName: s.en, englishNameTranslation: s.tr, numberOfAyahs: s.n, revelationType: 'Meccan',
      ayahs: Array.from({ length: s.n }, (_, i) => ({ number: i + 1, numberInSurah: i + 1, text: `[test ${num}:${i + 1}]`, juz: 30, page: 593 })),
      edition: { identifier: e, language: e.split('.')[0], type: e.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
    })) } })
  })
}

async function openReader(page, path) {
  await mockSurah(page)
  await page.goto(path)
  await settle(page)
  await expect(page.locator('.reader-header .uw h1.reader-arabic')).toBeVisible()
}

test('əl-Fəcr: ünvan başlığı, dan yeri səhnəsi; düymə söndürür və seçim yadda qalır', async ({ page }) => {
  await openReader(page, '/quran/89-al-fajr')
  // Ünvan: medalyon (rozet + irəliləyiş halqası) çərçivənin üstündə, çərçivə 5 SVG hissədən
  const top = page.locator('.reader-header__top.is-unwan')
  await expect(top.locator('.rh-glyph .sg')).toBeVisible()
  await expect(top.locator('.uw .uw-frame svg')).toHaveCount(5)
  await expect(top.locator('.uw .uw-frame')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(SURAHS[89].name)

  const atmos = page.getByTestId('surah-atmos')
  await expect(atmos).toHaveAttribute('data-scene', 'dawn')
  await expect(atmos).toHaveAttribute('aria-hidden', 'true')
  const toggle = page.getByTestId('atmos-toggle')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(toggle).toHaveAccessibleName('Fon atmosferi')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(atmos).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('quran_atmos'))).toBe('0')

  // Yenidən yükləmədən sonra da sönülü qalır
  await page.reload()
  await settle(page)
  await expect(page.locator('.reader-header .uw h1.reader-arabic')).toBeVisible()
  await expect(page.getByTestId('atmos-toggle')).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByTestId('surah-atmos')).toHaveCount(0)

  await page.getByTestId('atmos-toggle').click()
  await expect(page.getByTestId('surah-atmos')).toHaveAttribute('data-scene', 'dawn')
  expect(await page.evaluate(() => localStorage.getItem('quran_atmos'))).toBe('1')
})

test('hərəkət azaldılıb: atmosfer və çərçivə tam statikdir', async ({ page }) => {
  await openReader(page, '/quran/89-al-fajr')
  const atmos = page.getByTestId('surah-atmos')
  await expect(atmos).toBeAttached()
  const anims = await atmos.evaluate(el => [el, ...el.querySelectorAll('*')].map(n => getComputedStyle(n).animationName).filter(a => a !== 'none'))
  expect(anims).toEqual([])
  // Çərçivə "çəkilmə" üçün götürülmür — dərhal tam görünür
  const uw = page.locator('.reader-header .uw')
  await expect(uw).not.toHaveAttribute('data-draw-ready', '')
  const offs = await uw.locator('.uw-cap .uw-o').evaluateAll(els => els.map(e => parseFloat(getComputedStyle(e).strokeDashoffset)))
  expect(offs).toEqual([0, 0])
  const mid = await uw.locator('.uw-mid').first().evaluate(e => getComputedStyle(e).transform)
  expect(mid).toBe('none')
})

test('səhnəsi olmayan surə: düymə və fon yoxdur, ünvan var', async ({ page }) => {
  await openReader(page, '/quran/1-al-faatiha')
  await expect(page.locator('.reader-header .uw .uw-frame svg')).toHaveCount(5)
  await expect(page.getByTestId('atmos-toggle')).toHaveCount(0)
  await expect(page.getByTestId('surah-atmos')).toHaveCount(0)
})

test.describe('hərəkət açıq', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('əl-Leyl: ulduzlar sayrışır, vərəq gizlənəndə fasilə; çərçivə bir dəfə çəkilir', async ({ page }) => {
    await openReader(page, '/quran/92-al-lail')
    const atmos = page.getByTestId('surah-atmos')
    await expect(atmos).toHaveAttribute('data-scene', 'night')
    await expect.poll(() => atmos.locator('.qa-stars--0').evaluate(e => getComputedStyle(e).animationName)).toBe('qa-twinkle')
    await expect(page.locator('.reader-header .uw')).toHaveAttribute('data-drawn', '')

    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(atmos).toHaveAttribute('data-paused', '')
    expect(await atmos.locator('.qa-stars--0').evaluate(e => getComputedStyle(e).animationPlayState)).toBe('paused')
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(atmos).not.toHaveAttribute('data-paused', '')
  })
})

test('Mushaf: surə başlanğıcında ünvan çərçivəsi', async ({ page }) => {
  // 593-cü səhifə: 1-ci sətir — başlıq, 2-ci — bəsmələ, sonra 89:1-dən sözlər (yer tutucu)
  await page.route(/api\.quran\.com\/api\/v4\/verses\/by_page\/\d+/, route => {
    const n = Number(route.request().url().match(/by_page\/(\d+)/)[1])
    const words = []
    let pos = 1
    for (let line = 3; line <= 15; line++) {
      for (let k = 0; k < 4; k++) words.push({ position: pos++, line_number: line, page_number: n, char_type_name: 'word', text_uthmani: 'كلمة', translation: { text: 'w' }, transliteration: { text: 'k' } })
    }
    route.fulfill({ json: { verses: [{ verse_key: '89:1', juz_number: 30, rub_el_hizb_number: 237, words }] } })
  })
  await page.goto('/mushaf?p=593')
  await settle(page)
  const head = page.locator('.mp-line--header').first()
  await expect(head).toBeVisible()
  await expect(head.locator('.uw.mp-uw .uw-frame svg')).toHaveCount(5)
  await expect(head.locator('.mp-surah-title')).toContainText('سورة')
})
