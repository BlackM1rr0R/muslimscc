// ═══════════════════════════════════════════════════════
// Sakit səs mənzərəsi (v6.9) — təbiət səsləri cihazda SİNTEZ olunur (Web Audio):
// heç bir səs faylı yüklənmir, musiqi yoxdur (yalnız küy + filtr + çırtıltı).
//   rain  — yağış: ağ küy (yüksək tezlik) + çəhrayı küy uğultusu + təsadüfi damcılar
//   wind  — külək: qəhvəyi küy, zolaq filtri yavaş "nəfəs alır"
//   sea   — dəniz: qəhvəyi küy dalğa kimi qalxıb enir + köpük xışıltısı
//   night — gecə: sakit külək fonu + iki cırcırama (qısa sinus impulsları)
// API: playAmbient(kind) · stopAmbient() · setAmbientVolume(0..1) · ambientKind()
// İlk çağırış istifadəçi toxunuşundan olmalıdır (brauzerin avtomatik səs qaydası).
// ═══════════════════════════════════════════════════════
export const AMBIENT_KINDS = ['rain', 'wind', 'sea', 'night']

let ctx = null
let master = null
let current = null   // { kind, nodes: [], timers: [], stop() }
let volume = 0.6
const listeners = new Set()
const emit = () => listeners.forEach(f => f(current?.kind || null))
export const onAmbientChange = (f) => { listeners.add(f); return () => listeners.delete(f) }
export const ambientKind = () => current?.kind || null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// Küy buferləri (2 s, dövri) — bir dəfə yaradılır
const buffers = {}
function noise(type) {
  if (buffers[type]) return buffers[type]
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    if (type === 'white') d[i] = w * 0.5
    else if (type === 'pink') {   // Paul Kellet
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926
    } else {                      // brown
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }
  }
  buffers[type] = buf
  return buf
}
function src(type) { const s = ctx.createBufferSource(); s.buffer = noise(type); s.loop = true; return s }
function filt(type, f, q = 0.7) { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b }
function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g }
function lfo(freq, depth, target) {
  const o = ctx.createOscillator(); o.frequency.value = freq
  const g = gain(depth); o.connect(g); g.connect(target); o.start(); return o
}

function build(kind) {
  const nodes = []
  const timers = []
  const out = gain(1)
  out.connect(master)
  const chain = (...ns) => { for (let i = 0; i < ns.length - 1; i++) ns[i].connect(ns[i + 1]); nodes.push(...ns); return ns[ns.length - 1] }
  const start = (s) => { s.start(); return s }

  if (kind === 'rain') {
    chain(start(src('white')), filt('highpass', 700), filt('lowpass', 7000), gain(0.22), out)
    chain(start(src('pink')), filt('lowpass', 900), gain(0.35), out)
    // Damcılar: təsadüfi qısa küy partlayışları
    const drop = () => {
      if (!ctx) return
      const t = ctx.currentTime + Math.random() * 0.05
      const s = src('white')
      const bp = filt('bandpass', 1800 + Math.random() * 3500, 6)
      const g = gain(0)
      s.connect(bp); bp.connect(g); g.connect(out)
      const a = 0.04 + Math.random() * 0.12
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
      s.start(t, Math.random()); s.stop(t + 0.07)
    }
    timers.push(setInterval(() => { for (let i = 0; i < 3; i++) if (Math.random() < 0.6) drop() }, 70))
  } else if (kind === 'wind') {
    const bp = filt('bandpass', 520, 0.9)
    const g = gain(0.5)
    chain(start(src('brown')), bp, g, out)
    nodes.push(lfo(0.07, 260, bp.frequency), lfo(0.11, 0.28, g.gain), lfo(0.023, 120, bp.frequency))
    chain(start(src('pink')), filt('highpass', 2500), gain(0.03), out)
  } else if (kind === 'sea') {
    const g = gain(0.45)
    chain(start(src('brown')), filt('lowpass', 850), g, out)
    nodes.push(lfo(0.085, 0.38, g.gain))
    const foam = gain(0.05)
    chain(start(src('white')), filt('highpass', 2200), filt('lowpass', 9000), foam, out)
    nodes.push(lfo(0.085, 0.045, foam.gain))
  } else if (kind === 'night') {
    const bp = filt('bandpass', 380, 0.8)
    const g = gain(0.16)
    chain(start(src('brown')), bp, g, out)
    nodes.push(lfo(0.05, 120, bp.frequency))
    // Cırcırama: sinus + impuls zərfi
    const cricket = (pitch, every, phase) => {
      const o = ctx.createOscillator(); o.frequency.value = pitch
      const env = gain(0)
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null
      o.connect(env)
      if (pan) { pan.pan.value = phase > 0.5 ? 0.6 : -0.5; env.connect(pan); pan.connect(out) } else env.connect(out)
      o.start(); nodes.push(o, env)
      const chirp = () => {
        if (!ctx) return
        let t = ctx.currentTime + 0.05
        const pulses = 3 + Math.floor(Math.random() * 2)
        for (let i = 0; i < pulses; i++) {
          env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(0.022, t + 0.006)
          env.gain.linearRampToValueAtTime(0, t + 0.022); t += 0.045
        }
      }
      timers.push(setTimeout(() => { chirp(); timers.push(setInterval(chirp, every)) }, phase * every))
    }
    cricket(4400, 900, 0.1)
    cricket(4750, 1150, 0.65)
  }
  return {
    kind,
    stop() {
      timers.forEach(t => { clearInterval(t); clearTimeout(t) })
      const t = ctx.currentTime
      out.gain.setValueAtTime(out.gain.value, t)
      out.gain.linearRampToValueAtTime(0, t + 0.6)
      setTimeout(() => { nodes.forEach(n => { try { n.stop?.() } catch { /* */ } try { n.disconnect() } catch { /* */ } }); out.disconnect() }, 700)
    },
  }
}

export function playAmbient(kind) {
  if (!AMBIENT_KINDS.includes(kind)) return false
  if (!audio()) return false
  if (current) current.stop()
  current = build(kind)
  const t = ctx.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(volume, t + 1.2)
  emit()
  return true
}

export function stopAmbient() {
  if (!current || !ctx) return
  current.stop()
  current = null
  emit()
}

export function setAmbientVolume(v) {
  volume = Math.max(0, Math.min(1, v))
  if (ctx && master && current) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.1)
}
export const ambientVolume = () => volume
