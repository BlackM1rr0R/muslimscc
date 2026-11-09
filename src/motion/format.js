// ═══════════════════════════════════════════════════════
// Motion üçün SAF köməkçilər (tests/unit/motion-format.test.js):
//   formatTicker — NumberTicker rəqəmi dilə görə (Intl; ərəbcədə latın rəqəmləri)
//   tickerFrames — sayğac yolunun kadrları (test və SSR üçün)
//   spherePoints / projectPoint — DottedGlobe (Fibonacci sferası, ortoqrafik proyeksiya)
//   splitText — TextEffect, flowPath — BackgroundPaths
// ═══════════════════════════════════════════════════════

// viz/format.js ilə eyni lokal xəritəsi (ərəbcədə latın rəqəmləri — saytın qalan hissəsi kimi)
const LOCALES = { az: 'az-Latn-AZ', en: 'en-GB', ru: 'ru-RU', ar: 'ar-u-nu-latn', tr: 'tr-TR' }
export const localeFor = (lang) => LOCALES[lang] || (typeof lang === 'string' && /^[a-z]{2,3}$/.test(lang) ? lang : 'en-GB')

const cache = new Map()
function nf(lang, decimals, compact) {
  const key = `${lang}|${decimals}|${compact ? 1 : 0}`
  let f = cache.get(key)
  if (!f) {
    try {
      f = new Intl.NumberFormat(localeFor(lang), compact
        ? { notation: 'compact', maximumFractionDigits: 1 }
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    } catch {
      f = new Intl.NumberFormat('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    }
    cache.set(key, f)
  }
  return f
}

/**
 * Rəqəmi dilə görə yaz. decimals — onluq sayı (sayğac ortasında da sabit — en "titrəmir").
 * prefix/suffix olduğu kimi qoşulur ("+", "%"). Qeyri-rəqəm → "".
 */
export function formatTicker(value, { lang = 'az', decimals = 0, prefix = '', suffix = '', compact = false } = {}) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ''
  const p = 10 ** decimals
  const v = Math.round(n * p) / p
  return `${prefix}${nf(lang, decimals, compact).format(v)}${suffix}`
}

/** from → to arası `steps` kadr (ease-out), son kadr həmişə dəqiq `to`. */
export function tickerFrames(from, to, steps = 10, decimals = 0) {
  const out = []
  const p = 10 ** decimals
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const e = 1 - (1 - t) ** 3
    out.push(i === steps ? to : Math.round((from + (to - from) * e) * p) / p)
  }
  return out
}

// ── Qlobus ──
const RAD = Math.PI / 180

/** Sferada bərabər paylanmış n nöqtə (Fibonacci) — {lat, lon} dərəcə ilə */
export function spherePoints(n = 600) {
  const pts = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(1, n - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = golden * i
    const x = Math.cos(th) * r
    const z = Math.sin(th) * r
    pts.push({ lat: Math.asin(y) / RAD, lon: Math.atan2(z, x) / RAD })
  }
  return pts
}

/**
 * Ortoqrafik proyeksiya: mərkəz uzunluğu `rotLon`, əyilmə `tilt` (dərəcə).
 * Qaytarır { x, y } (−1…1, y aşağı müsbət) və z (>0 — görünən yarımkürə).
 */
export function projectPoint(lat, lon, rotLon = 0, tilt = 0) {
  const la = lat * RAD
  const lo = (lon - rotLon) * RAD
  const t = tilt * RAD
  const x = Math.cos(la) * Math.sin(lo)
  const y0 = Math.sin(la)
  const z0 = Math.cos(la) * Math.cos(lo)
  const y = y0 * Math.cos(t) - z0 * Math.sin(t)
  const z = y0 * Math.sin(t) + z0 * Math.cos(t)
  return { x, y: -y, z }
}

/** Məkkə (Kəbə) — DottedGlobe-un susmaya görə vurğulanan nöqtəsi */
export const MAKKAH = Object.freeze({ lat: 21.4225, lon: 39.8262 })

// ── TextEffect: mətni hissələrə böl (boşluqlar ayrıca hissədir) ──
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/
/** Ərəbcə mətn hərf-hərf BÖLÜNMƏZ (birləşən hərflər qırılar) — per="char" onda "word" olur */
export function splitText(text, per = 'word') {
  const s = String(text ?? '')
  if (per === 'char' && !ARABIC.test(s)) return [...s].map(ch => (ch === ' ' ? ' ' : ch))
  return s.split(/(\s+)/).filter(Boolean)
}

// ── BackgroundPaths: i-ci axın xəttinin yolu (1200×h sahə), dalğa hündürlüyü i ilə dəyişir ──
export function flowPath(i, n, h = 400) {
  const t = n > 1 ? i / (n - 1) : 0.5
  const y = Math.round(h * (0.12 + 0.76 * t))
  const amp = Math.round(28 + 70 * Math.sin(Math.PI * t))
  const k = i % 2 ? 1 : -1
  return `M-80 ${y} C260 ${y - amp * k} 520 ${y + amp * k} 760 ${y} S1120 ${y - Math.round(amp * 0.6) * k} 1280 ${y}`
}
