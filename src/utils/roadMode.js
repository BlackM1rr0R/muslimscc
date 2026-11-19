// ═══════════════════════════════════════════════════════
// "Yolda" rejimi (/on-the-road) — saf köməkçilər + yerli tərcihlər
//
//   road_mode_v1 { remind, speak, light, snd, s, a, d, c }
//     remind — namazdan neçə dəqiqə əvvəl xatırlatsın (0 — söndürülüb; standart 10)
//     speak  — "Səslə de": YALNIZ interfeys faktları (məs. "Əsrə 25 dəqiqə qalıb") nitq sintezi ilə.
//              Quran mətni HEÇ VAXT TTS ilə oxunmur — Quran həqiqi qiraət səsidir (utils/quranAudio).
//     light  — açıq ekran (standart: tünd); snd — zikr tıqqıltısı və zəng
//     s / a  — son dinlənən surə və ayə; d / c — seçilmiş zikr və onun sayı
//   Tərcihdir (sinxronda bu cihazınkı — utils/syncMergers). tests/unit/road-mode.test.js
// ═══════════════════════════════════════════════════════
import { AYAH_COUNTS } from './quranMap'

export const ROAD_KEY = 'road_mode_v1'
export const REMIND_CHOICES = [0, 5, 10, 15, 20, 30]
export const DEFAULT_ROAD = { remind: 10, speak: false, light: false, snd: true, s: 0, a: 0, d: 0, c: 0 }

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const safe = () => { try { return globalThis.localStorage } catch { return null } }

export function sanitizeRoad(v, dhikrCount = 100) {
  const o = isObj(v) ? v : {}
  const s = Number.isInteger(o.s) && o.s >= 1 && o.s <= 114 ? o.s : 0
  const a = s && Number.isInteger(o.a) && o.a >= 1 && o.a <= AYAH_COUNTS[s - 1] ? o.a : (s ? 1 : 0)
  return {
    remind: REMIND_CHOICES.includes(o.remind) ? o.remind : DEFAULT_ROAD.remind,
    speak: o.speak === true,
    light: o.light === true,
    snd: o.snd !== false,
    s, a,
    d: Number.isInteger(o.d) && o.d >= 0 && o.d < dhikrCount ? o.d : 0,
    c: Number.isInteger(o.c) && o.c >= 0 && o.c <= 100000 ? o.c : 0,
  }
}

export function readRoad(storage = safe()) {
  try { return sanitizeRoad(JSON.parse(storage?.getItem(ROAD_KEY) || 'null')) } catch { return { ...DEFAULT_ROAD } }
}
export function writeRoad(patch, storage = safe()) {
  const v = sanitizeRoad({ ...readRoad(storage), ...patch })
  try { storage?.setItem(ROAD_KEY, JSON.stringify(v)) } catch { /* yaddaş bağlıdır */ }
  return v
}

/**
 * "Davam et" nöqtəsi: əvvəl bu rejimdə son dinlənən yer, yoxdursa Quran oxuyucusunun
 * əlfəcini (quran_bookmark, utils/continueItems ilə eyni oxu) — yoxdursa null.
 */
export function resumePoint(road, storage = safe()) {
  if (road?.s) return { s: road.s, a: road.a || 1 }
  try {
    const bm = JSON.parse(storage?.getItem('quran_bookmark') || 'null')
    const s = Number(bm?.surah)
    if (!Number.isInteger(s) || s < 1 || s > 114) return null
    const a = Number(bm.ayah)
    return { s, a: Number.isInteger(a) && a >= 1 && a <= AYAH_COUNTS[s - 1] ? a : 1 }
  } catch { return null }
}

// ── Geri sayım ──
/** ms → { h, m, s } (mənfi — 0) */
export function countdownParts(ms) {
  const t = Math.max(0, Math.floor((Number(ms) || 0) / 1000))
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 }
}
/** İri rəqəmlər: "1:05:09" / "25:09" */
export function countdownClock(ms) {
  const { h, m, s } = countdownParts(ms)
  const p = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`
}
/** Səsli və qısa yazı üçün tam dəqiqələr (yuxarı yuvarlaq: 24:10 → 25) */
export const minutesLeft = (ms) => Math.max(0, Math.ceil((Number(ms) || 0) / 60000))

/**
 * Xatırlatma vaxtıdırmı? Hər namaz üçün BİR dəfə (firedKey — `${key}@${at}`).
 * next — usePrayerTimes().next ({ key, at }); lead — dəqiqə (0 — söndürülüb).
 */
export function reminderDue(next, now, lead, firedKey = '') {
  if (!next || !lead || !Number.isFinite(next.at)) return null
  const key = `${next.key}@${next.at}`
  if (key === firedKey) return null
  const left = next.at - now
  return left > 0 && left <= lead * 60000 ? key : null
}

// ── Səsli faktlar (nitq sintezi) ──
const BCP47 = { az: 'az-AZ', en: 'en', ru: 'ru-RU', ar: 'ar-SA', tr: 'tr-TR' }
const norm = (l) => String(l || '').toLowerCase().replace('_', '-')
/** Dil üçün səs: tam kod → dil prefiksi; yoxdursa null (başqa dilin səsi ilə OXUNMUR) */
export function voiceFor(voices, lang) {
  if (!Array.isArray(voices) || !voices.length || !lang) return null
  const want = norm(BCP47[lang] || lang)
  const base = want.split('-')[0]
  return voices.find((v) => norm(v.lang) === want)
    || voices.find((v) => norm(v.lang).split('-')[0] === base && v.localService)
    || voices.find((v) => norm(v.lang).split('-')[0] === base)
    || null
}

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)
export const canSpeakApi = () => !!synth() && typeof window.SpeechSynthesisUtterance === 'function'
export const voicesNow = () => { try { return synth()?.getVoices?.() || [] } catch { return [] } }

/** Qısa interfeys faktını de (səs yoxdursa — heç nə, false) */
export function speakFact(text, lang) {
  const s = synth()
  const voice = voiceFor(voicesNow(), lang)
  if (!s || !voice || !text) return false
  try {
    s.cancel()
    const u = new window.SpeechSynthesisUtterance(String(text))
    try { u.voice = voice } catch { /* bəzi brauzerlər yalnız öz səs obyektini qəbul edir */ }
    u.lang = voice.lang
    u.rate = 1
    s.speak(u)
    return true
  } catch { return false }
}
