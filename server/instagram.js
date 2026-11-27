// ═══════════════════════════════════════════════════════════════════════
// Instagram avtoposteri — gündə 3 dəfə (Asia/Baku) FEED postu + STORY: günün ayəsi / hədisi / duası və ya Allahın adı
//
// • Rəsmi Instagram Graph API (Content Publishing; docs/INSTAGRAM.md): POST /{ig-user-id}/media (image_url [+caption]
//   və ya media_type=STORIES) → GET /{container}?fields=status_code (FINISHED) → POST /{ig-user-id}/media_publish.
//   Susmaya görə "Instagram API with Instagram Login" (graph.instagram.com, Facebook Page lazım deyil);
//   IG_API_HOST=graph.facebook.com — "Facebook Login" / Unified variantı.
// • TAM SÖNÜLÜ (şəbəkə sorğusu, fayl, libvips yükü yoxdur), əgər api.env-də IG_ENABLED=1, IG_ACCESS_TOKEN, IG_USER_ID
//   yoxdursa və ya formatı yararsızdırsa: /api/ig/* → 404, planlayıcı heç nə etmir. Admin önizləməsi işləyir (dərc etmir).
// • Məzmun YALNIZ saytın öz məlumatıdır, dəyişdirilmir və qısaldılmır: ayə — daily-ayah.js (alquran.cloud, push ilə eyni),
//   hədis — daily-hadith-data.js (səhih siyahı), dua / ad — instagram-data.js (src/data/duas.js, names99.js).
//   "Səhih" yazısı yalnız Buxari / Müslim mənbəsində (utils/hadithGrade.js → gradeOf, 1-ci qayda); qalanında yalnız mənbə.
//   Kartda sığmayan element atlanır, sıradakı element götürülür.
// • Kartlar: <DB qovluğu>/ig-cards/<YYYY-MM-DD>-<yuva>-<feed|story>.jpg → GET /api/ig/card/<ad>.jpg (Instagram buradan
//   çəkir; yalnız sərt regex, qovluq keçidi yoxdur). 7 gündən köhnələr silinir.
// • Bir dəfə dərc: instagram_posts (day, slot, format) UNIQUE — INSERT OR IGNORE ilə "tutan" proses dərc edir
//   (kəsintisiz deploy-da yanaşı işləyən iki proses eyni postu iki dəfə atmır). Yarımçıq "claimed" sətir 10 dəq sonra
//   yenidən götürülür. Xəta → 2 / 5 / 15 / 30 dəq fasilə ilə təkrar (≤ 5 cəhd); avtorizasiya xətası (190 və s.) → planlayıcı
//   dayanır, BİR dəfə loglanır (token heç vaxt loglanmır, URL çap olunmur — token Authorization başlığındadır).
// • Token: Instagram Login tokeni 60 gündür — həftədə bir refresh_access_token; yenilənmiş token bazada AES-256-GCM ilə
//   (açar = env tokenindən törəmə: baza ehtiyat nüsxəsi tək başına tokeni açmır; env dəyişəndə köhnə qeyd avtomatik
//   etibarsızdır). İstifadəçi məlumatı YOXDUR (cədvəllər users-ə bağlı deyil, ixrac/xülasəyə düşmür).
// • REEL (IG_REELS=1, IG_REEL_TIME susmaya görə 18:00): günün ayəsinin videosu — MP4 serverdə çəkilmir, CI yazır
//   (<cardDir>/<tarix>-reel.mp4 + .json; instagramReel.js, docs/INSTAGRAM.md → "Reels"). Fayl yoxdursa bir dəfə
//   loglanır və atlanır. media_type=REELS + video_url (Range dəstəyi ilə xidmət olunur), share_to_feed, ~5 dəq status.
// • BÖYÜMƏ (docs/INSTAGRAM.md → "Böyümə"): açar sözlü 1-ci sətir, növ üzrə ≤ 5 heşteq (gündən günə deterministik növbə),
//   feed / karusel şəkillərinə alt_text (IG_ALT_TEXT=0 söndürür), IG_LOCATION_ID (feed, reel, karusel; susmaya görə yox) —
//   Meta parametri rədd etsə onsuz təkrar göndərilir. Həftəlik karusel (IG_CAROUSEL=1, IG_CAROUSEL_DAY=5, IG_CAROUSEL_TIME=11:00):
//   uşaq konteynerlər → media_type=CAROUSEL. İnsights (IG_INSIGHTS=0 söndürür): gündə bir dəfə reach / saves / shares →
//   instagram_insights; icazə yoxdursa yalnız vəziyyət qeyd olunur, dərc dayanmır.
// • RAMAZAN GERİ SAYIMI (IG_RAMADAN, susmaya görə açıq; IG_RAMADAN_TIME susmaya görə 07:00): gündə bir əlavə STORY —
//   "N days until Ramadan", hicri tarix, saytın /road-to-ramadan yolunun bugünkü addımı (instagramRamadan.js, 'dawn' teması).
//   Yalnız Ramazana 90 … 1 gün qalanda; Ramazan ərzində və sonra özü sönür. Sətir: (gün, 'ramadan', 'story').
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const express = require('express')
const dailyAyah = require('./daily-ayah')
const dailyHadith = require('./daily-hadith')
const IG_DATA = require('./instagram-data')
const { nowAt } = require('./telegramBot')
const REEL = require('./instagramReel')
const RAMADAN = require('./instagramRamadan')

const LANGS = ['az', 'en', 'ru', 'tr', 'ar']
const TZ = 'Asia/Baku'
const DEFAULT_SLOTS = ['08:00', '13:00', '20:00']
const SLOT_KINDS = ['ayah', 'hadith', 'extra']          // 3-cü yuva: tək gün — ad, cüt gün — dua
const HOSTS = ['graph.instagram.com', 'graph.facebook.com']
const DEFAULT_VERSION = 'v27.0'
const CATCHUP_MIN = 90                                    // server yuva vaxtı işləmirdisə, 90 dəq ərzində tutur
const STALE_CLAIM_MS = 10 * 60e3
const BACKOFF_MIN = [2, 5, 15, 30]
const MAX_ATTEMPTS = BACKOFF_MIN.length + 1
const CARD_TTL_MS = 7 * 864e5
const ROW_TTL_MS = 180 * 864e5
const REFRESH_EVERY_MS = 7 * 864e5
const REFRESH_MIN_AGE_MS = 2 * 864e5                     // Meta: token ən azı 24 saatlıq olmalıdır
const MAX_PICK_TRIES = 8
const CARD_NAME_RE = /^(\d{4}-\d{2}-\d{2})-([0-5])-(feed|story)\.jpg$/
const RAMADAN_NAME_RE = /^(\d{4}-\d{2}-\d{2})-ramadan-story\.jpg$/
const RAMADAN_SLOT = 'ramadan'
const DEFAULT_RAMADAN_TIME = '07:00'
const TOKEN_RE = /^[A-Za-z0-9._|-]{20,2048}$/
const USER_ID_RE = /^\d{5,30}$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const SAHIH = { az: 'Səhih', en: 'Sahih', ru: 'Сахих', ar: 'صحيح', tr: 'Sahih' }
const TITLES = {
  ayah: dailyAyah.TITLE_PREFIX,
  hadith: dailyHadith.TITLE,
  dua: { az: 'Günün duası', en: 'Dua of the day', ru: 'Дуа дня', tr: 'Günün duası', ar: 'دعاء اليوم' },
  name: { az: 'Allahın gözəl adları', en: 'The Beautiful Names of Allah', ru: 'Прекрасные имена Аллаха', tr: "Allah'ın güzel isimleri", ar: 'أسماء الله الحسنى' },
}
const PROOF = { az: 'Dəlil', en: 'Proof', ru: 'Доказательство', tr: 'Delil', ar: 'الدليل' }
const READ_MORE = { az: 'Saytda oxuyun', en: 'Read on the site', ru: 'Читать на сайте', tr: 'Sitede okuyun', ar: 'اقرأ في الموقع' }
// ── Heşteqlər (docs/INSTAGRAM.md → "Böyümə"): hər növ üçün kiçik, mövzuya uyğun hovuz; 1-ci element "lövbər"dir (həmişə),
//    qalanları günə görə deterministik növbələşir (eyni caption bloku hər gün təkrarlanmasın). Cəmi ≤ HASHTAG_MAX (#muslimscc
//    daxil) — Instagram 2025-dən 3–5 heşteq tövsiyə edir, sonra postda ən çox 5-ə endirdi; spam / "follow4follow" tipli və
//    yalnız nəhəng ümumi teqlər (#love, #instagood) yoxdur. az / en / ar qarışığı: əsas dil + 2-ci dil + ərəbcə.
const HASHTAG_MAX = 5
const HASHTAGS = {
  az: {
    ayah: ['#ayə', '#quran', '#qurani_kərim', '#gününayəsi', '#islam'],
    hadith: ['#hədis', '#sünnə', '#peyğəmbər', '#gününhədisi', '#islam'],
    dua: ['#dua', '#zikr', '#gününduası', '#müsəlman', '#islam'],
    name: ['#əsmaülhüsna', '#allahınadları', '#zikr', '#islam'],
    reel: ['#quran', '#tilavət', '#ayə', '#qurani_kərim', '#islam'],
  },
  en: {
    ayah: ['#quran', '#quranverses', '#verseoftheday', '#islamicreminder', '#quranquotes'],
    hadith: ['#hadith', '#sunnah', '#hadithoftheday', '#islamicreminder', '#prophetmuhammad'],
    dua: ['#dua', '#dhikr', '#duaoftheday', '#islamicreminder', '#remembrance'],
    name: ['#asmaulhusna', '#99namesofallah', '#namesofallah', '#dhikr', '#islamicreminder'],
    reel: ['#quranrecitation', '#quran', '#tilawah', '#quranverses', '#islamicreminder'],
  },
  ru: {
    ayah: ['#коран', '#аят', '#ислам', '#мусульмане'],
    hadith: ['#хадис', '#сунна', '#ислам', '#пророк'],
    dua: ['#дуа', '#зикр', '#ислам', '#мусульмане'],
    name: ['#асмаульхусна', '#именааллаха', '#зикр', '#ислам'],
    reel: ['#коран', '#чтениекорана', '#аят', '#ислам'],
  },
  tr: {
    ayah: ['#kuran', '#ayet', '#kuranıkerim', '#islam'],
    hadith: ['#hadis', '#sünnet', '#peygamber', '#islam'],
    dua: ['#dua', '#zikir', '#müslüman', '#islam'],
    name: ['#esmaülhüsna', '#allahınisimleri', '#zikir', '#islam'],
    reel: ['#kuran', '#tilavet', '#kuranıkerim', '#islam'],
  },
  ar: {
    ayah: ['#قرآن', '#آية', '#القرآن_الكريم', '#تدبر'],
    hadith: ['#حديث', '#سنة', '#السنة_النبوية', '#حديث_شريف'],
    dua: ['#دعاء', '#ذكر', '#أذكار', '#دعاء_اليوم'],
    name: ['#أسماء_الله_الحسنى', '#ذكر', '#الله'],
    reel: ['#تلاوة', '#قرآن', '#القرآن_الكريم', '#تلاوة_خاشعة'],
  },
}
const CAPTION_MAX = 2200
const FIRST_LINE_MAX = 140
// alt_text (yalnız feed şəkli / karusel elementi; Meta: reel və story-də yoxdur) — kartın təsviri, elementin istinadı ilə
const ALT_DESC = {
  text: { az: 'ərəb mətni və tərcüməsi', en: 'Arabic text and translation', ru: 'арабский текст и перевод', tr: 'Arapça metni ve çevirisi', ar: 'النص العربي' },
  name: { az: 'ərəbcə yazılışı, oxunuşu və mənası', en: 'Arabic script, transliteration and meaning', ru: 'арабское написание, транслитерация и значение', tr: 'Arapça yazılışı, okunuşu ve anlamı', ar: 'الاسم بالعربية' },
}
const ALT_MAX = 1000
// Həftəlik karusel (IG_CAROUSEL=1): mövzu həftəyə görə növbələşir; yalnız tərcüməsi yoxlanmış mənbələr (Hisn YOX — AI tərcümə)
const CAROUSEL_THEMES = ['name', 'hadith', 'ayah']
// Karusel cümə 11:00-da 08:00 (dawn) və 13:00 (day) arasına düşür — qonşularla eyni olmasın deyə həmişə night (2026-11-27)
const CAROUSEL_COLOURS = ['night']
const CAROUSEL_ITEMS = 5
const CAROUSEL_MIN_ITEMS = 3
const CAROUSEL_NAME_RE = /^(\d{4}-\d{2}-\d{2})-carousel-(\d)\.jpg$/
const DEFAULT_CAROUSEL_TIME = '11:00'
const DEFAULT_CAROUSEL_DAY = 5                          // cümə (0 — bazar)
const CAROUSEL_TITLE = {
  name: TITLES.name,
  hadith: { az: 'Buxari və Müslimdən hədislər', en: 'Hadiths from al-Bukhari and Muslim', ru: 'Хадисы из аль-Бухари и Муслима', tr: 'Buhârî ve Müslim’den hadisler', ar: 'أحاديث من البخاري ومسلم' },
  ayah: { az: 'Quran ayələri', en: 'Verses of the Quran', ru: 'Аяты Корана', tr: 'Kur’an ayetleri', ar: 'آيات من القرآن الكريم' },
}
const CAROUSEL_LINK = { name: '/names', hadith: '/hadith', ayah: '/quran' }
const WEEKLY = { az: 'Həftənin seçməsi', en: 'Weekly selection', ru: 'Подборка недели', tr: 'Haftanın seçkisi', ar: 'مختارات الأسبوع' }
// Ox (U+2192) MccInter-də yoxdur (kartda ▯ çıxırdı, 2026-11-25) — Latın-1 « » işarələri hər iki şriftdə var
const SWIPE = { az: 'Sürüşdürün »', en: 'Swipe »', ru: 'Листайте »', tr: 'Kaydırın »', ar: '« اسحب' }
const CLOSING = {
  az: 'Hər gün ayə, hədis və dua', en: 'A verse, a hadith and a dua every day', ru: 'Каждый день — аят, хадис и дуа',
  tr: 'Her gün ayet, hadis ve dua', ar: 'كل يوم آية وحديث ودعاء',
}
const SITE_LINE = { az: 'Sayt', en: 'Website', ru: 'Сайт', tr: 'Site', ar: 'الموقع' }
const IG_HANDLE = '@muslimscc'
// İnsights (IG_INSIGHTS, susmaya görə açıq; icazə yoxdursa dərcə toxunmadan dayanır): son 30 günün postları, gündə bir dəfə
const INSIGHT_METRICS = ['reach,saved,shares,likes,comments,views', 'reach,saved,shares,likes,comments']
const INSIGHT_DAYS = 30
const INSIGHT_MAX_PER_RUN = 60
const INSIGHT_FORMATS = ['feed', 'reel', 'carousel']

// ── Konfiqurasiya (env) ──
function parseSlots(raw) {
  const out = []
  for (const s of String(raw || '').split(',').map((x) => x.trim()).filter(Boolean)) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(s)
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return DEFAULT_SLOTS.slice()
    const v = `${m[1].padStart(2, '0')}:${m[2]}`
    if (!out.includes(v)) out.push(v)
  }
  if (!out.length || out.length > 6) return DEFAULT_SLOTS.slice()
  return out.sort()
}

/** "HH:MM" → normallaşdırılmış; yoxdur / yararsızdır → def. */
function parseHHMM(raw, def) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(raw || '').trim())
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return def
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

/** IG_CAPTION_LANGS: "az,en" (susmaya görə) — 1-ci əsas dil, 2-ci (istəyə bağlı) əlavə tərcümə; yalnız 5 dil, ən çox 2. */
function parseCaptionLangs(raw) {
  const list = [...new Set(String(raw == null || raw === '' ? 'az,en' : raw).split(',').map((x) => x.trim()).filter((x) => LANGS.includes(x)))]
  return list.length ? list.slice(0, 2) : ['az', 'en']
}

const DEFAULT_REEL_KINDS = ['ayah', 'hadith', 'dua']
/** IG_REEL_KINDS: "ayah,hadith,dua" (susmaya görə) → ['ayah', 'hadith', 'dua']; "name" — "dua"-nın sinonimi (20:00 yuvası). */
function parseReelKinds(raw) {
  if (raw == null || String(raw).trim() === '') return DEFAULT_REEL_KINDS.slice()
  const out = []
  for (const x of String(raw).split(',').map((v) => v.trim().toLowerCase()).filter(Boolean)) {
    const k = x === 'name' ? 'dua' : x
    if (['ayah', 'hadith', 'dua'].includes(k) && !out.includes(k)) out.push(k)
  }
  return out
}

function parseConfig(env = {}) {
  const token = String(env.IG_ACCESS_TOKEN || '').trim()
  const userId = String(env.IG_USER_ID || '').trim()
  const host = HOSTS.includes(String(env.IG_API_HOST || '').trim()) ? String(env.IG_API_HOST).trim() : HOSTS[0]
  const version = /^v\d{1,3}\.\d{1,2}$/.test(String(env.IG_API_VERSION || '')) ? env.IG_API_VERSION : DEFAULT_VERSION
  const lang = LANGS.includes(env.IG_LANG) ? env.IG_LANG : 'az'
  const slots = parseSlots(env.IG_SLOTS || DEFAULT_SLOTS.join(','))
  const stories = String(env.IG_STORIES == null ? '1' : env.IG_STORIES) !== '0'
  const captionLangs = parseCaptionLangs(env.IG_CAPTION_LANGS)
  // Reel (günün ayəsinin videosu, CI-da çəkilir — instagramReel.js): IG_REELS=1 ilə, IG_REEL_TIME (susmaya görə 18:00)
  const reels = env.IG_REELS === '1'
  const reelTime = REEL.parseReelTime(env.IG_REEL_TIME || REEL.DEFAULT_REEL_TIME)
  // Böyümə (docs/INSTAGRAM.md → "Böyümə"): alt_text (susmaya görə açıq), məkan (IG_LOCATION_ID — susmaya görə yox),
  // həftəlik karusel (IG_CAROUSEL=1, susmaya görə sönülü), insights (IG_INSIGHTS=0 ilə söndürülür)
  const altText = String(env.IG_ALT_TEXT == null ? '1' : env.IG_ALT_TEXT) !== '0'
  const locationId = USER_ID_RE.test(String(env.IG_LOCATION_ID || '').trim()) ? String(env.IG_LOCATION_ID).trim() : null
  const carousel = env.IG_CAROUSEL === '1'
  const carouselTime = parseHHMM(env.IG_CAROUSEL_TIME, DEFAULT_CAROUSEL_TIME)
  const cd = String(env.IG_CAROUSEL_DAY == null ? '' : env.IG_CAROUSEL_DAY).trim()
  const carouselDay = /^[0-6]$/.test(cd) ? Number(cd) : DEFAULT_CAROUSEL_DAY
  const insights = String(env.IG_INSIGHTS == null ? '1' : env.IG_INSIGHTS) !== '0'
  // Videolar (IG_REELS=1 olanda): IG_REEL_KINDS — "ayah" 18:00 ayə passajı reel-i, "hadith" 13:00 yuvasının feed postu
  // əvəzinə hədis videosu (reel), "dua" (və ya "name") 20:00 yuvasında dua / Allahın adı videosu. Susmaya görə hamısı;
  // "ayah" — köhnə davranış (yalnız passaj reel-i). Yuvanın MP4-ü yoxdursa / yararsızdırsa — adi şəkil postu.
  const reelKinds = parseReelKinds(env.IG_REEL_KINDS)
  // Ramazan geri sayımı story-si: susmaya görə açıq (IG_RAMADAN=0 söndürür); yalnız Ramazandan əvvəlki 90 gündə işləyir
  const ramadan = String(env.IG_RAMADAN == null ? '1' : env.IG_RAMADAN).trim() !== '0'
  const ramadanTime = parseHHMM(env.IG_RAMADAN_TIME, DEFAULT_RAMADAN_TIME)
  const configured = Boolean(token || userId)
  let reason = null
  if (env.IG_ENABLED !== '1') reason = 'disabled'
  else if (!token || !userId) reason = 'missing_credentials'
  else if (!TOKEN_RE.test(token) || !USER_ID_RE.test(userId)) reason = 'bad_format'
  return {
    enabled: !reason, reason, configured, token, userId, host, version, lang, slots, stories, captionLangs, reels, reelTime, reelKinds,
    altText, locationId, carousel, carouselTime, carouselDay, insights, ramadan, ramadanTime,
  }
}

// ── Vaxt ──
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}
/** Yuva → məzmun növü (3-cü yuva: tək gün ad, cüt gün dua). */
function kindFor(slotIndex, dateKey) {
  const k = SLOT_KINDS[slotIndex % SLOT_KINDS.length]
  if (k !== 'extra') return k
  return dailyAyah.dayNumber(dateKey) % 2 ? 'name' : 'dua'
}
/** Köhnə (saata görə) tema — geriyə uyğunluq; yuvalar indi themeForSlot işlədir. */
const themeFor = (hhmm) => { const h = Number(String(hhmm).slice(0, 2)); return h >= 18 || h < 5 ? 'night' : 'day' }
/** Yuvanın teması növünə görə (instagramReel.KIND_THEMES): ayə — dawn, hədis — day, dua / ad — night. */
const themeForSlot = (slotIndex, dateKey) => REEL.themeForKind(kindFor(slotIndex, dateKey))
/** Yuvanın video açarı (IG_REEL_KINDS): 0 → null (ayə şəkli həmişə şəkildir), 1 → 'hadith', 2 → 'dua'. */
const videoKeyForSlot = (slotIndex) => ({ hadith: 'hadith', extra: 'dua' })[SLOT_KINDS[slotIndex % SLOT_KINDS.length]] || null
function nextSlot(slots, now) {
  const t = nowAt(TZ, now)
  const cur = toMin(t.hhmm)
  const i = slots.findIndex((s) => toMin(s) > cur)
  if (i >= 0) return { date: t.dateKey, time: slots[i], index: i, kind: kindFor(i, t.dateKey) }
  const d = addDays(t.dateKey, 1)
  return { date: d, time: slots[0], index: 0, kind: kindFor(0, d) }
}

// ── Seçim: gün üzrə deterministik, sığmayanda sıradakı (rotIndex — instagramReel.js, reel renderi ilə ortaq) ──
const { rotIndex } = REEL
/** Hədis: "Səhih" yalnız Buxari / Müslim (telegramBot.js ilə eyni ifadə — gradeOf-un 1-ci qaydası). */
const isBukhariMuslim = (srcAz) => /^(Buxari|Muslim|Müslim)\b/.test(String(srcAz || '')) && !/Ədəb əl-Müfrəd/.test(String(srcAz || ''))
// Eyni elementin başqa dildə məzmunu (caption üçün) — yalnız saytın öz mətni, tərcümə edilmir
const withVariant = (c, variant) => (c ? Object.defineProperty(c, 'variant', { value: variant, enumerable: false }) : c)
const linkFor = (origin, lang, p) => `${origin}${lang === 'az' ? '' : `/${lang}`}${p}`

function hadithContent(lang, h, origin) {
  const ar = h.t && h.t.ar
  if (!ar) return null
  const text = lang === 'ar' ? '' : (h.t[lang] || '')
  if (lang !== 'ar' && !text) return null
  const src = h.src[lang] || h.src.en
  const sahih = isBukhariMuslim(h.src.az)
  return { kind: 'hadith', key: `hadith:${h.id}`, title: TITLES.hadith[lang], ar, text, ref: sahih ? `${src} · ${SAHIH[lang]}` : src, link: linkFor(origin, lang, `/hadith/${h.id}`) }
}
function duaContent(lang, d, origin) {
  const text = lang === 'ar' ? '' : (d.t[lang] || '')
  if (lang !== 'ar' && !text) return null
  const src = d.src[lang] || d.src.en
  return { kind: 'dua', key: `dua:${d.id}`, title: TITLES.dua[lang], ar: d.ar, text, ref: d.sahih ? `${src} · ${SAHIH[lang]}` : src, link: linkFor(origin, lang, '/duas') }
}
function nameContent(lang, n, origin) {
  const text = lang === 'ar' ? '' : (n.m[lang] || '')
  if (lang !== 'ar' && !text) return null
  return { kind: 'name', key: `name:${n.n}`, title: TITLES.name[lang], ar: n.ar, tl: lang === 'ar' ? '' : n.tl, text, ref: `${PROOF[lang]}: ${n.proof[lang] || n.proof.en}`, link: linkFor(origin, lang, `/names/${n.n}-${n.slug}`) }
}
function ayahContent(lang, pick, data, origin) {
  const ar = data.texts.ar
  const text = lang === 'ar' ? '' : data.texts[lang]
  if (!ar || (lang !== 'ar' && !text)) return null
  const num = `${pick.s}:${pick.a}${pick.to && pick.to !== pick.a ? `-${pick.to}` : ''}`
  return { kind: 'ayah', key: `ayah:${pick.ref}`, title: TITLES.ayah[lang], ar, text, ref: `${dailyAyah.surahLabel(lang, pick.s, data.names)} ${num}`, link: linkFor(origin, lang, dailyAyah.ayahLink('az', pick)) }
}

// ── Hədis / dua / ad seçimi (şəbəkəsiz): yuvanın k-cı namizədi. Reel renderi (scripts/ig-reel/render.mjs) də bunu işlədir —
//    video həmin günün kartı ilə eyni elementi göstərsin. ──
function staticCandidate(kind, dateKey, k, lang, origin = 'https://muslims.cc') {
  if (kind === 'hadith') {
    const list = dailyHadith.LIST
    if (!list.length) return null
    const h = list[rotIndex(dateKey, list.length, 389, k)]
    return withVariant(hadithContent(lang, h, origin), (L) => hadithContent(L, h, origin))
  }
  // dua / ad: hər 2 gündən biri — gün nömrəsinin yarısı ilə sırala
  const half = addDays('1970-01-01', Math.floor(dailyAyah.dayNumber(dateKey) / 2))
  if (kind === 'dua' && IG_DATA.duas.length) {
    const d = IG_DATA.duas[rotIndex(half, IG_DATA.duas.length, 31, k)]
    return withVariant(duaContent(lang, d, origin), (L) => duaContent(L, d, origin))
  }
  if (kind === 'name' && IG_DATA.names.length) {
    const n = IG_DATA.names[(Math.floor(dailyAyah.dayNumber(dateKey) / 2) + k) % IG_DATA.names.length]
    return withVariant(nameContent(lang, n, origin), (L) => nameContent(L, n, origin))
  }
  return null
}
/** Video sidecar-ındakı element (növ + id) → məzmun | null (id saytın məlumatında yoxdur). */
function contentById(kind, id, lang, origin = 'https://muslims.cc') {
  const n = Number(id)
  if (kind === 'hadith') { const h = dailyHadith.LIST.find((x) => x.id === n); return h ? withVariant(hadithContent(lang, h, origin), (L) => hadithContent(L, h, origin)) : null }
  if (kind === 'dua') { const d = IG_DATA.duas.find((x) => x.id === n); return d ? withVariant(duaContent(lang, d, origin), (L) => duaContent(L, d, origin)) : null }
  if (kind === 'name') { const x = IG_DATA.names.find((v) => v.n === n); return x ? withVariant(nameContent(lang, x, origin), (L) => nameContent(L, x, origin)) : null }
  return null
}
/** content.key ('hadith:12') → id (12) | null. */
const itemIdOf = (key) => { const m = /^(?:hadith|dua|name):(\d{1,4})$/.exec(String(key || '')); return m ? Number(m[1]) : null }

// ── Heşteqlər: #muslimscc + əsas dilin lövbəri + növbələşən + 2-ci dilin lövbəri + ərəbcə (və ya ingiliscə) — ≤ 5 ──
const tagPool = (L, kind) => { const p = HASHTAGS[L] || HASHTAGS.az; return p[kind] || p.ayah }
/** Siyahının lövbərdən sonrakı hissəsindən seed-ə görə n element (növbə ilə). */
function rotate(list, n, seed) {
  const rest = list.slice(1)
  const out = []
  for (let i = 0; i < Math.min(n, rest.length); i++) out.push(rest[(seed + i) % rest.length])
  return out
}
/**
 * hashtagsFor(kind, langs, day) → ['#muslimscc', …] (≤ HASHTAG_MAX, təkrarsız). Eyni gün — eyni nəticə (deterministik),
 * gündən günə növbələşir. kind: ayah | hadith | dua | name | reel.
 */
function hashtagsFor(kind, langs = ['az'], day = null) {
  const seed = day && DATE_RE.test(String(day)) ? Math.abs(dailyAyah.dayNumber(day)) : 0
  const L1 = LANGS.includes(langs[0]) ? langs[0] : 'az'
  const L2 = langs[1] && langs[1] !== L1 && LANGS.includes(langs[1]) ? langs[1] : null
  const p1 = tagPool(L1, kind)
  const mix = tagPool(L1 === 'ar' || L2 === 'ar' ? 'en' : 'ar', kind)
  const out = ['#muslimscc']
  const add = (t) => { if (t && !out.includes(t) && out.length < HASHTAG_MAX) { out.push(t); return true } return false }
  add(p1[0])
  if (L2) add(tagPool(L2, kind)[0])
  const rot = rotate(p1, p1.length, seed)
  let want = L2 ? 1 : 2
  for (const t of rot) { if (want <= 0) break; if (add(t)) want-- }
  for (let i = 0; i < mix.length; i++) if (add(mix[(seed + i) % mix.length])) break
  for (const t of rot) add(t)
  return out
}

/** 1-ci sətir (Instagram axtarışı caption-u indeksləyir): "Günün ayəsi: Əhzab 33:3 | Verse of the Day". */
function firstLine(p, s = null) {
  const key = p.kind === 'name' ? (p.tl || '') : (p.ref || '')
  let line = key ? `${p.title}: ${key}` : p.title
  if (s && s.title && s.title !== p.title) line += ` | ${s.title}`
  return line.length <= FIRST_LINE_MAX ? line : p.title
}

/** alt_text: "Günün ayəsi: Əhzab 33:3 — ərəb mətni və tərcüməsi" (kartın dilində; dini mətn deyil — təsvirdir). */
function altTextFor(c, lang) {
  if (!c) return ''
  const L = LANGS.includes(lang) ? lang : 'az'
  const out = c.kind === 'name'
    ? `${c.title}: ${c.tl || c.ar} — ${ALT_DESC.name[L]}`
    : `${c.title}: ${c.ref} — ${ALT_DESC.text[L]}`
  return out.replace(/\s+/g, ' ').trim().slice(0, ALT_MAX)
}

// ── Caption (mətn + mənbə + keçid + bir neçə heşteq; reytinq / riya dili yoxdur) ──
// opts.day — heşteq növbəsi üçün tarix; opts.tagKind — heşteq hovuzu (susmaya görə c.kind; reel üçün 'reel')
function buildCaption(c, lang, { withArabic = true, day = null, tagKind = null } = {}) {
  const L = LANGS.includes(lang) ? lang : 'az'
  const tags = hashtagsFor(tagKind || c.kind, [L], day)
  const parts = [firstLine(c)]
  if (c.kind === 'name') parts.push([c.ar, c.tl, c.text].filter(Boolean).join('\n'))
  else {
    if (withArabic || !c.text) parts.push(c.ar)
    if (c.text) parts.push(c.text)
  }
  parts.push(`— ${c.ref}`)
  parts.push(`${READ_MORE[L]}: ${c.link}`)
  parts.push(tags.join(' '))
  const out = parts.filter(Boolean).join('\n\n')
  if (out.length <= CAPTION_MAX) return out
  return withArabic && c.text && c.kind !== 'name' ? buildCaption(c, lang, { withArabic: false, day, tagKind }) : null
}

/**
 * İkidilli caption (IG_CAPTION_LANGS, məs. az,en): başlıq + ərəbcə + əsas dilin tərcüməsi + "—" + 2-ci dilin tərcüməsi
 * (hər ikisi saytın öz mətni, eyni element), sonra əsas dilin mənbəsi, keçidi, heşteqlər (≤ 6, 2-ci dildən 2 əlavə).
 * 2-ci dildə mətn yoxdursa və ya 2200 simvolu keçirsə — yalnız əsas dil (buildCaption). Heç vaxt tərcümə edilmir.
 * content.variant(L) — eyni elementin L dilində məzmunu (instagram.js → candidate); yoxdursa content özü işlədilir.
 */
function buildCaptionMulti(content, langs = ['az', 'en'], { day = null, tagKind = null } = {}) {
  const [L1, L2] = langs
  const variant = typeof content.variant === 'function' ? content.variant : null
  const p = (variant && variant(L1)) || content
  const lang1 = variant && variant(L1) ? L1 : (LANGS.includes(L1) ? L1 : 'az')
  const s = L2 && L2 !== lang1 && variant ? variant(L2) : null
  const mono = () => buildCaption(p, lang1, { day, tagKind })
  if (!s || !s.text || !p.text) return mono()
  const tags = hashtagsFor(tagKind || p.kind, [lang1, L2], day)
  const head = p.kind === 'name' ? [p.ar, p.tl].filter(Boolean).join('\n') : p.ar
  const out = [firstLine(p, s), head, `${p.text}\n—\n${s.text}`, `— ${p.ref}`, `${READ_MORE[lang1]}: ${p.link}`, tags.join(' ')].filter(Boolean).join('\n\n')
  return out.length <= CAPTION_MAX ? out : mono()
}

/**
 * Karusel caption-u: 1-ci sətir (açar sözlər), elementlərin siyahısı (yalnız istinad / ad — mətnlər kartlardadır), keçid,
 * heşteqlər. items — əsas dildəki məzmun; second — 2-ci dil (başlıq üçün, istəyə bağlı). 2200-ü keçirsə null.
 */
function buildCarouselCaption(theme, items, langs = ['az', 'en'], { day = null, origin = 'https://muslims.cc' } = {}) {
  const L1 = LANGS.includes(langs[0]) ? langs[0] : 'az'
  const L2 = langs[1] && langs[1] !== L1 && LANGS.includes(langs[1]) ? langs[1] : null
  const t1 = CAROUSEL_TITLE[theme][L1]
  const head = `${WEEKLY[L1]} — ${t1}${L2 ? ` | ${CAROUSEL_TITLE[theme][L2]}` : ''}`
  const list = items.map((c, i) => {
    if (theme === 'name') return `${i + 1}. ${[c.tl, c.ar].filter(Boolean).join(' · ')}${c.text ? ` — ${c.text}` : ''}`
    return `${i + 1}. ${c.ref}`
  }).join('\n')
  const out = [head, list, `${READ_MORE[L1]}: ${linkFor(origin, L1, CAROUSEL_LINK[theme])}`, hashtagsFor(theme, L2 ? [L1, L2] : [L1], day).join(' ')].join('\n\n')
  return out.length <= CAPTION_MAX ? out : null
}

// ── Graph API xətalarının növü ──
function classifyError(err, status) {
  const code = Number(err && err.code), sub = Number(err && err.error_subcode)
  if (code === 190 || code === 102 || code === 10 || (code >= 200 && code <= 299) || status === 401) return 'auth'
  if (code === 9 && sub === 2207042) return 'limit'                                   // 24 saatlıq dərc limiti
  if ([4, 17, 32, 613, 80002].includes(code) || status === 429) return 'rate'
  if (code === 2 || code === 1 || status >= 500 || !status) return 'transient'
  if (sub >= 2207000 && sub < 2208000) return 'media'                               // şəkli çəkə bilmədi və s.
  return 'fatal'
}
/** Graph-dan kənar xəta (məs. ayə mənbəyi əlçatmazdır) — eyni "kind" sahəsi ilə. */
const failure = (kind, msg) => Object.assign(new Error(msg), { kind })
class GraphError extends Error {
  constructor(kind, status, code, sub) {
    super(`instagram graph ${kind} (status ${status || '-'}, code ${code || '-'}${sub ? `/${sub}` : ''})`)
    this.kind = kind; this.status = status; this.code = code; this.sub = sub
  }
}

// ── Token qeydi (AES-256-GCM, açar env tokenindən) ──
function tokenKey(envToken) { return crypto.createHash('sha256').update('mcc-ig-token-v1|' + envToken).digest() }
function sealToken(envToken, obj) {
  const iv = crypto.randomBytes(12)
  const c = crypto.createCipheriv('aes-256-gcm', tokenKey(envToken), iv)
  const ct = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url')
}
function openToken(envToken, sealed) {
  try {
    const b = Buffer.from(String(sealed || ''), 'base64url')
    if (b.length < 29) return null
    const d = crypto.createDecipheriv('aes-256-gcm', tokenKey(envToken), b.subarray(0, 12))
    d.setAuthTag(b.subarray(12, 28))
    const o = JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'))
    return o && typeof o.t === 'string' && TOKEN_RE.test(o.t) ? o : null
  } catch { return null }
}

/**
 * opts: { db, env?, publicOrigin?, cardDir?, fetchImpl?, now?, sleep?, log?, render?, pollMs?, pollTries? }
 *   render(content, { format, theme, lang }) → Promise<Buffer|null>  (susmaya görə instagramCard.renderCard)
 */
function createInstagram(opts = {}) {
  const {
    db, env = process.env, publicOrigin = 'https://muslims.cc', fetchImpl = (...a) => fetch(...a), now = () => Date.now(),
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)), log = console, pollMs = 4000, pollTries = 20,
  } = opts
  const cfg = parseConfig(env)
  const origin = String(publicOrigin || 'https://muslims.cc').replace(/\/+$/, '')
  const cardDir = opts.cardDir || path.join(path.dirname(path.resolve(env.DB_PATH || '/data/muslims.db')), 'ig-cards')
  const render = opts.render || ((c, o) => require('./instagramCard').renderCard(c, o))
  const checkArabic = opts.checkArabic || ((c) => require('./instagramCard').contentIssues(c))
  const skipped = new Set()
  const skipLog = (key, issues) => {
    if (skipped.has(key)) return
    skipped.add(key)
    log.warn(`Instagram: ${key} atlandı — ərəb mətni kartda düzgün çəkilmir (${issues.join(', ')})`)
  }
  if (cfg.configured && !cfg.enabled) log.warn(`Instagram: avtoposter sönülüdür (${cfg.reason})`)

  const raw = db.raw || db
  raw.exec(`CREATE TABLE IF NOT EXISTS instagram_posts (
    id INTEGER PRIMARY KEY,
    day TEXT NOT NULL,
    slot TEXT NOT NULL,
    format TEXT NOT NULL,
    kind TEXT NOT NULL,
    item TEXT,
    ig_media_id TEXT,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    next_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE (day, slot, format)
  )`)
  raw.exec('CREATE TABLE IF NOT EXISTS instagram_state (k TEXT PRIMARY KEY, v TEXT NOT NULL, at INTEGER NOT NULL) WITHOUT ROWID')
  // Öz postlarımızın statistikası (Graph API insights) — istifadəçi məlumatı yoxdur; 180 gündən köhnələr silinir
  raw.exec(`CREATE TABLE IF NOT EXISTS instagram_insights (
    ig_media_id TEXT PRIMARY KEY,
    day TEXT NOT NULL,
    slot TEXT NOT NULL,
    format TEXT NOT NULL,
    kind TEXT NOT NULL,
    reach INTEGER,
    saved INTEGER,
    shares INTEGER,
    likes INTEGER,
    comments INTEGER,
    views INTEGER,
    fetched_at INTEGER NOT NULL
  ) WITHOUT ROWID`)
  const q = {
    claim: raw.prepare(`INSERT OR IGNORE INTO instagram_posts (day, slot, format, kind, status, attempts, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'claimed', 1, ?, ?)`),
    get: raw.prepare('SELECT * FROM instagram_posts WHERE day = ? AND slot = ? AND format = ?'),
    retake: raw.prepare(`UPDATE instagram_posts SET status = 'claimed', attempts = attempts + 1, updated_at = ?
      WHERE id = ? AND ((status = 'retry' AND next_at <= ?) OR (status = 'claimed' AND updated_at < ?)) AND attempts < ?`),
    done: raw.prepare(`UPDATE instagram_posts SET status = 'published', ig_media_id = ?, item = ?, error = NULL, next_at = NULL, updated_at = ? WHERE id = ?`),
    fail: raw.prepare('UPDATE instagram_posts SET status = ?, error = ?, item = COALESCE(?, item), next_at = ?, updated_at = ? WHERE id = ?'),
    recent: raw.prepare('SELECT day, slot, format, kind, item, ig_media_id, status, attempts, error, created_at, updated_at FROM instagram_posts ORDER BY id DESC LIMIT ?'),
    purge: raw.prepare('DELETE FROM instagram_posts WHERE created_at < ?'),
    stGet: raw.prepare('SELECT v, at FROM instagram_state WHERE k = ?'),
    stSet: raw.prepare('INSERT INTO instagram_state (k, v, at) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v, at = excluded.at'),
    stClaim: raw.prepare('INSERT OR IGNORE INTO instagram_state (k, v, at) VALUES (?, ?, ?)'),
    insTargets: raw.prepare(`SELECT ig_media_id, day, slot, format, kind FROM instagram_posts
      WHERE status = 'published' AND ig_media_id IS NOT NULL AND format IN ('feed', 'reel', 'carousel') AND day >= ? AND updated_at < ?
      ORDER BY id DESC LIMIT ?`),
    insSet: raw.prepare(`INSERT INTO instagram_insights (ig_media_id, day, slot, format, kind, reach, saved, shares, likes, comments, views, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(ig_media_id) DO UPDATE SET reach = excluded.reach, saved = excluded.saved,
      shares = excluded.shares, likes = excluded.likes, comments = excluded.comments, views = excluded.views, fetched_at = excluded.fetched_at`),
    insByKind: raw.prepare(`SELECT kind, format, COUNT(*) AS posts, ROUND(AVG(reach)) AS reach, ROUND(AVG(saved), 1) AS saved, ROUND(AVG(shares), 1) AS shares
      FROM instagram_insights WHERE day >= ? GROUP BY kind, format ORDER BY reach DESC`),
    insBySlot: raw.prepare(`SELECT slot, COUNT(*) AS posts, ROUND(AVG(reach)) AS reach, ROUND(AVG(saved), 1) AS saved, ROUND(AVG(shares), 1) AS shares
      FROM instagram_insights WHERE day >= ? AND format = 'feed' GROUP BY slot ORDER BY reach DESC`),
    insPurge: raw.prepare('DELETE FROM instagram_insights WHERE fetched_at < ?'),
  }

  let authBlocked = false
  let authLogged = false
  const blockAuth = (where) => {
    authBlocked = true
    if (!authLogged) { authLogged = true; log.error(`Instagram: avtorizasiya xətası (${where}) — avtoposter dayandı. Yeni token → api.env, sonra restart (docs/INSTAGRAM.md)`) }
  }

  // ── Token ──
  function tokenRecord() {
    if (!cfg.token) return null
    const r = q.stGet.get('token')
    return r ? openToken(cfg.token, r.v) : null
  }
  const currentToken = () => { const r = tokenRecord(); return r ? r.t : cfg.token }

  // ── Graph API (token yalnız Authorization başlığında; URL və token loglanmır) ──
  async function graph(method, pathname, params = {}, { token = currentToken(), host = cfg.host, versioned = true } = {}) {
    const url = new URL(`https://${host}${versioned ? `/${cfg.version}` : ''}${pathname}`)
    const headers = { Authorization: `Bearer ${token}` }
    let body
    if (method === 'GET') for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
    else { body = new URLSearchParams(params).toString(); headers['Content-Type'] = 'application/x-www-form-urlencoded' }
    let r, j
    try {
      r = await fetchImpl(url.toString(), { method, headers, body, signal: AbortSignal.timeout(30000) })
      j = await r.json().catch(() => null)
    } catch (e) {
      throw new GraphError('transient', 0, 0, 0)
    }
    if (r.ok && j && !j.error) return j
    const e = (j && j.error) || {}
    throw new GraphError(classifyError(e, r.status), r.status, Number(e.code) || 0, Number(e.error_subcode) || 0)
  }

  const imageDelays = () => Array.from({ length: pollTries }, () => pollMs)

  /** Feed şəkli: + alt_text (IG_ALT_TEXT), + location_id (IG_LOCATION_ID). Story: yalnız şəkil (Meta: caption / alt / məkan yoxdur). */
  async function publishImage(imageUrl, { story = false, caption = '', altText = '' } = {}) {
    const params = story ? { image_url: imageUrl, media_type: 'STORIES' } : { image_url: imageUrl, caption }
    return publishContainer(params, imageDelays(), story ? {} : optionalParams({ altText }))
  }

  /** Reel: media_type=REELS + video_url; video emalı uzundur — ~5 dəq artan fasilə ilə yoxlanır (REEL_POLL_SEC). */
  async function publishReel(videoUrl, { caption, thumbOffsetMs = null } = {}) {
    const params = { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true' }
    if (Number.isInteger(thumbOffsetMs) && thumbOffsetMs >= 0) params.thumb_offset = String(thumbOffsetMs)
    return publishContainer(params, (opts.reelPollMs || REEL.REEL_POLL_SEC.map((s) => s * 1000)), optionalParams({}))
  }

  /**
   * Karusel (Meta Content Publishing): hər şəkil üçün uşaq konteyner (is_carousel_item=true [+ alt_text]) → hamısı FINISHED →
   * ana konteyner media_type=CAROUSEL, children=<id,id,…>, caption [+ location_id] → FINISHED → media_publish.
   */
  async function publishCarousel(urls, { caption, alts = [] } = {}) {
    if (!Array.isArray(urls) || urls.length < 2 || urls.length > 10) throw failure('fatal', 'carousel needs 2-10 items')
    const children = []
    for (let i = 0; i < urls.length; i++) {
      children.push(await createContainer({ image_url: urls[i], is_carousel_item: 'true' }, optionalParams({ altText: alts[i] || '', location: false })))
    }
    for (const cid of children) await waitReady(cid, imageDelays())
    const parent = await createContainer({ media_type: 'CAROUSEL', children: children.join(','), caption }, optionalParams({}))
    await waitReady(parent, imageDelays())
    return publishCreation(parent)
  }

  // ── İstəyə bağlı parametrlər (alt_text, location_id): Meta onları rədd etsə (kod 100, alt kod yoxdur) bu proses daxilində
  //    həmin parametr olmadan təkrar göndərilir və bir dəfə loglanır — dərc heç vaxt bunlara görə dayanmır. ──
  const dropped = new Set()
  function optionalParams({ altText = '', location = true } = {}) {
    const o = {}
    if (cfg.altText && altText && !dropped.has('alt_text')) o.alt_text = String(altText).slice(0, ALT_MAX)
    if (location && cfg.locationId && !dropped.has('location_id')) o.location_id = cfg.locationId
    return o
  }
  async function createContainer(params, optional = {}) {
    // Sıra: hamısı → məkansız → heç biri (məkan ən çox rədd olunan parametrdir)
    const order = ['location_id', 'alt_text'].filter((k) => k in optional)
    let extra = { ...optional }
    for (let i = 0; ; i++) {
      try {
        const c = await graph('POST', `/${cfg.userId}/media`, { ...params, ...extra })
        const cid = String((c && c.id) || '')
        if (!/^\d{1,40}$/.test(cid)) throw new GraphError('fatal', 200, 0, 0)
        return cid
      } catch (e) {
        const k = order[i]
        if (!k || !(e instanceof GraphError) || e.kind !== 'fatal' || e.code !== 100 || e.sub) throw e
        if (!dropped.has(k)) { dropped.add(k); log.warn(`Instagram: Meta "${k}" parametrini qəbul etmədi — bu proses onsuz dərc edir (docs/INSTAGRAM.md → Böyümə)`) }
        extra = { ...extra }
        delete extra[k]
      }
    }
  }
  async function waitReady(cid, delays) {
    for (let i = 0; i < delays.length; i++) {
      const s = await graph('GET', `/${cid}`, { fields: 'status_code' })
      const st = s && s.status_code
      if (st === 'FINISHED') return
      if (st === 'ERROR' || st === 'EXPIRED') throw new GraphError('media', 200, 0, 0)
      if (st === 'PUBLISHED') throw new GraphError('fatal', 200, 0, 0)
      await sleep(delays[i])
    }
    throw new GraphError('transient', 200, 0, 0)
  }
  async function publishCreation(cid) {
    const p = await graph('POST', `/${cfg.userId}/media_publish`, { creation_id: cid })
    const mid = String((p && p.id) || '')
    if (!/^\d{1,40}$/.test(mid)) throw new GraphError('fatal', 200, 0, 0)
    return mid
  }

  /** Konteyner → status_code FINISHED (hər yoxlamadan sonra delays[i] ms fasilə) → media_publish → media id. */
  async function publishContainer(params, delays, optional = {}) {
    const cid = await createContainer(params, optional)
    await waitReady(cid, delays)
    return publishCreation(cid)
  }

  // ── Məzmun ──
  const ayahCache = new Map()   // ref → { data, at } | { failedAt }
  async function ayahData(pick) {
    const c = ayahCache.get(pick.ref)
    if (c && c.data) return c.data
    if (c && c.failedAt && now() - c.failedAt < 2 * 60e3) return null
    const parts = []
    for (let a = pick.a; a <= pick.to; a++) {
      try {
        const r = await fetchImpl(dailyAyah.ayahApiUrl(pick.s, a), { signal: AbortSignal.timeout(15000) })
        parts.push(r.ok ? dailyAyah.parseAyahResponse(await r.json(), pick.s, a) : null)
      } catch { parts.push(null) }
    }
    const data = dailyAyah.mergeAyahParts(parts)
    ayahCache.set(pick.ref, data ? { data, at: now() } : { failedAt: now() })
    if (ayahCache.size > 50) for (const [k, v] of ayahCache) if (now() - (v.at || v.failedAt) > 2 * 864e5) ayahCache.delete(k)
    return data
  }

  /** k-cı namizəd (0 — günün öz elementi). null — bu namizəd yararsızdır; throw — şəbəkə (ayə). */

  async function candidate(kind, dateKey, k, lang) {
    if (kind === 'ayah') {
      const refs = dailyAyah.AYAH_REFS
      const ref = refs[rotIndex(dateKey, refs.length, 37, k)]
      const pick = { ...dailyAyah.parseRef(ref), ref }
      const data = await ayahData(pick)
      if (!data) throw failure('transient', 'ayah source unavailable')
      return withVariant(ayahContent(lang, pick, data, origin), (L) => ayahContent(L, pick, data, origin))
    }
    return staticCandidate(kind, dateKey, k, lang, origin)
  }

  /** Yuvanın məzmunu + kartları (feed və story EYNİ elementdir). → { content, caption, cards: { feed, story } } | null */
  async function prepare(dateKey, slotIndex, { formats = ['feed', 'story'], lang = cfg.lang } = {}) {
    const kind = kindFor(slotIndex, dateKey)
    const theme = themeForSlot(slotIndex, dateKey)
    for (let k = 0; k < MAX_PICK_TRIES; k++) {
      const content = await candidate(kind, dateKey, k, lang)
      if (!content) continue
      // Ərəb mətni şriftlə düzgün çəkilə bilmirsə (qlif yoxdur / yetim hərəkə) — atlanır, mətn dəyişdirilmir
      const issues = checkArabic(content)
      if (issues.length) { skipLog(content.key, issues); continue }
      const caption = buildCaptionMulti(content, cfg.captionLangs, { day: dateKey })
      if (!caption) continue
      const cards = {}
      let ok = true
      for (const f of formats) {
        cards[f] = await render(content, { format: f, theme, lang })
        if (!cards[f]) { ok = false; break }
      }
      if (ok) return { content, caption, cards }
    }
    return null
  }

  // ── Kart faylları ──
  const cardName = (dateKey, slotIndex, format) => `${dateKey}-${slotIndex}-${format}.jpg`
  function writeCard(name, buf) {
    if (!CARD_NAME_RE.test(name) && !CAROUSEL_NAME_RE.test(name) && !RAMADAN_NAME_RE.test(name)) throw new Error('bad card name')
    fs.mkdirSync(cardDir, { recursive: true, mode: 0o700 })
    const tmp = path.join(cardDir, `.${name}.${process.pid}.tmp`)
    fs.writeFileSync(tmp, buf, { mode: 0o644 })
    fs.renameSync(tmp, path.join(cardDir, name))
  }
  function purgeCards(t = now()) {
    let n = 0
    let list = []
    try { list = fs.readdirSync(cardDir) } catch { return 0 }
    for (const f of list) {
      const m = CARD_NAME_RE.exec(f) || CAROUSEL_NAME_RE.exec(f) || RAMADAN_NAME_RE.exec(f) || REEL.VIDEO_MP4_RE.exec(f) || REEL.VIDEO_META_RE.exec(f)
      const p = path.join(cardDir, f)
      try {
        const old = m ? Date.parse(`${m[1]}T00:00:00Z`) < t - CARD_TTL_MS : (f.endsWith('.tmp') && fs.statSync(p).mtimeMs < t - 3600e3)
        if (old) { fs.unlinkSync(p); n++ }
      } catch { /* */ }
    }
    return n
  }

  // ── Bir yuvanın dərci (feed + story) ──
  const prepared = new Map()   // `${day}|${slotKey}` → prepare() nəticəsi (bu proses daxilində)
  async function runFormat(row, dateKey, slotIndex, slotKey, format) {
    const pk = `${dateKey}|${slotKey}`
    try {
      let prep = prepared.get(pk)
      if (!prep) {
        prep = await prepare(dateKey, slotIndex, { formats: cfg.stories ? ['feed', 'story'] : ['feed'] })
        if (!prep) throw failure('fatal', 'no fitting item')
        prepared.set(pk, prep)
        for (const k of prepared.keys()) if (!k.startsWith(dateKey + '|')) prepared.delete(k)
      }
      // 13:00 / 20:00 yuvası: feed postu əvəzinə yuvanın videosu (reel, share_to_feed) — fayl varsa; story həmişə şəkildir
      const video = format === 'feed' ? slotVideo(dateKey, slotIndex) : null
      if (video) {
        if (video.content.key !== prep.content.key) log.warn(`Instagram: ${dateKey} ${slotKey} videosu ${video.content.key}, kart ${prep.content.key} (video renderi başqa element seçib)`)
        const mid = await publishReel(`${origin}/api/ig/card/${video.file}`, { caption: video.caption, thumbOffsetMs: Math.max(0, video.info.durationMs - 1000) })
        q.done.run(mid, `video:${video.content.key}`, now(), row.id)
        log.log(`Instagram: ${format} (video) dərc olundu — ${dateKey} ${slotKey} ${video.content.key}`)
        return true
      }
      const name = cardName(dateKey, slotIndex, format)
      writeCard(name, prep.cards[format])
      const url = `${origin}/api/ig/card/${name}`
      const mid = await publishImage(url, { story: format === 'story', caption: prep.caption, altText: altTextFor(prep.content, cfg.lang) })
      q.done.run(mid, prep.content.key, now(), row.id)
      log.log(`Instagram: ${format} dərc olundu — ${dateKey} ${slotKey} ${prep.content.key}`)
      return true
    } catch (e) {
      return recordFailure(row, e, format, dateKey, slotKey)
    }
  }

  /** Xəta → sətir "retry" (fasilə ilə) və ya "failed"; avtorizasiya xətası planlayıcını dayandırır. Həmişə false. */
  function recordFailure(row, e, format, dateKey, slotKey) {
    const kind = (e && e.kind) || 'transient'
    if (!(e && e.kind)) log.error('Instagram:', e && e.message)
    const attempts = Number(row.attempts) || 1
    if (kind === 'auth') blockAuth(format)
    const retry = (kind === 'transient' || kind === 'rate' || kind === 'media') && attempts < MAX_ATTEMPTS
    const nextAt = retry ? now() + BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)] * 60e3 : null
    q.fail.run(retry ? 'retry' : 'failed', String(e && e.message || kind).slice(0, 200), null, nextAt, now(), row.id)
    if (kind !== 'auth') log.warn(`Instagram: ${format} ${dateKey} ${slotKey} — ${kind}${retry ? `, təkrar ${Math.round((nextAt - now()) / 60e3)} dəq sonra` : ', dayandı'}`)
    return false
  }

  // ── Yuvanın videosu (hədis / dua / ad; CI çəkir — <tarix>-reel-<növ>.mp4 + .json) ──
  /** → { size, kind, item, audio, lang, durationMs } | null — fayl yoxdur, ölçüsü / sidecar / MP4 başlığı yararsızdır. */
  function textVideoInfo(dateKey, kind) {
    if (!DATE_RE.test(String(dateKey || '')) || !REEL.TEXT_KINDS.includes(kind)) return null
    const base = path.join(cardDir, REEL.videoBase(dateKey, kind))
    let st, meta, head
    try { st = fs.statSync(`${base}.mp4`) } catch { return null }
    if (!st.isFile() || st.size < 1024 || st.size > REEL.REEL_MAX_BYTES) return null
    try { meta = REEL.parseTextMeta(fs.readFileSync(`${base}.json`, 'utf8'), kind) } catch { return null }
    if (!meta) return null
    try {
      const fd = fs.openSync(`${base}.mp4`, 'r')
      try { head = Buffer.alloc(Math.min(st.size, 512 * 1024)); fs.readSync(fd, head, 0, head.length, 0) } finally { fs.closeSync(fd) }
    } catch { return null }
    const durationMs = REEL.mp4DurationMs(head)
    if (!durationMs || durationMs < 3000 || durationMs > 90e3) return null
    return { size: st.size, kind, item: meta.item, audio: meta.audio, lang: meta.lang, durationMs }
  }
  /** Yuva üçün video açıqdırmı (IG_REELS=1 + IG_REEL_KINDS)? */
  const slotVideoOn = (slotIndex) => { const vk = videoKeyForSlot(slotIndex); return Boolean(cfg.reels && vk && cfg.reelKinds.includes(vk)) }
  const videoMissing = new Set()
  /**
   * Yuvanın videosu → { file, info, content, caption } | null (söndürülüb; fayl yoxdur / yararsızdır → şəkil postu, bir dəfə loglanır).
   * Caption — videodakı elementin (sidecar item) adi caption-u (IG_CAPTION_LANGS).
   */
  function slotVideo(dateKey, slotIndex) {
    if (!slotVideoOn(slotIndex)) return null
    const kind = kindFor(slotIndex, dateKey)
    const info = textVideoInfo(dateKey, kind)
    const content = info ? contentById(kind, info.item, cfg.lang, origin) : null
    const caption = content ? buildCaptionMulti(content, cfg.captionLangs, { day: dateKey, tagKind: kind }) : null
    if (!info || !content || !caption) {
      const k = `${dateKey}|${kind}`
      if (!videoMissing.has(k)) {
        if (videoMissing.size > 20) videoMissing.clear()
        videoMissing.add(k)
        log.warn(`Instagram: ${dateKey} ${kind} videosu yoxdur və ya yararsızdır — şəkil postu (.github/workflows/ig-reel.yml)`)
      }
      return null
    }
    return { file: `${REEL.videoBase(dateKey, kind)}.mp4`, info, content, caption }
  }

  // ── Reel: günün ayəsinin videosu (instagramReel.js). MP4 serverdə ÇƏKİLMİR — CI (.github/workflows/ig-reel.yml)
  //    hazırlayır, ci-gate.sh "ig-reel" onu <cardDir>/<tarix>-reel.mp4 + <tarix>-reel.json kimi yazır. ──
  const reelPath = (dateKey, ext) => path.join(cardDir, `${dateKey}-reel.${ext}`)
  /** → { size, ref, audio, durationMs } | null (fayl yoxdur, ölçüsü / meta / MP4 başlığı yararsızdır) */
  function reelInfo(dateKey) {
    if (!DATE_RE.test(String(dateKey || ''))) return null
    let st, meta, head
    try { st = fs.statSync(reelPath(dateKey, 'mp4')) } catch { return null }
    if (!st.isFile() || st.size < 1024 || st.size > REEL.REEL_MAX_BYTES) return null
    try { meta = REEL.parseMeta(fs.readFileSync(reelPath(dateKey, 'json'), 'utf8')) } catch { return null }
    if (!meta) return null
    try {
      const fd = fs.openSync(reelPath(dateKey, 'mp4'), 'r')
      try { head = Buffer.alloc(Math.min(st.size, 512 * 1024)); fs.readSync(fd, head, 0, head.length, 0) } finally { fs.closeSync(fd) }
    } catch { return null }
    // faststart: moov faylın əvvəlindədir (Meta-nın tələbi) — müddət oxunmursa fayl yararsız sayılır
    const durationMs = REEL.mp4DurationMs(head)
    if (!durationMs || durationMs < 3000 || durationMs > 90e3) return null
    return { size: st.size, ref: meta.ref, audio: meta.audio, lang: meta.lang, durationMs }
  }

  /**
   * Reel caption-u: IG_CAPTION_LANGS dillərində (instagram.js-in adi caption-u + tilavət sətri). Passaj uzundursa
   * (ərəbcə + tərcümə 2200-ü keçir) — mətnsiz qısa variant (başlıq, istinad, keçid, heşteqlər; mətn videodadır).
   */
  function reelCaptionFor(content, info, dateKey) {
    const opts = { day: dateKey, tagKind: 'reel' }
    const full = REEL.reelCaption(buildCaptionMulti(content, cfg.captionLangs, opts), info.audio, cfg.captionLangs)
    if (full) return full
    const L1 = cfg.captionLangs[0]
    const p = (content.variant && content.variant(L1)) || content
    return REEL.reelCaption(buildCaption({ ...p, ar: '', text: '' }, L1, opts), info.audio, cfg.captionLangs)
  }

  const reelMissing = new Set()
  const reelLangWarned = new Set()
  async function runReel(row, dateKey, slotKey) {
    try {
      const info = reelInfo(dateKey)
      if (!info) throw failure('fatal', 'reel file missing')
      const pick = { ...dailyAyah.parseRef(info.ref), ref: info.ref }
      const data = await ayahData(pick)
      if (!data) throw failure('transient', 'ayah source unavailable')
      // Passaj (67:1-5) — başlıq "Verses of the Quran" (videodakı kimi); tək ayə — "Verse of the day"
      const reelContent = (L) => { const c = ayahContent(L, pick, data, origin); if (c) c.title = REEL.reelTitle(L, pick); return c }
      const content = withVariant(reelContent(cfg.lang), reelContent)
      if (!content) throw failure('fatal', 'no content')
      // Videonun dili (sidecar lang, CI: IG_REEL_LANG) caption-un əsas dilindən fərqlidirsə — bir dəfə xəbərdarlıq
      if (info.lang && info.lang !== cfg.captionLangs[0] && !reelLangWarned.has(dateKey)) {
        reelLangWarned.add(dateKey)
        log.warn(`Instagram: reel videosu ${info.lang} dilindədir, caption isə ${cfg.captionLangs.join(',')} — repo dəyişəni IG_REEL_LANG / IG_CAPTION_LANGS uyğunlaşdırın`)
      }
      const caption = reelCaptionFor(content, info, dateKey)
      if (!caption) throw failure('fatal', 'caption too long')
      // Üz qabığı: son saniyə — bütün mətn (ərəbcə, tərcümə, istinad) görünür
      const mid = await publishReel(`${origin}/api/ig/card/${dateKey}-reel.mp4`, { caption, thumbOffsetMs: Math.max(0, info.durationMs - 1000) })
      q.done.run(mid, content.key, now(), row.id)
      log.log(`Instagram: reel dərc olundu — ${dateKey} ${slotKey} ${content.key}`)
      return true
    } catch (e) {
      return recordFailure(row, e, 'reel', dateKey, slotKey)
    }
  }

  /** Reel yuvası (tick içindən): fayl yoxdursa bir dəfə loglanır və atlanır (sətir tutulmur). */
  async function reelTick(t) {
    if (!cfg.reelKinds.includes('ayah')) return 0
    const sm = toMin(cfg.reelTime), cur = toMin(t.hhmm)
    if (cur < sm || cur > sm + CATCHUP_MIN) return 0
    if (!reelInfo(t.dateKey)) {
      if (!reelMissing.has(t.dateKey)) {
        if (reelMissing.size > 10) reelMissing.clear()
        reelMissing.add(t.dateKey)
        log.warn(`Instagram: ${t.dateKey} reel faylı yoxdur və ya yararsızdır — reel atlandı (.github/workflows/ig-reel.yml)`)
      }
      return 0
    }
    const row = claimRow(t.dateKey, cfg.reelTime, 'reel', 'ayah')
    return row && await runReel(row, t.dateKey, cfg.reelTime) ? 1 : 0
  }

  // ── Həftəlik karusel (IG_CAROUSEL=1; susmaya görə cümə 11:00 Asia/Baku): üz qabığı + 5 element + bağlanış kartı.
  //    Mövzu həftəyə görə növbələşir: Allahın adları → Buxari / Müslim hədisləri → Quran ayələri. Mənbələr yalnız tərcüməsi
  //    yoxlanmış sayt məlumatıdır (names99, daily-hadith-data, alquran.cloud) — Hisnul-Müslim (AI tərcümə) YOX. ──
  const renderText = opts.renderText || ((c, o) => require('./instagramCard').renderTextCard(c, o))
  const weekOf = (dateKey) => Math.floor(dailyAyah.dayNumber(dateKey) / 7)
  const weekday = (dateKey) => new Date(`${dateKey}T00:00:00Z`).getUTCDay()
  const mod = (a, n) => ((a % n) + n) % n
  const carouselTheme = (dateKey) => CAROUSEL_THEMES[mod(weekOf(dateKey), CAROUSEL_THEMES.length)]
  // Karuselin rəng teması — bütün dəst bir tema, həftəyə görə növbələşir (dawn → day → night)
  const carouselColour = (dateKey) => CAROUSEL_COLOURS[mod(weekOf(dateKey), CAROUSEL_COLOURS.length)]
  let bmList = null
  const bukhariMuslim = () => (bmList || (bmList = dailyHadith.LIST.filter((h) => isBukhariMuslim(h.src.az))))
  let ayahPool = null
  const carouselAyahRefs = () => (ayahPool || (ayahPool = dailyAyah.AYAH_REFS.filter((r) => { const p = dailyAyah.parseRef(r); return p && !(p.a === 1 && p.s >= 67) })))
  const retitle = (c, theme, L) => (c ? { ...c, title: CAROUSEL_TITLE[theme][L] } : c)

  /** Həftənin k-cı elementi (null — yararsız; throw — ayə mənbəyi əlçatmazdır). */
  async function carouselCandidate(theme, dateKey, k, lang) {
    const i = (n) => mod(weekOf(dateKey) * CAROUSEL_ITEMS + k, n)
    if (theme === 'name') {
      const n = IG_DATA.names[i(IG_DATA.names.length)]
      return withVariant(nameContent(lang, n, origin), (L) => nameContent(L, n, origin))
    }
    if (theme === 'hadith') {
      const list = bukhariMuslim()
      if (!list.length) return null
      const h = list[i(list.length)]
      return withVariant(retitle(hadithContent(lang, h, origin), theme, lang), (L) => retitle(hadithContent(L, h, origin), theme, L))
    }
    // Qısa surələrin yalnız 1-ci ayəsi (81:1, 80:1 …) karuseldə kontekstsiz qalır — onlar atlanır
    const refs = carouselAyahRefs()
    const ref = refs[i(refs.length)]
    const pick = { ...dailyAyah.parseRef(ref), ref }
    const data = await ayahData(pick)
    if (!data) throw failure('transient', 'ayah source unavailable')
    return withVariant(retitle(ayahContent(lang, pick, data, origin), theme, lang), (L) => retitle(ayahContent(L, pick, data, origin), theme, L))
  }

  const itemLabel = (c, lang) => (c.kind === 'name' ? (lang === 'ar' ? c.ar : (c.tl || c.ar)) : c.ref)

  /** → { theme, items, caption, cards: [üz, …elementlər, bağlanış], alts } | null (kifayət qədər sığan element yoxdur) */
  async function prepareCarousel(dateKey, { lang = cfg.lang } = {}) {
    const theme = carouselTheme(dateKey)
    const colour = carouselColour(dateKey)
    const items = [], cards = []
    for (let k = 0; items.length < CAROUSEL_ITEMS && k < CAROUSEL_ITEMS + MAX_PICK_TRIES; k++) {
      const c = await carouselCandidate(theme, dateKey, k, lang)
      if (!c) continue
      const issues = checkArabic(c)
      if (issues.length) { skipLog(c.key, issues); continue }
      const buf = await render(c, { format: 'feed', theme: colour, lang })
      if (!buf) continue
      items.push(c); cards.push(buf)
    }
    if (items.length < CAROUSEL_MIN_ITEMS) return null
    const L1 = cfg.captionLangs[0]
    const caption = buildCarouselCaption(theme, items.map((c) => (c.variant && c.variant(L1)) || c), cfg.captionLangs, { day: dateKey, origin })
    if (!caption) return null
    const labels = items.map((c) => itemLabel(c, lang))
    const cover = await renderText({ eyebrow: WEEKLY[lang], headline: CAROUSEL_TITLE[theme][lang], lines: labels, footer: SWIPE[lang] }, { theme: colour, lang })
    const closing = await renderText({ eyebrow: '', headline: CLOSING[lang], lines: [IG_HANDLE, `${SITE_LINE[lang]}: muslims.cc`], footer: '' }, { theme: colour, lang })
    if (!cover || !closing) return null
    const alts = [
      `${WEEKLY[lang]} — ${CAROUSEL_TITLE[theme][lang]}: ${labels.join(', ')}`.slice(0, ALT_MAX),
      ...items.map((c) => altTextFor(c, lang)),
      `${CLOSING[lang]} — ${IG_HANDLE}, muslims.cc`,
    ]
    return { theme, colour, items, caption, cards: [cover, ...cards, closing], alts }
  }

  async function runCarousel(row, dateKey, slotKey) {
    try {
      const prep = await prepareCarousel(dateKey)
      if (!prep) throw failure('fatal', 'no fitting carousel items')
      const urls = prep.cards.map((buf, i) => {
        const name = `${dateKey}-carousel-${i}.jpg`
        writeCard(name, buf)
        return `${origin}/api/ig/card/${name}`
      })
      const mid = await publishCarousel(urls, { caption: prep.caption, alts: prep.alts })
      const item = `carousel:${prep.items.map((c) => c.key).join(',')}`.slice(0, 300)
      q.done.run(mid, item, now(), row.id)
      log.log(`Instagram: karusel dərc olundu — ${dateKey} ${slotKey} ${prep.theme} (${prep.items.length} element)`)
      return true
    } catch (e) {
      return recordFailure(row, e, 'carousel', dateKey, slotKey)
    }
  }

  async function carouselTick(t) {
    if (weekday(t.dateKey) !== cfg.carouselDay) return 0
    const sm = toMin(cfg.carouselTime), cur = toMin(t.hhmm)
    if (cur < sm || cur > sm + CATCHUP_MIN) return 0
    const row = claimRow(t.dateKey, cfg.carouselTime, 'carousel', carouselTheme(t.dateKey))
    return row && await runCarousel(row, t.dateKey, cfg.carouselTime) ? 1 : 0
  }

  /** Növbəti karusel günü (bu gün — vaxt keçməyibsə) və mövzusu. */
  function nextCarousel() {
    const t = nowAt(TZ, now())
    for (let i = 0; i < 8; i++) {
      const d = addDays(t.dateKey, i)
      if (weekday(d) !== cfg.carouselDay) continue
      if (i === 0 && toMin(t.hhmm) > toMin(cfg.carouselTime) + CATCHUP_MIN) continue
      return { date: d, time: cfg.carouselTime, theme: carouselTheme(d), colour: carouselColour(d) }
    }
    return null
  }

  function carouselStatus() {
    const next = nextCarousel()
    const day = nowAt(TZ, now()).dateKey
    const row = q.get.get(day, cfg.carouselTime, 'carousel')
    return {
      enabled: cfg.carousel, day: cfg.carouselDay, time: cfg.carouselTime, next,
      post: row ? { status: row.status, error: row.error ? String(row.error).slice(0, 120) : null, ig_media_id: row.ig_media_id } : null,
    }
  }

  // ── İnsights (öz postlarımızın reach / saves / shares): gündə bir dəfə, 05:00-dan sonra; icazə yoxdursa (kod 10 / 200–299)
  //    vəziyyət "no_permission" olur və admin panelində izah göstərilir. Dərcə heç vaxt təsir etmir (planlayıcını dayandırmır). ──
  const insState = () => { const r = q.stGet.get('insights_status'); try { return r ? { ...JSON.parse(r.v), at: r.at } : null } catch { return null } }
  const setInsState = (state) => q.stSet.run('insights_status', JSON.stringify({ state }), now())
  const metricNum = (m) => {
    const v = m && (Array.isArray(m.values) && m.values[0] ? m.values[0].value : (m.total_value ? m.total_value.value : null))
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
  }
  function parseInsights(j) {
    const out = { reach: null, saved: null, shares: null, likes: null, comments: null, views: null }
    for (const m of (j && Array.isArray(j.data) ? j.data : [])) if (m && Object.hasOwn(out, m.name)) out[m.name] = metricNum(m)
    return out
  }
  let insBusy = false
  async function insightsTick() {
    if (!cfg.enabled || !cfg.insights || authBlocked || insBusy) return 0
    const t = now()
    const bt = nowAt(TZ, t)
    if (toMin(bt.hhmm) < 5 * 60) return 0
    if (q.stClaim.run(`insights:${bt.dateKey}`, '1', t).changes !== 1) return 0
    insBusy = true
    let n = 0
    try {
      const rows = q.insTargets.all(addDays(bt.dateKey, -INSIGHT_DAYS), t - 6 * 3600e3, INSIGHT_MAX_PER_RUN)
      for (const r of rows) {
        if (!INSIGHT_FORMATS.includes(r.format) || !/^\d{1,40}$/.test(String(r.ig_media_id))) continue
        let j = null
        for (const metric of INSIGHT_METRICS) {
          try { j = await graph('GET', `/${r.ig_media_id}/insights`, { metric }); break } catch (e) {
            if (e && e.kind === 'auth') { setInsState(e.code === 190 ? 'token_error' : 'no_permission'); log.warn(`Instagram insights: ${e.code === 190 ? 'token' : 'icazə yoxdur (instagram_manage_insights)'} — statistika toplanmır, dərc davam edir`); return n }
            if (!(e && e.code === 100)) break                 // metrika bu media növündə yoxdur → qısa siyahı; başqa xəta → atla
          }
        }
        if (!j) continue
        const v = parseInsights(j)
        q.insSet.run(String(r.ig_media_id), r.day, r.slot, r.format, r.kind, v.reach, v.saved, v.shares, v.likes, v.comments, v.views, t)
        n++
      }
      if (n) setInsState('ok')
    } catch (e) {
      log.warn('Instagram insights:', e && (e.kind || e.message))
    } finally { insBusy = false }
    return n
  }

  function insightsStatus() {
    const st = insState()
    const since = addDays(nowAt(TZ, now()).dateKey, -INSIGHT_DAYS)
    const byKind = q.insByKind.all(since).map((r) => ({ ...r }))
    const bySlot = q.insBySlot.all(since).map((r) => ({ ...r }))
    const best = (list) => (list.find((r) => r.posts >= 2) || list[0] || null)
    const bk = best(byKind), bs = best(bySlot)
    return {
      enabled: cfg.insights, state: st ? st.state : null, checkedAt: st ? st.at : null, days: INSIGHT_DAYS, byKind, bySlot,
      best: { kind: bk ? { kind: bk.kind, format: bk.format } : null, slot: bs ? bs.slot : null },
    }
  }

  // ── Ramazan geri sayımı (IG_RAMADAN; instagramRamadan.js): gündə bir story, yalnız Ramazana 90 … 1 gün qalanda ──
  const renderRamadan = opts.renderRamadan || ((c, o) => require('./instagramCard').renderRamadanCard(c, o))
  /** Günün story-si → { content, jpeg } | null (bu gün aktiv deyil / kart sığmır) */
  async function prepareRamadan(dateKey, { lang = cfg.lang } = {}) {
    const content = RAMADAN.storyContent(dateKey, lang)
    if (!content) return null
    const jpeg = await renderRamadan(content, { theme: 'dawn', lang })
    return jpeg ? { content, jpeg } : null
  }
  async function runRamadan(row, dateKey) {
    try {
      const prep = await prepareRamadan(dateKey)
      if (!prep) throw failure('fatal', 'ramadan story not available')
      const name = `${dateKey}-ramadan-story.jpg`
      writeCard(name, prep.jpeg)
      const mid = await publishImage(`${origin}/api/ig/card/${name}`, { story: true })
      q.done.run(mid, prep.content.key, now(), row.id)
      log.log(`Instagram: Ramazan story-si dərc olundu — ${dateKey} ${prep.content.key}`)
      return true
    } catch (e) {
      return recordFailure(row, e, 'story', dateKey, RAMADAN_SLOT)
    }
  }
  async function ramadanTick(t) {
    const sm = toMin(cfg.ramadanTime), cur = toMin(t.hhmm)
    if (cur < sm || cur > sm + CATCHUP_MIN) return 0
    if (!RAMADAN.countdown(t.dateKey).active) return 0
    const row = claimRow(t.dateKey, RAMADAN_SLOT, 'story', 'ramadan')
    return row && await runRamadan(row, t.dateKey) ? 1 : 0
  }
  function ramadanStatus() {
    const day = nowAt(TZ, now()).dateKey
    const row = q.get.get(day, RAMADAN_SLOT, 'story')
    return {
      enabled: cfg.ramadan, time: cfg.ramadanTime, date: day, ...RAMADAN.statusFor(day, cfg.lang),
      post: row ? { status: row.status, error: row.error ? String(row.error).slice(0, 120) : null, ig_media_id: row.ig_media_id, item: row.item } : null,
    }
  }

  /** Sətri bu proses üçün "tut": yeni — INSERT; retry vaxtı çatıb və ya yarımçıq qalıb — atom UPDATE. */
  function claimRow(day, slotKey, format, kind) {
    const t = now()
    if (q.claim.run(day, slotKey, format, kind, t, t).changes === 1) return q.get.get(day, slotKey, format)
    const row = q.get.get(day, slotKey, format)
    if (!row || row.status === 'published' || row.status === 'failed') return null
    if (q.retake.run(t, row.id, t, t - STALE_CLAIM_MS, MAX_ATTEMPTS).changes === 1) return q.get.get(day, slotKey, format)
    return null
  }

  let busy = false
  async function tick() {
    if (!cfg.enabled || authBlocked || busy) return 0
    busy = true
    let n = 0
    try {
      const t = nowAt(TZ, now())
      const cur = toMin(t.hhmm)
      for (let i = 0; i < cfg.slots.length; i++) {
        const sm = toMin(cfg.slots[i])
        if (cur < sm || cur > sm + CATCHUP_MIN) continue
        for (const format of cfg.stories ? ['feed', 'story'] : ['feed']) {
          if (authBlocked) break
          const row = claimRow(t.dateKey, cfg.slots[i], format, kindFor(i, t.dateKey))
          if (row && await runFormat(row, t.dateKey, i, cfg.slots[i], format)) n++
        }
      }
      if (cfg.reels && !authBlocked) n += await reelTick(t)
      if (cfg.carousel && !authBlocked) n += await carouselTick(t)
      if (cfg.ramadan && !authBlocked) n += await ramadanTick(t)
    } catch (e) {
      log.error('Instagram tick:', e && e.message)
    } finally { busy = false }
    return n
  }

  /** Əl ilə dərhal dərc (admin / CLI): bu gün, yuva i — gündə bir dəfə (slot = 'manual-<i>'). */
  async function publishNow(slotIndex) {
    if (!cfg.enabled) return { error: 'disabled' }
    if (authBlocked) return { error: 'auth_error' }
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= cfg.slots.length) return { error: 'bad_slot' }
    const t = nowAt(TZ, now())
    const slotKey = `manual-${slotIndex}`
    const results = {}
    for (const format of cfg.stories ? ['feed', 'story'] : ['feed']) {
      const row = claimRow(t.dateKey, slotKey, format, kindFor(slotIndex, t.dateKey))
      if (!row) { results[format] = 'already'; continue }
      results[format] = (await runFormat(row, t.dateKey, slotIndex, slotKey, format)) ? 'published' : 'failed'
    }
    return { results }
  }

  // ── Tokenin yenilənməsi (yalnız graph.instagram.com; həftədə bir, iki proses arasında gündə bir dəfə) ──
  async function refreshTick() {
    if (!cfg.enabled || authBlocked || cfg.host !== 'graph.instagram.com') return false
    const t = now()
    const rec = tokenRecord()
    let since = rec ? rec.refreshedAt : null
    if (!since) {
      // env tokeninin yaşı bilinmir: ilk dəfə görüldüyü an (env dəyişəndə həş dəyişir → yenidən sayılır)
      const seenKey = 'env_seen:' + crypto.createHash('sha256').update(cfg.token).digest('base64url').slice(0, 16)
      q.stClaim.run(seenKey, '1', t)
      since = q.stGet.get(seenKey).at
      if (t - since < REFRESH_MIN_AGE_MS) return false
    } else if (t - since < REFRESH_EVERY_MS) return false
    const day = nowAt(TZ, t).dateKey
    // Bir dəfə: iki proses (kəsintisiz deploy) eyni gün yalnız biri yeniləyir
    if (q.stClaim.run(`refresh:${day}`, '1', t).changes !== 1) return false
    try {
      const j = await graph('GET', '/refresh_access_token', { grant_type: 'ig_refresh_token', access_token: currentToken() }, { versioned: false })
      const nt = String((j && j.access_token) || '')
      if (!TOKEN_RE.test(nt)) { log.error('Instagram: token yenilənmədi (cavab yararsızdır)'); return false }
      const exp = Number(j.expires_in) > 0 ? t + Number(j.expires_in) * 1000 : null
      q.stSet.run('token', sealToken(cfg.token, { t: nt, refreshedAt: t, expiresAt: exp }), t)
      log.log(`Instagram: token yeniləndi${exp ? ` (bitir ~${new Date(exp).toISOString().slice(0, 10)})` : ''}`)
      return true
    } catch (e) {
      if (e && e.kind === 'auth') blockAuth('token refresh')
      else log.warn('Instagram: token yenilənmədi —', e && e.kind)
      return false
    }
  }

  function purge(t = now()) {
    let n = 0
    try { n += q.purge.run(t - ROW_TTL_MS).changes } catch (e) { log.error('Instagram purge:', e && e.message) }
    try { raw.prepare("DELETE FROM instagram_state WHERE (k LIKE 'refresh:%' OR k LIKE 'insights:%') AND at < ?").run(t - 30 * 864e5) } catch { /* */ }
    try { n += q.insPurge.run(t - ROW_TTL_MS).changes } catch (e) { log.error('Instagram insights purge:', e && e.message) }
    return n + purgeCards(t)
  }

  /** Hesab məlumatı (CLI token-info, admin): token çap olunmur. */
  async function tokenInfo() {
    if (!cfg.enabled) return { error: cfg.reason }
    const out = { host: cfg.host, version: cfg.version, source: tokenRecord() ? 'refreshed' : 'env' }
    const rec = tokenRecord()
    if (rec) { out.refreshedAt = rec.refreshedAt; out.expiresAt = rec.expiresAt || null }
    try {
      const me = cfg.host === 'graph.instagram.com'
        ? await graph('GET', '/me', { fields: 'user_id,username,account_type' })
        : await graph('GET', `/${cfg.userId}`, { fields: 'id,username' })
      out.username = me.username || null
      out.accountType = me.account_type || null
      out.userIdMatches = String(me.user_id || me.id || '') === cfg.userId
      const lim = await graph('GET', `/${cfg.userId}/content_publishing_limit`, { fields: 'quota_usage,config' })
      const d = lim && Array.isArray(lim.data) ? lim.data[0] : null
      if (d) out.quota = { usage: Number(d.quota_usage) || 0, total: Number(d.config && d.config.quota_total) || null }
    } catch (e) {
      out.error = (e && e.kind) || 'error'
      if (e && e.kind === 'auth') blockAuth('token-info')
    }
    return out
  }

  function status() {
    const rec = cfg.token ? tokenRecord() : null
    return {
      enabled: cfg.enabled, reason: authBlocked ? 'auth_error' : cfg.reason, configured: cfg.configured,
      lang: cfg.lang, captionLangs: cfg.captionLangs, stories: cfg.stories, host: cfg.host, timezone: TZ,
      slots: cfg.slots.map((s, i) => {
        const day = nowAt(TZ, now()).dateKey
        const kind = kindFor(i, day)
        const on = slotVideoOn(i)
        const vi = on ? textVideoInfo(day, kind) : null
        return {
          time: s, kind: SLOT_KINDS[i % SLOT_KINDS.length], todayKind: kind, theme: themeForSlot(i, day),
          video: { enabled: on, file: vi ? { item: `${kind}:${vi.item}`, durationMs: vi.durationMs, size: vi.size } : null },
        }
      }),
      reelKinds: cfg.reelKinds,
      next: cfg.enabled ? nextSlot(cfg.slots, now()) : null,
      token: cfg.enabled ? { source: rec ? 'refreshed' : 'env', refreshedAt: rec ? rec.refreshedAt : null, expiresAt: rec ? (rec.expiresAt || null) : null } : null,
      posts: q.recent.all(30).map((r) => ({ ...r, error: r.error ? String(r.error).slice(0, 120) : null })),
      reel: reelStatus(),
      carousel: carouselStatus(),
      insights: insightsStatus(),
      ramadan: ramadanStatus(),
      growth: { altText: cfg.altText, location: Boolean(cfg.locationId), hashtagsMax: HASHTAG_MAX },
    }
  }

  /** Bu günün reel-i: fayl (CI yükləyib?), dərc sətri; url — yalnız fayl varsa (admin önizləmə keçidi). */
  function reelStatus() {
    const day = nowAt(TZ, now()).dateKey
    const info = reelInfo(day)
    const row = q.get.get(day, cfg.reelTime, 'reel')
    return {
      enabled: cfg.reels, time: cfg.reelTime, date: day,
      file: info ? { size: info.size, ref: info.ref, audio: info.audio, lang: info.lang, durationMs: info.durationMs } : null,
      post: row ? { status: row.status, error: row.error ? String(row.error).slice(0, 120) : null, ig_media_id: row.ig_media_id, attempts: row.attempts } : null,
      url: info && cfg.enabled ? `/api/ig/card/${day}-reel.mp4` : null,
    }
  }

  /** Önizləmə (dərc etmir, fayl yazmır). */
  async function preview(slotIndex, { format = 'feed', date = null, lang = cfg.lang } = {}) {
    const d = date && DATE_RE.test(date) ? date : nowAt(TZ, now()).dateKey
    const i = Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < Math.max(3, cfg.slots.length) ? slotIndex : 0
    const prep = await prepare(d, i, { formats: [format], lang })
    return prep ? { jpeg: prep.cards[format], caption: prep.caption, item: prep.content.key, kind: prep.content.kind } : null
  }

  // ── HTTP ──
  const router = express.Router()
  // 404 KEŞLƏNMƏSİN (no-store): kart adı proqnozlaşdırılandır (tarix-yuva-format) və .jpg-dir — Cloudflare
  // 404-ü də keşləyirdi (2026-11-25 yoxlandı: ikinci sorğu HIT). Kimsə gələcək kartın URL-ini əvvəlcədən
  // istəyib 404-ü keşdə saxlasa, Meta şəkli çəkəndə onu alardı → dərc "media" xətası ilə alınmazdı.
  const notFound = (res) => res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found' })
  router.get('/ig/card/:name', (req, res) => {
    if (!cfg.enabled) return notFound(res)
    const name = String(req.params.name || '')
    // Reel videosu: Range sorğuları (206) — Meta videonu hissə-hissə çəkə bilər; qısa keş (eyni gün yenidən yüklənə bilər)
    if (REEL.VIDEO_MP4_RE.test(name)) {
      return res.sendFile(name, {
        root: cardDir, dotfiles: 'deny', acceptRanges: true, cacheControl: false, etag: true, lastModified: true,
        headers: { 'Content-Type': 'video/mp4', 'Cache-Control': 'public, max-age=300', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' },
      }, (e) => {
        if (!e || res.headersSent) return
        if (e.status === 416 || e.statusCode === 416) return res.status(416).set('Cache-Control', 'no-store').end()   // Content-Range: bytes */<ölçü> — send qoyur
        notFound(res)
      })
    }
    if (!CARD_NAME_RE.test(name) && !CAROUSEL_NAME_RE.test(name) && !RAMADAN_NAME_RE.test(name)) return notFound(res)
    let buf
    try { buf = fs.readFileSync(path.join(cardDir, name)) } catch { return notFound(res) }
    res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400', 'X-Robots-Tag': 'noindex', 'X-Content-Type-Options': 'nosniff' })
    res.send(buf)
  })

  /** Admin marşrutları: requireAdmin + rol (server.js ötürür). */
  function adminRouter({ requireAdmin, adminRoleOf }) {
    const r = express.Router()
    const json = express.json({ limit: '2kb' })
    const err = (res, status, code) => res.status(status).json({ error: 'Request failed', code })
    const role = (req) => (adminRoleOf && req.adminUser ? adminRoleOf(req.adminUser.id) : null)
    const adminOnly = (req, res, next) => {
      res.set('Cache-Control', 'no-store')
      if (!req.adminUser || req.adminUser.via !== 'session') return err(res, 403, 'session_required')
      if (!['admin', 'superadmin'].includes(role(req))) return err(res, 403, 'admin_required')
      next()
    }
    const superOnly = (req, res, next) => (role(req) === 'superadmin' ? next() : err(res, 403, 'superadmin_required'))
    const buckets = new Map()
    const allow = (k, max) => {
      const t = now(), b = buckets.get(k)
      if (!b || t - b.start >= 3600e3) { buckets.set(k, { start: t, n: 1 }); return true }
      if (b.n >= max) return false
      b.n++
      return true
    }
    const bodyOf = (req) => (req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {})

    r.get('/admin/instagram', requireAdmin, adminOnly, (req, res) => res.json(status()))

    r.post('/admin/instagram/preview', requireAdmin, adminOnly, superOnly, json, async (req, res) => {
      const b = bodyOf(req)
      if (b.slot === RAMADAN_SLOT) {
        const lang = b.lang == null ? cfg.lang : (LANGS.includes(b.lang) ? b.lang : null)
        if (!lang) return err(res, 400, 'bad_lang')
        if (!allow(`p:${req.adminUser.id}`, 30)) return err(res, 429, 'rate_limited')
        try {
          const p = await prepareRamadan(nowAt(TZ, now()).dateKey, { lang })
          if (!p) return err(res, 422, 'ramadan_inactive')
          res.set({ 'Content-Type': 'image/jpeg', 'X-Ig-Item': encodeURIComponent(p.content.key), 'X-Ig-Caption': '' })
          return res.send(p.jpeg)
        } catch (e) {
          log.error('Instagram preview:', e && (e.kind || e.message))
          return err(res, 502, 'render_failed')
        }
      }
      const slot = Number(b.slot)
      const format = b.format === 'story' ? 'story' : b.format === 'feed' || b.format == null ? 'feed' : null
      if (!Number.isInteger(slot) || slot < 0 || slot > 5 || !format) return err(res, 400, 'bad_request')
      const lang = b.lang == null ? cfg.lang : (LANGS.includes(b.lang) ? b.lang : null)
      if (!lang) return err(res, 400, 'bad_lang')
      if (!allow(`p:${req.adminUser.id}`, 30)) return err(res, 429, 'rate_limited')
      try {
        const p = await preview(slot, { format, lang })
        if (!p) return err(res, 422, 'no_fitting_item')
        res.set({ 'Content-Type': 'image/jpeg', 'X-Ig-Item': encodeURIComponent(p.item), 'X-Ig-Caption': encodeURIComponent(p.caption).slice(0, 7000) })
        return res.send(p.jpeg)
      } catch (e) {
        log.error('Instagram preview:', e && (e.kind || e.message))
        return err(res, 502, e && e.kind === 'transient' ? 'source_unavailable' : 'render_failed')
      }
    })

    r.post('/admin/instagram/publish', requireAdmin, adminOnly, superOnly, json, async (req, res) => {
      const b = bodyOf(req)
      const slot = Number(b.slot)
      if (b.confirm !== true) return err(res, 400, 'confirm_required')
      if (!Number.isInteger(slot) || slot < 0 || slot >= cfg.slots.length) return err(res, 400, 'bad_slot')
      if (!cfg.enabled) return err(res, 409, 'disabled')
      if (authBlocked) return err(res, 409, 'auth_error')
      if (!allow(`m:${req.adminUser.id}`, 6)) return err(res, 429, 'rate_limited')
      // Dərc dəqiqələrlə çəkə bilər (konteyner hazırlığı) — arxa planda; nəticə statusda görünür
      publishNow(slot).catch((e) => log.error('Instagram publish-now:', e && e.message))
      return res.status(202).json({ ok: true })
    })
    return r
  }

  return {
    enabled: cfg.enabled, config: cfg, router, adminRouter, tick, refreshTick, insightsTick, purge, purgeCards, publishNow, preview, status,
    tokenInfo, prepare, prepareCarousel, prepareRamadan, ramadanStatus, carouselTheme, carouselColour, cardDir, reelInfo, textVideoInfo, slotVideo, _q: q, _graph: graph, _publishImage: publishImage, _publishReel: publishReel,
    _publishCarousel: publishCarousel,
  }
}

module.exports = {
  createInstagram, parseConfig, parseSlots, parseCaptionLangs, parseReelKinds, kindFor, themeFor, themeForSlot, videoKeyForSlot, staticCandidate, contentById, itemIdOf,
  CAROUSEL_COLOURS, DEFAULT_REEL_KINDS, nextSlot, buildCaption, buildCaptionMulti, classifyError, isBukhariMuslim,
  hadithContent, duaContent, nameContent, ayahContent, sealToken, openToken, CARD_NAME_RE, SLOT_KINDS, DEFAULT_SLOTS, LANGS,
  hashtagsFor, firstLine, altTextFor, buildCarouselCaption, CAROUSEL_NAME_RE, RAMADAN_NAME_RE, RAMADAN_SLOT, DEFAULT_RAMADAN_TIME, CAROUSEL_THEMES, HASHTAG_MAX, HASHTAGS, CAPTION_MAX,
}
