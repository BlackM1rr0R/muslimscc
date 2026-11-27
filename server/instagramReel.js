// ═══════════════════════════════════════════════════════════════════════
// Instagram REEL — günün Quran PASSAJININ videosu (docs/INSTAGRAM.md → "Reels"): server və CI renderi üçün ortaq SAF köməkçilər
//
// • Video serverdə ÇƏKİLMİR (1 GB server): GitHub Actions (.github/workflows/ig-reel.yml) scripts/ig-reel/render.mjs ilə
//   MP4 hazırlayır və ci-gate.sh "ig-reel <tarix> <ref> <səs> [dil]" ilə api həcminə yazır:
//     /data/ig-cards/<YYYY-MM-DD>-reel.mp4  +  <YYYY-MM-DD>-reel.json ({"ref":"67:1-5","audio":"alafasy","lang":"en"})
//   server/instagram.js (IG_REELS=1) IG_REEL_TIME-da (susmaya görə 18:00, Asia/Baku) media_type=REELS ilə dərc edir.
// • 2026-11-27-dən: tək ayə yox, ardıcıl ayələrdən PASSAJ (REEL_PASSAGES — əl ilə seçilmiş məşhur yerlər, gün üzrə
//   deterministik növbə, passageRef). Tilavət PASSAGE_MAX_SEC-ə sığmırsa — ən uzun BÜTÖV ayə prefiksi (trimPassage; ayə heç
//   vaxt kəsilmir). Ayə kartda minimal ölçüdə sığmırsa — sıradakı passaj. Köhnə tək ayə sidecar-ları (AYAH_REFS) da qəbul
//   olunur (keçid dövrü). Mətn alquran.cloud-dan, dəyişdirilmir (yalnız kartdakı kimi dayanma işarəsi sözə bitişik çəkilir).
// • Köhnə tək ayə köməkçiləri (reelRef, reelTimeline, REEL_MAX_SEC) geriyə uyğunluq üçün qalır (server/tiktok.js də oxuyur).
// • Səs: saytın Quran səsi ilə eyni mənbə və qari (src/utils/quranAudio.js → RECITERS[0] "alafasy").
// • Bu modul şəbəkəyə, fayla, sharp-a toxunmur — test olunur (tests/unit/server-instagram-reel.test.js).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const dailyAyah = require('./daily-ayah')

const REEL_MP4_RE = /^(\d{4}-\d{2}-\d{2})-reel\.mp4$/
const REEL_META_RE = /^(\d{4}-\d{2}-\d{2})-reel\.json$/
// 2026-11-27: günə 3 video — ayə passajı (<tarix>-reel.mp4, yuxarıdakı köhnə ad), hədis və dua / Allahın adı
// (<tarix>-reel-<növ>.mp4 + .json). Növ adı fayl adındadır; sidecar {"kind","item","audio","lang"}.
const VIDEO_KINDS = ['ayah', 'hadith', 'dua', 'name']
const TEXT_KINDS = ['hadith', 'dua', 'name']
const VIDEO_MP4_RE = /^(\d{4}-\d{2}-\d{2})-reel(?:-(hadith|dua|name))?\.mp4$/
const VIDEO_META_RE = /^(\d{4}-\d{2}-\d{2})-reel(?:-(hadith|dua|name))?\.json$/
// Hədis / dua videosunun səsi: çox zəif neytral fon (süzülmüş küy — musiqi və səsləndirmə YOX) və ya sükut
const TEXT_AUDIO_MODES = ['ambient', 'none']
const TEXT_MIN_SEC = 20
const TEXT_MAX_SEC = 40
// Tema növə görə (instagramCard.THEMES): Instagram grid-də ardıcıl elementlər fərqli rəngdə olsun —
//   08:00 ayə — dawn, 13:00 hədis — day, 18:00 ayə passajı reel-i — dawn, 20:00 dua / ad — night (docs/INSTAGRAM.md → "Temalar")
const KIND_THEMES = { ayah: 'dawn', hadith: 'day', dua: 'night', name: 'night' }
const themeForKind = (kind) => KIND_THEMES[kind] || 'day'
/** Fayl adı (uzantısız): ayah → <tarix>-reel, digərləri → <tarix>-reel-<növ>. */
const videoBase = (dateKey, kind = 'ayah') => (kind === 'ayah' ? `${dateKey}-reel` : `${dateKey}-reel-${kind}`)
const REEL_MAX_BYTES = 15 * 1024 * 1024
const REEL_MIN_SEC = 15
const REEL_MAX_SEC = 45            // köhnə tək ayə reel-inin həddi (reelTimeline); passaj reel-i — PASSAGE_MAX_SEC
// Passaj reel-i: Meta Content Publishing API REELS üçün 3 s – 15 dəq qəbul edir, amma Instagram 90 s-dən uzun reel-ləri
// izləməyənlərə tövsiyə etmir və server/instagram.js reelInfo 90 s-dən uzun faylı rədd edir — hədd 89 s (yuvarlaqlaşma payı)
const PASSAGE_MAX_SEC = 89
const PASSAGE_LEAD_SEC = 0.8       // tilavətdən əvvəl (ilk kadr: başlıq + istinad + 1-ci ayənin izi)
const PASSAGE_TAIL_SEC = 2.2       // tilavətdən sonra (son ayə tam görünür — üz qabığı: son saniyə)
const PASSAGE_XFADE_SEC = 0.3      // ayələr arasında: köhnə ayə sönür, yenisi yazılır
// Reel-in dili (tərcümə + başlıq): alquran.cloud nəşri olan dillər (ar — tərcüməsiz, reel-də yoxdur)
const REEL_LANGS = ['en', 'az', 'ru', 'tr']
const DEFAULT_REEL_LANG = 'en'
// Əl ilə seçilmiş məşhur passajlar (yalnız istinad; mətn alquran.cloud-dan, verbatim). Alafasy tilavəti (128 kbps) ilə
// ölçülüb və en.asad ilə reel kartında sığması yoxlanıb (2026-11-27): çoxu 45–86 s; uzunlar trimPassage ilə bütöv ayə
// prefiksinə qısalır (3:190-194 → 3:190-192, 23:1-11 → 23:1-9, 36:1-12 → 36:1-9, 55:1-16 → 55:1-12).
// Siyahıda YOXDUR: 2:255, 2:284-286 (ayə bir ekranda minimal ölçüdə sığmır — həmişə atlanardı), 112 (13 s), 103 (20 s).
const REEL_PASSAGES = [
  '1:1-7', '2:1-5', '3:26-27', '3:190-194', '13:28-29', '17:23-24', '23:1-11', '25:63-67', '36:1-12', '39:53-54',
  '55:1-16', '59:22-24', '67:1-5', '78:1-16', '87:1-13', '87:14-19', '91:1-15', '93:1-11', '94:1-8', '97:1-5',
  '99:1-8', '100:1-11', '101:1-11', '102:1-8', '113:1-5', '114:1-6',
]
const PASSAGE_STEP = 7
const PASSAGE_TITLE = { az: 'Quran ayələri', en: 'Verses of the Quran', ru: 'Аяты Корана', tr: 'Kur’an ayetleri', ar: 'آيات من القرآن الكريم' }
const AUDIO_MODES = ['alafasy', 'none']
const DEFAULT_REEL_TIME = '18:00'
// Video emalı şəkildən uzun çəkir: ~5 dəq ərzində artan fasilə ilə status yoxlanır (saniyə)
const REEL_POLL_SEC = [5, 5, 10, 10, 15, 15, 20, 20, 30, 30, 30, 30, 30, 30, 30]

// src/utils/quranAudio.js → RECITERS[0] (saytın susmaya görə qarisi) — adlar və mənbələr eynidir
const RECITER = {
  id: 'alafasy',
  name: { az: 'Mişari Raşid əl-Əfasi', en: 'Mishary Rashid Alafasy', ru: 'Мишари Рашид аль-Афаси', ar: 'مشاري راشد العفاسي', tr: 'Mişari Raşid el-Afasi' },
}
const RECITATION = { az: 'Tilavət', en: 'Recitation', ru: 'Чтение', ar: 'تلاوة', tr: 'Tilavet' }

const pad3 = (n) => String(n).padStart(3, '0')
/** Ümumi ayə nömrəsi (1…6236) — cdn.islamic.network faylının adı. */
function globalAyah(s, a) {
  let g = 0
  for (let i = 0; i < s - 1; i++) g += dailyAyah.AYAH_COUNTS[i]
  return g + a
}
/** Bir ayənin səs faylı üçün ünvanlar (sıra ilə; quranAudio.js-dəki "alafasy" mənbələri). */
function audioUrls(s, a) {
  const g = globalAyah(s, a)
  return [
    `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${g}.mp3`,
    `https://verses.quran.com/Alafasy/mp3/${pad3(s)}${pad3(a)}.mp3`,
    `https://cdn.islamic.network/quran/audio/64/ar.alafasy/${g}.mp3`,
  ]
}

// ── Seçim (instagram.js ayə yuvası ilə eyni düstur) ──
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
function rotIndex(dateKey, n, step, k) {
  const s = gcd(step, n) === 1 ? step : 1
  return ((((dailyAyah.dayNumber(dateKey) * s) % n) + n + k) % n)
}
/** Gün + k → ayə istinadı ('33:3'); k=0 — 08:00 ayə postu ilə eyni ayə. */
function reelRef(dateKey, k = 0, refs = dailyAyah.AYAH_REFS) {
  return refs[rotIndex(dateKey, refs.length, 37, k)]
}

/** {s, a, to} → '67:1-5' | '2:255' (kanonik yazılış). */
function refOf(p) {
  return `${p.s}:${p.a}${p.to && p.to !== p.a ? `-${p.to}` : ''}`
}
/** Gün + k → passaj istinadı ('67:1-5'); k artdıqca siyahıda sıradakı (passaj sığmayanda). */
function passageRef(dateKey, k = 0, list = REEL_PASSAGES) {
  return list[rotIndex(dateKey, list.length, PASSAGE_STEP, k)]
}
/**
 * Reel üçün icazəli istinad: köhnə tək ayə siyahısı (AYAH_REFS) VƏ YA REEL_PASSAGES-dəki passajın eyni ayədən başlayan
 * bütöv prefiksi (trimPassage nəticəsi: '36:1-9', '2:285'). Kanonik yazılış tələb olunur ('2:255-255' yox).
 */
function isReelRef(ref) {
  const r = String(ref || '')
  const p = dailyAyah.parseRef(r)
  if (!p || refOf(p) !== r) return false
  if (dailyAyah.AYAH_REFS.includes(r)) return true
  return REEL_PASSAGES.some((x) => { const q = dailyAyah.parseRef(x); return q && q.s === p.s && q.a === p.a && p.to <= q.to })
}
/**
 * Passajı tilavətin uzunluğuna görə qısalt: durations — ayələrin səs uzunluğu (saniyə, pick.a-dan ardıcıl), maxSec —
 * tilavət üçün hədd. → { s, a, to, ref, audioSec, count } (ən uzun BÜTÖV ayə prefiksi) | null (1-ci ayə də sığmır).
 */
function trimPassage(pick, durations, maxSec = PASSAGE_MAX_SEC - PASSAGE_LEAD_SEC - PASSAGE_TAIL_SEC) {
  if (!pick || !Array.isArray(durations)) return null
  const n = Math.min(durations.length, pick.to - pick.a + 1)
  let sum = 0, count = 0
  for (let i = 0; i < n; i++) {
    const d = Number(durations[i])
    if (!Number.isFinite(d) || d <= 0 || sum + d > maxSec) break
    sum += d
    count++
  }
  if (!count) return null
  const out = { s: pick.s, a: pick.a, to: pick.a + count - 1 }
  return { ...out, ref: refOf(out), audioSec: Math.round(sum * 1000) / 1000, count }
}
/** Reel-in başlığı: tək ayə — "Verse of the day", passaj — "Verses of the Quran" (dilə görə). */
function reelTitle(lang, pick) {
  const L = PASSAGE_TITLE[lang] ? lang : 'az'
  return pick && pick.to && pick.to !== pick.a ? PASSAGE_TITLE[L] : dailyAyah.TITLE_PREFIX[L]
}
/** IG_REEL_LANG / --lang → REEL_LANGS-dən biri; boş / yararsızdırsa 'en'. */
function parseReelLang(raw) {
  const v = String(raw || '').trim()
  return REEL_LANGS.includes(v) ? v : DEFAULT_REEL_LANG
}

/** HH:MM (IG_REEL_TIME) → normallaşdırılmış dəyər; yararsızdırsa 18:00. */
function parseReelTime(raw) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(raw || '').trim())
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return DEFAULT_REEL_TIME
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

/**
 * <tarix>-reel.json → { ref, audio, lang } | null — yalnız icazəli istinad (isReelRef: köhnə tək ayə və ya passaj prefiksi)
 * və icazəli səs rejimi; lang istəyə bağlıdır (köhnə sidecar-larda yoxdur → null), varsa REEL_LANGS-dən biri olmalıdır.
 */
function parseMeta(raw) {
  let o
  try { o = typeof raw === 'string' || Buffer.isBuffer(raw) ? JSON.parse(String(raw)) : raw } catch { return null }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  const ref = typeof o.ref === 'string' ? o.ref : ''
  if (!isReelRef(ref)) return null
  const audio = AUDIO_MODES.includes(o.audio) ? o.audio : null
  if (!audio) return null
  if (o.lang != null && !REEL_LANGS.includes(o.lang)) return null
  return { ref, audio, lang: o.lang == null ? null : o.lang }
}

/**
 * <tarix>-reel-<növ>.json (hədis / dua / ad videosu) → { kind, item, audio, lang } | null.
 * kind — fayl adındakı növ (expectKind) ilə eyni olmalıdır; item — müsbət tam ədəd (saytın hədis / dua id-si, adın nömrəsi).
 */
function parseTextMeta(raw, expectKind = null) {
  let o
  try { o = typeof raw === 'string' || Buffer.isBuffer(raw) ? JSON.parse(String(raw)) : raw } catch { return null }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  if (!TEXT_KINDS.includes(o.kind) || (expectKind && o.kind !== expectKind)) return null
  const item = Number(o.item)
  if (!Number.isSafeInteger(item) || item < 1 || item > 9999) return null
  if (!TEXT_AUDIO_MODES.includes(o.audio)) return null
  if (o.lang != null && !REEL_LANGS.includes(o.lang)) return null
  return { kind: o.kind, item, audio: o.audio, lang: o.lang == null ? null : o.lang }
}

/**
 * Hədis / dua / ad videosunun zaman cədvəli (saniyə): ərəbcə "mürəkkəblə yazılır", sonra tərcümə söz-söz, sonra oxumaq üçün
 * sabit kadr. lines — ərəb sətirləri, words — tərcümənin söz sayı. Müddət TEXT_MIN_SEC–TEXT_MAX_SEC (mətnin uzunluğuna görə).
 * → passageTimeline ilə eyni forma (bir seqment): { duration, audioStart: 0, audioSec: 0, segments: [...] }
 */
function textTimeline({ lines = 1, words = 0 } = {}) {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
  const n = Math.max(0, Number(words) || 0)
  const inkStart = 0.6
  const inkDur = clamp(Number(lines) * 1.7, 3, 9)
  const inkEnd = inkStart + inkDur
  const trStart = inkEnd + 0.4
  const span = clamp(n * 0.22, 1.5, 14)                     // tərcümənin görünmə müddəti (söz-söz)
  const wordGap = n > 1 ? span / (n - 1) : 0
  const trEnd = trStart + span + 0.5
  const hold = clamp(n * 0.28, 5, 16)                       // hamısı göründükdən sonra oxumaq üçün
  const duration = Math.round(clamp(trEnd + hold, TEXT_MIN_SEC, TEXT_MAX_SEC) * 30) / 30
  const seg = { start: 0, end: duration, inkStart, inkEnd, trStart, wordGap, trEnd: Math.min(trEnd, duration - 1), settle: Math.max(inkEnd + 0.7, trEnd + 0.1), fadeOut: null }
  return { duration, audioStart: 0, audioSec: 0, segments: [seg] }
}

/**
 * MP4-ün müddəti (ms) — moov/mvhd atomundan; faststart faylında moov əvvəldədir. Yararsızdırsa null.
 * (thumb_offset üçün: üz qabığı — bütün mətnin göründüyü son kadr.)
 */
function mp4DurationMs(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 16 || buf.toString('latin1', 4, 8) !== 'ftyp') return null
  const scan = (start, end, depth) => {
    let o = start
    while (o + 8 <= end) {
      let size = buf.readUInt32BE(o)
      const type = buf.toString('latin1', o + 4, o + 8)
      let hdr = 8
      if (size === 1) { if (o + 16 > end) return null; size = Number(buf.readBigUInt64BE(o + 8)); hdr = 16 } else if (size === 0) size = end - o
      if (size < hdr || o + size > end) return null
      if (type === 'moov' && depth === 0) return scan(o + hdr, o + size, 1)
      if (type === 'mvhd' && depth === 1) {
        const v = buf[o + hdr]
        const p = o + hdr + 4
        if (v === 1) { if (p + 28 > o + size) return null; const ts = buf.readUInt32BE(p + 16); const d = Number(buf.readBigUInt64BE(p + 20)); return ts ? Math.round((d * 1000) / ts) : null }
        if (p + 16 > o + size) return null
        const ts = buf.readUInt32BE(p + 8), d = buf.readUInt32BE(p + 12)
        return ts ? Math.round((d * 1000) / ts) : null
      }
      o += size
    }
    return null
  }
  return scan(0, buf.length, 0)
}

/** Caption-a "Tilavət: …" sətri (heşteqlərdən əvvəl); səssiz videoda əlavə edilmir. 2200-ü keçirsə — null. */
function reelCaption(base, audio, langs = ['az', 'en']) {
  if (!base) return null
  if (audio !== 'alafasy') return base
  const [L1, L2] = langs
  const lab = (L) => RECITATION[L] || RECITATION.az
  const line = L2 && L2 !== L1 && RECITATION[L2]
    ? `${lab(L1)} / ${lab(L2)}: ${RECITER.name[L1] || RECITER.name.az}`
    : `${lab(L1)}: ${RECITER.name[L1] || RECITER.name.az}`
  const i = base.lastIndexOf('\n\n')
  const out = i > 0 ? `${base.slice(0, i)}\n\n${line}${base.slice(i)}` : `${base}\n\n${line}`
  return out.length <= 2200 ? out : null
}

/**
 * Videonun zaman cədvəli (saniyə). audioSec — tilavətin uzunluğu (səssiz: 0), lines — ərəb sətirlərinin sayı,
 * words — tərcümədəki söz sayı. → { inkStart, inkEnd, audioStart, trStart, wordGap, trEnd, footStart, duration }
 * duration > REEL_MAX_SEC — bu ayə reel-ə sığmır (çağıran sıradakını götürür).
 */
function reelTimeline({ audioSec = 0, lines = 1, words = 0, minSec = REEL_MIN_SEC } = {}) {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
  const inkStart = 0.7
  const audioStart = audioSec > 0 ? 0.8 : 0
  const inkDur = audioSec > 0 ? clamp(audioSec * 0.8, 2.5, 20) : clamp(lines * 2, 2.5, 10)
  const inkEnd = inkStart + inkDur
  const trStart = inkEnd + 0.4
  const wordGap = words > 1 ? clamp(5 / words, 0.07, 0.3) : 0
  const trEnd = trStart + Math.max(0, words - 1) * wordGap + 0.5
  const footStart = trEnd + 0.2
  const end = Math.max(audioSec > 0 ? audioStart + audioSec + 1.5 : 0, footStart + 0.6 + 2.5)
  const duration = Math.round(Math.max(minSec, end) * 30) / 30
  return { inkStart, inkEnd, audioStart, trStart, wordGap, trEnd, footStart, duration }
}

/**
 * Passaj reel-inin zaman cədvəli (saniyə). ayahs — [{ audioSec, words }] (audioSec: o ayənin tilavəti; hamısı 0 — səssiz:
 * oxuma vaxtı tərcümənin söz sayından), opts: { lead, tail, xfade, minSec }.
 * → { duration, audioStart, audioSec, segments: [{ start, end, inkStart, inkEnd, trStart, wordGap, trEnd, settle, fadeOut }] }
 * Ayə i öz tilavəti başlayanda (start) yazılmağa başlayır, növbəti ayənin tilavəti başlayanda (end) artıq sönmüş olur
 * (fadeOut → end); son ayə sonadək qalır (üz qabığı — son saniyə). t=0-da 1-ci seqment aktivdir (güclü ilk kadr).
 * settle — bu andan fadeOut-a qədər kadr dəyişmir (renderdə keşlənir).
 */
function passageTimeline(ayahs, { lead = PASSAGE_LEAD_SEC, tail = PASSAGE_TAIL_SEC, xfade = PASSAGE_XFADE_SEC, minSec = REEL_MIN_SEC } = {}) {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x))
  const list = Array.isArray(ayahs) ? ayahs : []
  const voiced = list.some((x) => Number(x && x.audioSec) > 0)
  const durs = list.map((x) => (voiced ? Math.max(0.5, Number(x && x.audioSec) || 0) : clamp(Number((x && x.words) || 0) * 0.32 + 1.5, 4, 14)))
  const audioStart = voiced ? lead : 0.4
  const segments = []
  let at = audioStart
  for (let i = 0; i < durs.length; i++) {
    const d = durs[i]
    const words = Math.max(0, Number(list[i] && list[i].words) || 0)
    const start = i === 0 ? 0 : at
    const inkStart = i === 0 ? Math.max(0.1, audioStart - 0.1) : at + 0.05
    const inkDur = clamp(d * 0.55, 1, 16)
    const inkEnd = inkStart + inkDur
    const trStart = inkStart + Math.min(inkDur * 0.6, 6)
    const trSpan = clamp(d * 0.3, 0.5, 1.6)
    const wordGap = words > 1 ? clamp(trSpan / words, 0.03, 0.3) : 0
    const trEnd = trStart + Math.max(0, words - 1) * wordGap + 0.5
    at += d
    const last = i === durs.length - 1
    segments.push({ start, end: last ? null : at, inkStart, inkEnd, trStart, wordGap, trEnd, settle: Math.max(inkEnd + 0.7, trEnd + 0.1), fadeOut: last ? null : at - xfade })
  }
  const duration = Math.round(Math.max(minSec, at + tail) * 30) / 30
  if (segments.length) segments[segments.length - 1].end = duration
  return { duration, audioStart, audioSec: voiced ? Math.round((at - audioStart) * 1000) / 1000 : 0, segments }
}

module.exports = {
  REEL_MP4_RE, REEL_META_RE, REEL_MAX_BYTES, REEL_MIN_SEC, REEL_MAX_SEC, AUDIO_MODES, DEFAULT_REEL_TIME, REEL_POLL_SEC,
  RECITER, RECITATION, globalAyah, audioUrls, rotIndex, reelRef, parseReelTime, parseMeta, mp4DurationMs, reelCaption, reelTimeline,
  // passaj reel-i (2026-11-27)
  PASSAGE_MAX_SEC, PASSAGE_LEAD_SEC, PASSAGE_TAIL_SEC, PASSAGE_XFADE_SEC, REEL_LANGS, DEFAULT_REEL_LANG, REEL_PASSAGES, PASSAGE_TITLE,
  refOf, passageRef, isReelRef, trimPassage, reelTitle, parseReelLang, passageTimeline,
  // hədis / dua / ad videoları, temalar (2026-11-27)
  VIDEO_KINDS, TEXT_KINDS, VIDEO_MP4_RE, VIDEO_META_RE, TEXT_AUDIO_MODES, TEXT_MIN_SEC, TEXT_MAX_SEC, KIND_THEMES, themeForKind, videoBase,
  parseTextMeta, textTimeline,
}
