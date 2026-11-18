// ═══════════════════════════════════════════════════════
// Ortaq e2e fikstürü:
//   • xarici API-ləri sabit cavabla əvəzləyir (deterministik testlər)
//   • öz API-mizi (/api/content, /api/singletons, /api/push, /api/admin) susmaya
//     görə "boş" cavabla əvəzləyir — dev serverin /api proksisi canlı sayta
//     getməsin, preview-da 404 konsol xətası olmasın. Testlər öz page.route-ları
//     ilə bunu əvəz edə bilər (Playwright-da SONRA qeyd olunan marşrut birinci işləyir).
//   • konsol xətalarını və [i18n] xəbərdarlıqlarını toplayır — hər test
//     sonunda `consoleProblems` boş olmalıdır (bax: expectCleanConsole)
// ═══════════════════════════════════════════════════════
import { test as base, expect } from '@playwright/test'
import { computeTimes } from '../../src/utils/prayCalc.js'

// Azərbaycan şəhərlərinin vaxtları aladhan-dan deyil, yerli hesabdan gəlir
// (Əbu Bəkr məscidinin cədvəli — src/utils/prayCalc.js). Testlər gözlənilən
// vaxtı eyni funksiya ilə hesablayır.
export const BAKU = { lat: 40.3953, lng: 49.8822 }
export const SHEKI = { lat: 41.1919, lng: 47.1706 }
/** Bakı vaxtı ilə verilən anın (susmaya görə — indi) təqvim günü üçün vaxtlar. */
export function azTimes(at = new Date(), loc = BAKU) {
  const p = {}
  for (const x of new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at)) p[x.type] = x.value
  return computeTimes({ year: +p.year, month: +p.month, day: +p.day }, loc.lat, loc.lng, 4)
}

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
  /googleapis\.com|gstatic/i,   // Google xidmətləri (GIS, YouTube önizləmələri) testdə əlçatmaz ola bilər
  /Failed to load resource.*(fonts\.g|aladhan|alquran|everyayah|islamic\.network|hadeethenc|quranenc|jsdelivr|githubusercontent)/i,
  /service ?worker/i,
  /\[vite\]/i,
  // İstifadəçi hesabı API-sinin GÖZLƏNİLƏN 4xx cavabları (girişsiz /me → 401, yanlış şifrə → 401, admin 403 kodları):
  // brauzer onları "Failed to load resource" kimi yazır — saytın xətası deyil (UI onları özü göstərir)
  // (+ admin 2FA: yanlış kod → 401 /api/admin/2fa — server/security.js)
  /Failed to load resource.*\/api\/(auth\/|personal\/|admin\/(users|role-audit|2fa))/i,
  // D mərhələsi (otaq, ailə, hifz yoxlaması) — gözlənilən 4xx (yanlış/köhnə keçid, giriş yoxdur): UI özü göstərir
  /Failed to load resource.*\/api\/(read-together|family|hifz-tests)(\/|\?|$)/i,
  // I mərhələsi (çağırışlar, siniflər, təqvim axını) — gözlənilən 4xx (yanlış keçid, giriş yoxdur): UI özü göstərir
  /Failed to load resource.*\/api\/(challenges|classes|cal-feed)(\/|\?|$)/i,
]

// Saxta Google Identity Services (src/utils/googleSignIn.js-in işlətdiyi hissə)
const GIS_STUB = `(() => {
  let cfg = null
  window.google = { accounts: { id: {
    initialize(c) { cfg = c },
    renderButton(el, opts) {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = 'Google'
      b.setAttribute('data-gis-stub', (opts && opts.text) || '')
      b.style.cssText = 'min-height:44px;padding:0 24px;border-radius:22px;border:1px solid #747775;background:#fff;color:#1f1f1f;font:500 14px sans-serif'
      b.onclick = () => cfg && cfg.callback({ credential: 'test-google-credential', select_by: 'btn' })
      el.appendChild(b)
    },
    prompt() {}, cancel() {}, disableAutoSelect() {},
  } } }
})()`

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
    // Zəif cihaz rejimi (utils/liteDevice) nüvə sayından asılıdır: GitHub runner-də 4 vCPU
    // → "lite", lokalda isə yox. Testlər hər yerdə EYNİ rejimdə işləsin deyə sabitlənir.
    await page.addInitScript(() => { try { localStorage.setItem('muslim_cc_motion', 'full') } catch { /* */ } })
    await page.route(/api\.aladhan\.com\//, route => route.fulfill({ json: TIMINGS }))
    // v5.7: hava (components/home/WeatherDua) — standart: aydın, küləksiz (kart görünmür)
    await page.route(/api\.open-meteo\.com\/v1\/forecast/, route => route.fulfill({ json: { current: { weather_code: 0, wind_speed_10m: 5, temperature_2m: 12 } } }))
    await page.route(/api\.alquran\.cloud\/v1\/surah\/\d+\/editions\//, route => {
      const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
      route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => surahEdition(e, e.startsWith('ar.') ? 'quran' : 'translation')) } })
    })
    // Günün ayəsi (/v1/ayah/<n>/editions/…) — real API-yə getməsin (paralel testlərdə
    // alquran.cloud sorğuları rədd edir, CORS xətası konsola düşürdü)
    await page.route(/api\.alquran\.cloud\/v1\/ayah\/\d+\/editions\//, route => {
      const eds = decodeURIComponent(route.request().url().split('/editions/')[1].split('?')[0]).split(',')
      route.fulfill({ json: { code: 200, status: 'OK', data: eds.map(e => ({
        number: 1, numberInSurah: 1, text: '[test 1:1]', surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha' },
        edition: { identifier: e, language: e.split('.')[0], type: e.startsWith('ar.') ? 'quran' : 'translation', format: 'text' },
      })) } })
    })
    await page.route(/api\.alquran\.cloud\/v1\/surah(\?|$)/, route => route.fulfill({
      // 1-ci sürə real adı ilə (testlər onu adla tapıb açır), qalanları yer tutucu
      json: { code: 200, status: 'OK', data: Array.from({ length: 114 }, (_, i) => (i === 0
        ? { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', englishNameTranslation: 'The Opening', numberOfAyahs: 7, revelationType: 'Meccan' }
        : { number: i + 1, name: 'سورة', englishName: `Surah ${i + 1}`, englishNameTranslation: 'Test', numberOfAyahs: 7, revelationType: i % 3 ? 'Medinan' : 'Meccan' })) },
    }))
    // Öz API-miz (src/api/*) — susmaya görə boş məzmun: nəticə serverdəki
    // məlumatdan asılı olmasın. Formalar server/content.js ilə eynidir:
    //   /api/content/<kolleksiya> → []   /api/content/version → { version, collections }
    //   /api/singletons/<id>      → null (sənəd yoxdur — klient standartı göstərir;
    //                                server 404 verir, amma 404 konsol xətası yaradır)
    // Yalnız yolun ƏVVƏLİ /api/... (dev-də /src/api/content.js modulu da var — onu tutmamalı)
    await page.route((u) => /^\/api\/(content|singletons|push|admin)(\/|$)/.test(u.pathname), (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/api/content/version') return route.fulfill({ json: { version: 0, collections: {} } })
      if (url.pathname.startsWith('/api/content/')) return route.fulfill({ json: url.pathname.split('/').length > 4 ? null : [] })
      if (url.pathname.startsWith('/api/singletons/')) return route.fulfill({ json: null })
      if (url.pathname === '/api/push/vapid-public-key') return route.fulfill({ status: 503, json: { error: 'Web Push not configured' } })
      if (url.pathname.startsWith('/api/push/')) return route.fulfill({ json: { ok: true } })
      // Admin: daxil olunmayıb (adminAuth.js-dəki saxta sessiya bunu əvəz edir)
      return route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    })
    // İstifadəçi hesabı (server/users.js) — susmaya görə DAXİL OLMAYIB. Passkey avtomatik doldurma
    // (/login) seçimləri alır; real WebAuthn testdə işləmir (rpId saxtadır) — klient səssizcə dayanır.
    // Spec-lər (tests/e2e/userAuth.js) öz saxta sessiyası ilə əvəz edir.
    await page.route((u) => u.pathname.startsWith('/api/auth/'), (route) => {
      const { pathname } = new URL(route.request().url())
      if (pathname === '/api/auth/passkey/login/options') {
        return route.fulfill({ json: { challengeId: 'c'.repeat(24), options: { challenge: 'dGVzdC1jaGFsbGVuZ2UtMDAwMDAwMDA', rpId: 'invalid.test', timeout: 300000, userVerification: 'required', allowCredentials: [] } } })
      }
      if (pathname === '/api/auth/forgot') return route.fulfill({ json: { ok: true } })
      return route.fulfill({ status: 401, json: { error: 'Unauthorized', code: 'unauthenticated' } })
    })
    // Şəxsi xatırlatmalar (server/personal.js) — susmaya görə boş; tests/e2e/personalApi.js öz saxtasını qoyur
    await page.route((u) => u.pathname === '/api/personal' || u.pathname.startsWith('/api/personal/'), (route) => {
      const { pathname } = new URL(route.request().url())
      const get = route.request().method() === 'GET'
      if (get && pathname === '/api/personal/letters') return route.fulfill({ json: { letters: [], consent: false, emailVerified: true, max: 50, maxLength: 4000 } })
      if (get && pathname === '/api/personal/loved') return route.fulfill({ json: { items: [], consent: false, emailVerified: true, lovedEmail: true, share: { active: false, createdAt: null, followers: [] }, following: [], max: 50 } })
      if (get && pathname === '/api/personal/zakat') return route.fulfill({ json: { reminder: null, consent: false, emailVerified: true } })
      if (pathname === '/api/personal/push-link/status') return route.fulfill({ json: { linked: false } })
      return route.fulfill({ status: 401, json: { error: 'Unauthorized', code: 'unauthenticated' } })
    })
    // D mərhələsi (server/readTogether.js, family.js, hifzTest.js) — susmaya görə boş / girişsiz.
    // Spec-lər tests/e2e/socialApi.js ilə öz saxtasını qoyur.
    await page.route((u) => /^\/api\/(read-together|family|hifz-tests)(\/|$)/.test(u.pathname), (route) => {
      const { pathname } = new URL(route.request().url())
      const get = route.request().method() === 'GET'
      if (get && pathname === '/api/family') return route.fulfill({ json: { circle: null, cards: [], share: null, consent: false, limits: {} } })
      if (get && pathname === '/api/hifz-tests') return route.fulfill({ json: { tests: [], max: 10 } })
      if (get && pathname === '/api/read-together/mine') return route.fulfill({ json: { rooms: [], max: 3 } })
      // Girişsiz keçidlər (yoxlayan, qonaq) — serverdə olmayan token → 404 (real serverin cavabı)
      if (pathname === '/api/hifz-tests/open' || pathname === '/api/hifz-tests/submit') return route.fulfill({ status: 404, json: { error: 'Invalid link', code: 'invalid_token' } })
      if (pathname === '/api/read-together/join') return route.fulfill({ status: 404, json: { error: 'invalid_invite', code: 'invalid_invite' } })
      return route.fulfill({ status: 401, json: { error: 'unauthenticated', code: 'unauthenticated' } })
    })
    // I mərhələsi (server/challenges.js, classes.js, calFeed.js, familyRamadan.js) — susmaya görə boş / girişsiz.
    // tests/e2e/togetherApi.js öz saxtasını qoyur. /api/family/ramadan — Ramazan mövsümü bağlı, dairə yoxdur.
    await page.route((u) => /^\/api\/(challenges|classes|cal-feed|family\/ramadan)(\/|$)/.test(u.pathname), (route) => {
      const { pathname } = new URL(route.request().url())
      const get = route.request().method() === 'GET'
      if (get && pathname === '/api/challenges') return route.fulfill({ json: { challenges: [], limits: {} } })
      if (get && pathname === '/api/classes') return route.fulfill({ json: { teaching: [], learning: [], limits: {} } })
      if (get && pathname === '/api/cal-feed') return route.fulfill({ json: { enabled: false, cats: null, lang: null, createdAt: null, available: [] } })
      if (get && pathname === '/api/family/ramadan') return route.fulfill({ json: { season: { open: false, hyear: 1448, start: '2027-02-08', end: '2027-03-09', phase: null }, circle: null } })
      return route.fulfill({ status: 401, json: { error: 'unauthenticated', code: 'unauthenticated' } })
    })
    // Ümmətin Canlı Xətmi (server/globalKhatm.js) — susmaya görə boş dövr; ictimai SSE bir "hello" göndərib
    // bağlanır (retry çox böyükdür — yenidən qoşulmur). tests/e2e/khatm.spec.js öz saxtasını qoyur.
    await page.route((u) => u.pathname.startsWith('/api/khatm/'), (route) => {
      const { pathname } = new URL(route.request().url())
      const empty = { roundNo: 1, startedAt: Date.UTC(2026, 10, 1), bits: '', readCount: 0, active: 0, total: 604 }
      if (pathname === '/api/khatm/state') return route.fulfill({ json: empty })
      if (pathname === '/api/khatm/stats') return route.fulfill({ json: { roundNo: 1, readCount: 0, active: 0, rounds: 0 } })
      if (pathname === '/api/khatm/rounds') return route.fulfill({ json: { rounds: [], page: 1, pages: 1, total: 0, ramadan: null } })
      if (pathname === '/api/khatm/me') return route.fulfill({ json: { claim: null, rounds: [], dedications: [], loved: [], minReadMs: 40000, claimMs: 1800000 } })
      if (pathname === '/api/khatm/live') return route.fulfill({ status: 200, contentType: 'text/event-stream', body: `retry: 86400000\n\nevent: hello\ndata: ${JSON.stringify(empty)}\n\n` })
      return route.fulfill({ status: 401, json: { error: 'unauthenticated', code: 'unauthenticated' } })
    })
    // Google ilə giriş (accounts.google.com/gsi/client) — real Google-a getməsin: kiçik saxta GIS.
    // Düymə basılanda callback-ə saxta ID tokeni verir (server cavabını spec saxtalaşdırır).
    await page.route(/^https:\/\/accounts\.google\.com\/gsi\//, (route) => (route.request().url().includes('/gsi/client')
      ? route.fulfill({ contentType: 'text/javascript', body: GIS_STUB })
      : route.abort()))
    // Cihazlar arası sinxronizasiya (server/sync.js) — susmaya görə yaddaşda (hər səhifəyə ayrıca);
    // hesab sinxronizasiyası girişdən sonra blok yarada bilər. sync.spec.js / account-sync.spec.js öz serverini qoyur.
    const syncBlobs = new Map()
    await page.route((u) => /^\/api\/sync\/[^/]+$/.test(u.pathname), (route) => {
      const req = route.request()
      const id = new URL(req.url()).pathname.split('/').pop()
      const row = syncBlobs.get(id)
      if (req.method() === 'GET') return row ? route.fulfill({ json: row }) : route.fulfill({ status: 404, json: { error: 'not_found' } })
      if (req.method() === 'PUT') {
        const { blob, version = 0 } = req.postDataJSON() || {}
        const cur = row ? row.version : 0
        if (cur !== version) return route.fulfill({ status: 409, json: { version: cur } })
        syncBlobs.set(id, { blob, version: cur + 1, updatedAt: Date.now() })
        return route.fulfill({ json: { version: cur + 1, updatedAt: Date.now() } })
      }
      if (req.method() === 'DELETE') { syncBlobs.delete(id); return route.fulfill({ json: { ok: true } }) }
      return route.fulfill({ status: 405, json: {} })
    })
    // Ümmətin sayğacı (server/ummah.js) — preview-da API yoxdur; testlər öz route-u ilə əvəz edə bilər
    await page.route((u) => u.pathname === '/api/ummah', (route) => (route.request().method() === 'POST'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: { day: '2026-01-01', today: { salawat: 0, dhikr: 0, juz: 0 }, total: { salawat: 0, dhikr: 0, juz: 0 } } })))
    // v7.2: "indi zikr edənlər" xəritəsi (server/ummah.js → /api/ummah/here)
    await page.route((u) => u.pathname === '/api/ummah/here', (route) => (route.request().method() === 'POST'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: { window: 600, cells: [{ lat: 40, lng: 50, n: 3 }, { lat: 22, lng: 40, n: 12 }, { lat: -6, lng: 106, n: 5 }] } })))
    // v7.3: hilal müşahidələri (server/sightings.js → /api/sightings)
    await page.route((u) => u.pathname === '/api/sightings', (route) => (route.request().method() === 'POST'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: { date: '2026-01-01', from: '2025-12-31', to: '2026-01-02', cells: [
        { lat: 40, lng: 50, seen: 2, notSeen: 1, methods: { eye: 2, binoculars: 1, telescope: 0, camera: 0 } },
        { lat: 21, lng: 40, seen: 5, notSeen: 0, methods: { eye: 4, binoculars: 0, telescope: 1, camera: 0 } },
        { lat: -6, lng: 107, seen: 0, notSeen: 3, methods: { eye: 3, binoculars: 0, telescope: 0, camera: 0 } }] } })))
    // v6.2: Quran.com ayə sözləri / qiraət vaxtları (ReciterCompare, /quran) — canlı şəbəkəyə getməsin;
    // headless brauzerə API 404 qaytarır → konsol xətası. Spec-lər öz route-ları ilə əvəz edir.
    await page.route(/api\.quran\.com\/api\/v4\/(recitations\/\d+\/by_ayah|verses\/by_key)\//, route => route.fulfill({ json: {} }))
    // Səs faylları və xarici şriftlər testdə lazım deyil
    await page.route(/\.(mp3|ogg|wav)(\?|$)/, route => route.abort())
    // v3.2: yeni xarici mənbələr (HadeethEnc, QuranEnc, hadith-api) — CI-da canlı şəbəkəyə getməsin.
    // Spec-lər öz page.route-ları ilə bunların üstünə yazır (sonra qeydə alınan qalib gəlir).
    await page.route(/hadeethenc\.com\/api\/|quranenc\.com\/api\/|cdn\.jsdelivr\.net\/gh\/fawazahmed0|raw\.githubusercontent\.com\/fawazahmed0/, route => route.abort())
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
 * Şəbəkə (xarici API-lər, gec yüklənən chunk-lar) bəzən tam "sakit" olmur —
 * limitsiz gözləmə hər testin bütün vaxtını yeyirdi.
 */
export async function settle(page) {
  await page.waitForLoadState('load').catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
}
