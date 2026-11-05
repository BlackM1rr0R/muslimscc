// ═══════════════════════════════════════════════════════
// İnterfeys səsləri (istəyə görə; susmaya görə SÖNÜLÜ)
//
//   bead — təsbeh muncuğu "tıqqıltısı"      page — mushafda vərəq səsi
//   done — hədəf tamamlandı (yumşaq zəng)
//
// Səs faylı YOXDUR — hamısı WebAudio ilə sintez olunur (0 bayt trafik).
// Seçim: localStorage 'muslim_cc_sounds' = '1'. "Hərəkəti azalt"dan asılı deyil.
// AudioContext yalnız ilk istifadəçi jestində yaradılır (brauzer siyasəti).
// ═══════════════════════════════════════════════════════

export const SOUND_KEY = 'muslim_cc_sounds'
const EVT = 'qm-sounds-change'
let ctx = null

export function soundsOn() {
  try { return localStorage.getItem(SOUND_KEY) === '1' } catch { return false }
}
export function setSoundsOn(on) {
  try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch { /* */ }
  try { window.dispatchEvent(new Event(EVT)) } catch { /* */ }
  if (on) playSound('bead')     // açanda nümunə
}
export function onSoundsChange(fn) {
  const h = () => fn(soundsOn())
  window.addEventListener(EVT, h)
  window.addEventListener('storage', h)
  return () => { window.removeEventListener(EVT, h); window.removeEventListener('storage', h) }
}

function audio() {
  if (ctx) return ctx
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
  if (!AC) return null
  try { ctx = new AC() } catch { ctx = null }
  return ctx
}

function noiseBuffer(ac, seconds) {
  const len = Math.max(1, Math.floor(ac.sampleRate * seconds))
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  return buf
}

/** Səsi çal (söndürülübsə — heç nə). */
export function playSound(kind) {
  if (!soundsOn()) return
  const ac = audio()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume?.()
  const t = ac.currentTime
  const out = ac.createGain()
  out.connect(ac.destination)

  if (kind === 'bead') {
    // Taxta/daş muncuq: qısa rezonanslı "tık" — iki sinus + çox qısa küy
    out.gain.setValueAtTime(0.0001, t)
    out.gain.exponentialRampToValueAtTime(0.35, t + 0.004)
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    for (const [f, g] of [[1850, 0.6], [2950, 0.25]]) {
      const o = ac.createOscillator(), og = ac.createGain()
      o.type = 'sine'; o.frequency.setValueAtTime(f * (0.97 + Math.random() * 0.06), t)
      og.gain.value = g
      o.connect(og).connect(out); o.start(t); o.stop(t + 0.1)
    }
    const n = ac.createBufferSource(), bp = ac.createBiquadFilter()
    n.buffer = noiseBuffer(ac, 0.02); bp.type = 'bandpass'; bp.frequency.value = 4000; bp.Q.value = 2
    n.connect(bp).connect(out); n.start(t)
  } else if (kind === 'page') {
    // Kağız vərəq: süzgəcdən keçən küy, tezlik yuxarı "sürüşür"
    const n = ac.createBufferSource(), bp = ac.createBiquadFilter()
    n.buffer = noiseBuffer(ac, 0.45)
    bp.type = 'bandpass'; bp.Q.value = 0.8
    bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(3200, t + 0.32)
    out.gain.setValueAtTime(0.0001, t)
    out.gain.exponentialRampToValueAtTime(0.22, t + 0.06)
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.42)
    n.connect(bp).connect(out); n.start(t); n.stop(t + 0.45)
  } else if (kind === 'done') {
    // Yumşaq zəng: beşlik interval, uzun sönmə
    out.gain.setValueAtTime(0.0001, t)
    out.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
    out.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)
    for (const [f, g, dl] of [[660, 0.5, 0], [990, 0.35, 0.08], [1320, 0.15, 0.16]]) {
      const o = ac.createOscillator(), og = ac.createGain()
      o.type = 'sine'; o.frequency.value = f; og.gain.value = g
      o.connect(og).connect(out); o.start(t + dl); o.stop(t + 1.7)
    }
  }
}
