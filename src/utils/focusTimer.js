// ═══════════════════════════════════════════════════════
// "Quranla diqqət seansı" (/focus) — taymerin vəziyyət maşını (saf funksiyalar, React-sız)
//
// Vəziyyət: { phase: 'focus' | 'break', status: 'idle' | 'running' | 'paused', left, endsAt }
//   left   — fasilədə / gözləmədə qalan ms; endsAt — işləyəndə bitmə anı (epoch ms), qalan halda null.
// Qayda:
//   • diqqət bitəndə → "ayə fasiləsi" ÖZÜ başlayır (event: 'focusDone' — seans sayılır);
//   • fasilə bitəndə → yeni diqqət mərhələsi GÖZLƏYİR (status 'idle', event: 'breakDone').
//     İstifadəçi uzaqlaşıbsa seanslar özbaşına sayılmasın deyə növbəti diqqəti o özü başladır.
//   • Vərəq gizli olub uzun müddət sonra qayıdanda yalnız BİR keçid olur (fasilə indidən başlayır).
// tests/unit/focus-timer.test.js
// ═══════════════════════════════════════════════════════

export const FOCUS_MIN = { min: 5, max: 90, def: 25 }
export const BREAK_MIN = { min: 1, max: 30, def: 5 }
const MIN = 60000

const clampInt = (v, { min, max, def }) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def
}
export const clampFocus = (v) => clampInt(v, FOCUS_MIN)
export const clampBreak = (v) => clampInt(v, BREAK_MIN)

/** Mərhələnin uzunluğu (ms); cfg = { focus, brk } dəqiqə ilə */
export const phaseMs = (phase, cfg) => (phase === 'break' ? clampBreak(cfg?.brk) : clampFocus(cfg?.focus)) * MIN

export const initTimer = (cfg) => ({ phase: 'focus', status: 'idle', left: phaseMs('focus', cfg), endsAt: null })

/** Qalan vaxt (ms, ≥ 0) */
export function remaining(st, now = Date.now()) {
  if (!st) return 0
  if (st.status === 'running' && st.endsAt != null) return Math.max(0, st.endsAt - now)
  return Math.max(0, st.left)
}

/** Mərhələnin keçən hissəsi 0…1 (halqa üçün) */
export function progress(st, cfg, now = Date.now()) {
  const total = phaseMs(st?.phase, cfg)
  return total > 0 ? Math.min(1, Math.max(0, 1 - remaining(st, now) / total)) : 0
}

export function startTimer(st, now = Date.now()) {
  if (!st || st.status === 'running') return st
  const left = st.left > 0 ? st.left : 0
  return { ...st, status: 'running', endsAt: now + left }
}

export function pauseTimer(st, now = Date.now()) {
  if (!st || st.status !== 'running') return st
  return { ...st, status: 'paused', left: remaining(st, now), endsAt: null }
}

export const resetTimer = (cfg) => initTimer(cfg)

/** Ayarlar dəyişdi: işləməyən taymerdə cari mərhələnin uzunluğu yenilənir; işləyəndə toxunulmur */
export function applyConfig(st, cfg) {
  if (!st || st.status === 'running' || st.status === 'paused') return st
  return { ...st, left: phaseMs(st.phase, cfg) }
}

/** Fasiləni ötür (növbəti diqqətə keç) — istifadəçi seçimi */
export function skipBreak(st, cfg) {
  if (!st || st.phase !== 'break') return st
  return { phase: 'focus', status: 'idle', left: phaseMs('focus', cfg), endsAt: null }
}

/**
 * Saat döyüntüsü: vaxt çatıbsa mərhələ dəyişir.
 * → { state, event: null | 'focusDone' | 'breakDone' }
 */
export function tick(st, cfg, now = Date.now()) {
  if (!st || st.status !== 'running' || st.endsAt == null || now < st.endsAt) return { state: st, event: null }
  if (st.phase === 'focus') {
    const len = phaseMs('break', cfg)
    return { state: { phase: 'break', status: 'running', left: len, endsAt: now + len }, event: 'focusDone' }
  }
  return { state: { phase: 'focus', status: 'idle', left: phaseMs('focus', cfg), endsAt: null }, event: 'breakDone' }
}

/** ms → "MM:SS" (60 dəqiqədən çox — "H:MM:SS") */
export function clockText(ms) {
  const total = Math.max(0, Math.ceil((Number(ms) || 0) / 1000))
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  const p = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`
}
