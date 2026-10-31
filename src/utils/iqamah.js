// ═══════════════════════════════════════════════════════
// iqamah — məscid ekranı (/mosque-tv) üçün təmiz funksiyalar
//
// • İqamə vaxtı hər fərz namaz üçün İKİ yolla verilir:
//     ədəd   (10)      — azandan N dəqiqə sonra
//     'HH:MM' ('13:30') — sabit saat (azandan tez olarsa azan vaxtı götürülür)
// • Ekranın bütün ayarları URL-ə yazıla bilir ki, televizorda sadəcə link
//   açılsın:  ?city=Baku&iq=20,10,10,5,10&jumua=13:00&name=…&lang=az&theme=dark
// • React, DOM, localStorage YOXDUR — tests/unit/iqamah.test.js yoxlayır.
// ═══════════════════════════════════════════════════════

export const IQAMAH_PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']

// Ümumi məscid təcrübəsi: sübh 20, zöhr 10, əsr 10, məğrib 5, işa 10 dəqiqə
export const DEFAULT_IQAMAH = [20, 10, 10, 5, 10]

export const MAX_OFFSET_MIN = 180
export const ADHAN_HOLD_SEC = 120 // "Azan vaxtı" ekranı neçə saniyə qalır

export const CONFIG_LANGS = ['az', 'en', 'ru', 'ar', 'tr']
export const CONFIG_THEMES = ['light', 'dark']

export const DEFAULT_CONFIG = Object.freeze({
  city: 'Baku',
  iq: DEFAULT_IQAMAH.slice(),
  jumua: '',
  name: '',
  lang: 'az',
  theme: 'dark',
  hideSeconds: false,
  beep: false,
})

const pad2 = (n) => String(n).padStart(2, '0')

/** 'H:MM' / 'HH:MM' → gecə yarısından dəqiqə (0…1439); səhvdirsə null. */
export function parseTime(v) {
  const m = String(v ?? '').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** Dəqiqə → 'HH:MM' (24 saatdan keçəndə dövr edir). */
export function formatTime(totalMin) {
  if (!Number.isFinite(totalMin)) return ''
  const x = ((Math.round(totalMin) % 1440) + 1440) % 1440
  return `${pad2(Math.floor(x / 60))}:${pad2(x % 60)}`
}

/**
 * Bir iqamə qaydasını yoxla: 0…180 tam ədəd (dəqiqə) və ya 'HH:MM'.
 * Səhvdirsə null.
 */
export function parseIqamahRule(v) {
  if (typeof v === 'number') {
    return Number.isInteger(v) && v >= 0 && v <= MAX_OFFSET_MIN ? v : null
  }
  const s = String(v ?? '').trim()
  if (/^\d{1,3}$/.test(s)) return parseIqamahRule(Number(s))
  const t = parseTime(s)
  return t == null ? null : formatTime(t)
}

/** Azan + qayda → iqamə 'HH:MM'. Azan yoxdursa ''. */
export function computeIqamah(adhan, rule) {
  const a = parseTime(adhan)
  if (a == null) return ''
  const r = parseIqamahRule(rule)
  if (r == null) return formatTime(a)
  if (typeof r === 'number') return formatTime(a + r)
  // Sabit vaxt azandan əvvəl ola bilməz (mövsüm dəyişəndə köhnə ayar qalıbsa)
  const f = parseTime(r)
  return formatTime(Math.max(a, f))
}

/**
 * Günün azan vaxtları + 5 qayda → { fajr:'HH:MM', dhuhr, asr, maghrib, isha }.
 * timings — { fajr:'05:10', … } (sunrise nəzərə alınmır).
 */
export function computeIqamahTimes(timings, rules = DEFAULT_IQAMAH) {
  const out = {}
  IQAMAH_PRAYERS.forEach((key, i) => {
    out[key] = computeIqamah(timings?.[key], rules?.[i] ?? DEFAULT_IQAMAH[i])
  })
  return out
}

/**
 * İndiki an üçün tam ekran vəziyyəti.
 * list — [{ key, adhan:'HH:MM', iqamah:'HH:MM' }] (yalnız fərzlər)
 * nowSec — gecə yarısından saniyə (şəhərin saatı ilə)
 * Qaytarır:
 *   { key, phase:'adhan', remaining }  — azandan sonrakı ilk holdSec saniyə
 *   { key, phase:'iqamah', remaining } — iqaməyə qədər geri sayım
 *   null                               — adi ekran
 */
export function findPhase(nowSec, list, holdSec = ADHAN_HOLD_SEC) {
  if (!Number.isFinite(nowSec) || !Array.isArray(list)) return null
  for (const p of list) {
    const a = parseTime(p?.adhan)
    if (a == null) continue
    const aSec = a * 60
    const iqMin = parseTime(p.iqamah)
    const iSec = iqMin == null ? aSec : Math.max(aSec, iqMin * 60)
    if (nowSec >= aSec && nowSec < aSec + holdSec) {
      return { key: p.key, phase: 'adhan', remaining: aSec + holdSec - nowSec }
    }
    if (nowSec >= aSec + holdSec && nowSec < iSec) {
      return { key: p.key, phase: 'iqamah', remaining: iSec - nowSec }
    }
  }
  return null
}

/** Saniyə → 'mm:ss' (bir saatdan çoxdursa 'h:mm:ss'). */
export function formatCountdown(sec) {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h ? `${h}:${pad2(m)}:${pad2(r)}` : `${pad2(m)}:${pad2(r)}`
}

// ── Ayarlar: yoxlama, URL ↔ obyekt ───────────────────

// Yazılarkən sondakı boşluq silinməsin deyə burada yalnız baş tərəf kəsilir
// (URL-dən oxuyanda və URL-ə yazanda tam trim edilir)
const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').replace(/^\s+/, '').slice(0, max)
const truthy = (v) => v === true || v === 1 || /^(1|true|yes|on)$/i.test(String(v ?? ''))

/** 5 qaydanın siyahısı: '10,10,13:30,5,10' və ya massiv; çatmayan/səhv → standart. */
export function parseIqamahList(v) {
  const parts = Array.isArray(v) ? v : String(v ?? '').split(',')
  return IQAMAH_PRAYERS.map((_, i) => {
    const r = parseIqamahRule(parts[i])
    return r == null ? DEFAULT_IQAMAH[i] : r
  })
}

/**
 * Qismən ayar obyektini tam və təhlükəsiz ayara çevir (çatmayan → standart).
 */
export function normalizeConfig(partial = {}) {
  const p = partial || {}
  const lang = CONFIG_LANGS.includes(p.lang) ? p.lang : DEFAULT_CONFIG.lang
  const theme = CONFIG_THEMES.includes(p.theme) ? p.theme : DEFAULT_CONFIG.theme
  const jt = parseTime(p.jumua)
  return {
    city: clean(p.city, 64).trim() || DEFAULT_CONFIG.city,
    iq: p.iq == null ? DEFAULT_IQAMAH.slice() : parseIqamahList(p.iq),
    jumua: jt == null ? '' : formatTime(jt),
    name: clean(p.name, 80),
    lang,
    theme,
    hideSeconds: truthy(p.hideSeconds),
    beep: truthy(p.beep),
  }
}

/**
 * URL sorğusunu oxu → YALNIZ URL-də olan sahələr (qismən obyekt).
 * Qəbul edir: '?city=…', 'city=…', URLSearchParams.
 * Əlavə ekran rejimləri: compact=1, kiosk=1 (ayar deyil, yalnız görünüş).
 */
export function parseConfig(input) {
  let sp
  if (input instanceof URLSearchParams) sp = input
  else sp = new URLSearchParams(String(input ?? '').replace(/^\?/, ''))
  const out = {}
  if (sp.has('city')) out.city = clean(sp.get('city'), 64).trim()
  if (sp.has('iq')) out.iq = parseIqamahList(sp.get('iq'))
  if (sp.has('jumua')) {
    const t = parseTime(sp.get('jumua'))
    out.jumua = t == null ? '' : formatTime(t)
  }
  if (sp.has('name')) out.name = clean(sp.get('name'), 80).trim()
  if (CONFIG_LANGS.includes(sp.get('lang'))) out.lang = sp.get('lang')
  if (CONFIG_THEMES.includes(sp.get('theme'))) out.theme = sp.get('theme')
  if (sp.has('hidesec')) out.hideSeconds = truthy(sp.get('hidesec'))
  if (sp.has('beep')) out.beep = truthy(sp.get('beep'))
  if (sp.has('compact')) out.compact = truthy(sp.get('compact'))
  if (sp.has('kiosk')) out.kiosk = truthy(sp.get('kiosk'))
  return out
}

/** URL-də ayar sahəsi varmı (compact/kiosk sayılmır). */
export function hasConfigParams(input) {
  const p = parseConfig(input)
  return ['city', 'iq', 'jumua', 'name', 'lang', 'theme', 'hideSeconds', 'beep'].some(k => k in p)
}

/**
 * Ayar → URL sorğusu ('?' olmadan). Boş ad/cümə və söndürülmüş bayraqlar yazılmır.
 * extra — { compact:true, kiosk:true } kimi görünüş bayraqları.
 */
export function serializeConfig(cfg, extra = {}) {
  const c = normalizeConfig(cfg)
  const sp = new URLSearchParams()
  sp.set('city', c.city)
  sp.set('iq', c.iq.join(','))
  if (c.jumua) sp.set('jumua', c.jumua)
  if (c.name.trim()) sp.set('name', c.name.trim())
  sp.set('lang', c.lang)
  sp.set('theme', c.theme)
  if (c.hideSeconds) sp.set('hidesec', '1')
  if (c.beep) sp.set('beep', '1')
  if (extra.compact) sp.set('compact', '1')
  if (extra.kiosk) sp.set('kiosk', '1')
  // URLSearchParams vergülü və iki nöqtəni kodlayır — link oxunaqlı qalsın
  return sp.toString().replace(/%2C/gi, ',').replace(/%3A/gi, ':')
}

/** Ardıcıl qismən ayarları birləşdir (sonrakı üstündür) və tam ayar qaytar. */
export function mergeConfig(...parts) {
  const merged = {}
  for (const p of parts) {
    if (!p) continue
    for (const k of Object.keys(p)) if (p[k] !== undefined) merged[k] = p[k]
  }
  return normalizeConfig(merged)
}
