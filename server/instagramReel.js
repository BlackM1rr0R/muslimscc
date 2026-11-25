// ═══════════════════════════════════════════════════════════════════════
// Instagram REEL — günün ayəsinin videosu (docs/INSTAGRAM.md → "Reels"): server və CI renderi üçün ortaq SAF köməkçilər
//
// • Video serverdə ÇƏKİLMİR (1 GB server): GitHub Actions (.github/workflows/ig-reel.yml) scripts/ig-reel/render.mjs ilə
//   MP4 hazırlayır və ci-gate.sh "ig-reel <tarix> <ayə> <səs>" ilə api həcminə yazır:
//     /data/ig-cards/<YYYY-MM-DD>-reel.mp4  +  <YYYY-MM-DD>-reel.json ({"ref":"33:3","audio":"alafasy"|"none"})
//   server/instagram.js (IG_REELS=1) IG_REEL_TIME-da (susmaya görə 18:00, Asia/Baku) media_type=REELS ilə dərc edir.
// • Ayə seçimi 08:00 ayə yuvası ilə EYNİ (rotIndex, addım 37): k=0 — günün ayəsi; tilavət > 45 s və ya video sığmırsa
//   sıradakı (k+1). Mətn alquran.cloud-dan, dəyişdirilmir (yalnız kartdakı kimi dayanma işarəsi sözə bitişik çəkilir).
// • Səs: saytın Quran səsi ilə eyni mənbə və qari (src/utils/quranAudio.js → RECITERS[0] "alafasy").
// • Bu modul şəbəkəyə, fayla, sharp-a toxunmur — test olunur (tests/unit/server-instagram-reel.test.js).
// ═══════════════════════════════════════════════════════════════════════
'use strict'

const dailyAyah = require('./daily-ayah')

const REEL_MP4_RE = /^(\d{4}-\d{2}-\d{2})-reel\.mp4$/
const REEL_META_RE = /^(\d{4}-\d{2}-\d{2})-reel\.json$/
const REEL_MAX_BYTES = 15 * 1024 * 1024
const REEL_MIN_SEC = 15
const REEL_MAX_SEC = 45
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

/** HH:MM (IG_REEL_TIME) → normallaşdırılmış dəyər; yararsızdırsa 18:00. */
function parseReelTime(raw) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(raw || '').trim())
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return DEFAULT_REEL_TIME
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

/** <tarix>-reel.json → { ref, audio } | null — yalnız siyahıdakı ayə və icazəli səs rejimi. */
function parseMeta(raw) {
  let o
  try { o = typeof raw === 'string' || Buffer.isBuffer(raw) ? JSON.parse(String(raw)) : raw } catch { return null }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null
  const ref = typeof o.ref === 'string' ? o.ref : ''
  if (!dailyAyah.AYAH_REFS.includes(ref) || !dailyAyah.parseRef(ref)) return null
  const audio = AUDIO_MODES.includes(o.audio) ? o.audio : null
  if (!audio) return null
  return { ref, audio }
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

module.exports = {
  REEL_MP4_RE, REEL_META_RE, REEL_MAX_BYTES, REEL_MIN_SEC, REEL_MAX_SEC, AUDIO_MODES, DEFAULT_REEL_TIME, REEL_POLL_SEC,
  RECITER, RECITATION, globalAyah, audioUrls, rotIndex, reelRef, parseReelTime, parseMeta, mp4DurationMs, reelCaption, reelTimeline,
}
