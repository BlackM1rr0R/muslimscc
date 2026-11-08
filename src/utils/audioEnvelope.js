// ═══════════════════════════════════════════════════════
// Səs zərfi (v5.8) — Quran Zen vizualizatoru (components/quran/QuranZen)
//
//   await ayahEnvelope(url) → Float32Array (saniyədə FPS dəyər, 0…1) | null
//
// • Faylı AYRICA yükləyib (CORS lazımdır — verses.quran.com) OfflineAudioContext ilə
//   açır və RMS zərfini hesablayır. Pleyerin öz səs elementinə TOXUNULMUR (Web Audio-ya
//   qoşulmur) — iPhone-da kilid ekranında oxutma pozulmasın.
// • Son 12 fayl yaddaşda saxlanır.
// ═══════════════════════════════════════════════════════
export const FPS = 30
const cache = new Map()

export function rmsEnvelope(data, sampleRate, fps = FPS) {
  const win = Math.max(1, Math.round(sampleRate / fps))
  const n = Math.ceil(data.length / win)
  const out = new Float32Array(n)
  let max = 1e-6
  for (let k = 0; k < n; k++) {
    let s = 0
    const a = k * win, b = Math.min(data.length, a + win)
    for (let i = a; i < b; i++) s += data[i] * data[i]
    const v = Math.sqrt(s / Math.max(1, b - a))
    out[k] = v; if (v > max) max = v
  }
  for (let k = 0; k < n; k++) out[k] = Math.min(1, out[k] / max)
  return out
}

export async function ayahEnvelope(url) {
  if (!url || typeof window === 'undefined') return null
  if (cache.has(url)) return cache.get(url)
  try {
    const r = await fetch(url, { mode: 'cors' })
    if (!r.ok) return null
    const buf = await r.arrayBuffer()
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext
    if (!Ctx) return null
    const ctx = new Ctx(1, 22050, 22050)
    const audio = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p?.then) p.then(res, rej) })
    const env = rmsEnvelope(audio.getChannelData(0), audio.sampleRate)
    cache.set(url, env)
    if (cache.size > 12) cache.delete(cache.keys().next().value)
    return env
  } catch { return null }
}
