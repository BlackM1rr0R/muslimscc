// ═══════════════════════════════════════════════════════
// Ortaq e2e fikstürü:
//   • xarici API-ləri sabit cavabla əvəzləyir (deterministik testlər)
//   • konsol xətalarını və [i18n] xəbərdarlıqlarını toplayır — hər test
//     sonunda `consoleProblems` boş olmalıdır (bax: expectCleanConsole)
// ═══════════════════════════════════════════════════════
import { test as base, expect } from '@playwright/test'

// aladhan.com /timings cavabının bizə lazım olan hissəsi
const TIMINGS = {
  code: 200,
  status: 'OK',
  data: {
    timings: { Fajr: '05:32', Sunrise: '07:01', Dhuhr: '12:29', Asr: '15:24', Sunset: '17:51', Maghrib: '17:51', Isha: '19:10' },
    date: {
      readable: '27 Oct 2026',
      gregorian: { date: '27-10-2026', day: '27', month: { number: 10, en: 'October' }, year: '2026', weekday: { en: 'Tuesday' } },
      hijri: { date: '15-05-1448', day: '15', month: { number: 5, en: 'Jumādá al-ūlá', ar: 'جُمادى الأولى' }, year: '1448' },
    },
    meta: { timezone: 'Asia/Baku', method: { id: 13 } },
  },
}

// alquran.cloud — Fatihə (qısa, hər nəşr üçün eyni forma)
function ayahs(n) {
  return Array.from({ length: n }, (_, i) => ({ number: i + 1, numberInSurah: i + 1, text: `[test ayə ${i + 1}]`, juz: 1, page: 1 }))
}
function surahEdition(identifier, type) {
  return {
    number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening',
    numberOfAyahs: 7, revelationType: 'Meccan', ayahs: ayahs(7),
    edition: { identifier, language: identifier.split('.')[0], type, format: 'text' },
  }
}

// Brauzerin özü-özünə yaratdığı, saytın xətası olmayan səs-küy
const IGNORED = [
  /favicon/i,
  /firestore|firebase|googleapis\.com|gstatic/i,   // testdə Firebase şəbəkəsi əlçatmaz ola bilər
  /Failed to load resource.*(fonts\.g|aladhan|alquran|everyayah|islamic\.network)/i,
  /service ?worker/i,
  /\[vite\]/i,
]

export const test = base.extend({
  consoleProblems: async ({ page }, use) => {
    const problems = []
    page.on('console', (msg) => {
      const t = msg.text()
      // "Failed to load resource" mesajında URL olmur — mənbəni location-dan götür
      const where = `${t} ${msg.location()?.url || ''}`
      const isI18n = t.includes('[i18n]')
      if ((msg.type() === 'error' || isI18n) && !IGNORED.some(r => r.test(where))) problems.push(`[${msg.type()}] ${t} ${msg.location()?.url || ''}`.trim())
    })
    page.on('pageerror', (err) => problems.push(`[pageerror] ${err.message}`))
    await use(problems)
  },

  page: async ({ page }, use) => {
    await page.route(/api\.aladhan\.com\//, route => route.fulfill({ json: TIMINGS }))
    await page.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, route => {
      const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
      route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => surahEdition(e, e.startsWith('ar.') ? 'quran' : 'translation')) } })
    })
    await page.route(/api\.alquran\.cloud\/v1\/surah(\?|$)/, route => route.fulfill({
      // 1-ci sürə real adı ilə (testlər onu adla tapıb açır), qalanları yer tutucu
      json: { code: 200, status: 'OK', data: Array.from({ length: 114 }, (_, i) => (i === 0
        ? { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' }
        : { number: i + 1, name: 'سورة', englishName: `Surah ${i + 1}`, englishNameTranslation: 'Test', numberOfAyahs: 7, revelationType: i % 3 ? 'Medinan' : 'Meccan' })) },
    }))
    // Firebase (admin məzmunu, push) testdə bağlıdır: nəticə xarici bazadan
    // asılı olmasın, sayt onsuz da Firebase-siz də işləməlidir (oflayn rejim)
    await page.route(/firestore\.googleapis\.com|firebaseinstallations|fcmregistrations|identitytoolkit/, route => route.abort())
    // Səs faylları və xarici şriftlər testdə lazım deyil
    await page.route(/\.(mp3|ogg|wav)(\?|$)/, route => route.abort())
    await use(page)
  },
})

export { expect }

/** Testin sonunda: konsolda xəta və ya əskik tərcümə xəbərdarlığı yoxdur. */
export function expectCleanConsole(problems) {
  expect(problems, 'konsolda xəta / [i18n] xəbərdarlığı olmamalıdır').toEqual([])
}

/**
 * Səhifə yüklənsin (lazy chunk-lar). "networkidle" ən çox 3 san gözlənilir:
 * Firebase daimi bağlantı saxlayır və şəbəkə heç vaxt tam "sakit" olmur —
 * limitsiz gözləmə hər testin bütün vaxtını yeyirdi.
 */
export async function settle(page) {
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
}
