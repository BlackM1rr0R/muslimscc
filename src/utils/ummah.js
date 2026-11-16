// ═══════════════════════════════════════════════════════
// Ümmətin sayğacı — klient (server/ummah.js)
//   ummahAdd(kind, n) — toxunuşları yığır, 4 s-dən bir (və ya vərəq gizlənəndə) bir sorğu ilə göndərir
//   fetchUmmah()      — { day, today: { salawat, dhikr, juz }, total: {…} }
// Anonimdir: yalnız növ və say. Yalnız muslims.cc-də göndərilir (testdə/önizləmədə yox,
// ?ummah=1 ilə məcburi). İstifadəçi söndürə bilər: localStorage 'muslim_cc_ummah_off' = '1'.
// ═══════════════════════════════════════════════════════
export const UMMAH_OFF_KEY = 'muslim_cc_ummah_off'
const KINDS = ['salawat', 'dhikr', 'juz']
const FLUSH_MS = 4000
const pending = { salawat: 0, dhikr: 0, juz: 0 }
let timer = 0

const enabled = () => {
  if (typeof window === 'undefined') return false
  try { if (localStorage.getItem(UMMAH_OFF_KEY) === '1') return false } catch { /* */ }
  return /^(www\.)?muslims\.cc$/.test(window.location.hostname) || /[?&]ummah=1\b/.test(window.location.search)
}

function send(kind, n) {
  const body = JSON.stringify({ kind, n })
  fetch('/api/ummah', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
}

export function flushUmmah() {
  clearTimeout(timer); timer = 0
  for (const k of KINDS) {
    let n = pending[k]
    pending[k] = 0
    // server bir sorğuda ən çox 100 qəbul edir
    while (n > 0) { const c = Math.min(n, 100); send(k, c); n -= c }
  }
  try { window.dispatchEvent(new Event('qm-ummah')) } catch { /* */ }
}

export function ummahAdd(kind, n = 1) {
  if (!KINDS.includes(kind) || !enabled()) return
  pending[kind] += n
  if (!timer) timer = setTimeout(flushUmmah, FLUSH_MS)
  if (kind !== 'juz') sendHere()
}

// ── "İndi zikr edənlər" xəritəsi (server/ummah.js → /api/ummah/here) ──
// Yalnız istifadəçi namaz vaxtları üçün ÖZ şəhərini seçibsə (standart yer göndərilmir);
// koordinat 1 rəqəmə yuvarlaqlaşır, server onu 2°-lik xanaya salır. 2 dəqiqədə ən çox bir dəfə.
const HERE_EVERY_MS = 2 * 60 * 1000
let hereAt = 0
async function sendHere() {
  const t = Date.now()
  if (t - hereAt < HERE_EVERY_MS) return
  hereAt = t
  try {
    const { getPrayerLocation } = await import('./prayerLocation')
    const loc = getPrayerLocation()
    if (!loc || loc.isDefault || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return
    const body = JSON.stringify({ lat: Math.round(loc.lat * 10) / 10, lng: Math.round(loc.lng * 10) / 10 })
    fetch('/api/ummah/here', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
  } catch { /* yer yoxdur */ }
}

/** Son 10 dəqiqədə zikr edilən xanalar: [{ lat, lng, n }] */
export async function fetchUmmahHere() {
  const r = await fetch('/api/ummah/here', { headers: { 'Cache-Control': 'no-cache' } })
  if (!r.ok) throw new Error(String(r.status))
  const d = await r.json()
  return Array.isArray(d?.cells) ? d.cells.filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng) && c.n > 0) : []
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) flushUmmah() })
}

export async function fetchUmmah() {
  const r = await fetch('/api/ummah', { headers: { 'Cache-Control': 'no-cache' } })
  if (!r.ok) throw new Error(String(r.status))
  return r.json()
}

/** Yığılıb hələ göndərilməyən (ekranda dərhal göstərmək üçün) */
export const pendingUmmah = () => ({ ...pending })
