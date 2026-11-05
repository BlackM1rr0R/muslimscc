// Əməllərin səması (components/MuhasabahSky.jsx) — deterministik ulduz mövqeləri (saf; tests/unit/muhasabah-sky.test.js)
export const W = 320, H = 230
// 8 bürcün mərkəzi (səmaya səpələnmiş)
export const ANCHORS = [[62, 52], [160, 40], [262, 58], [42, 140], [128, 120], [212, 128], [290, 160], [150, 196]]

/** Sadə deterministik hash → 0…1 */
export function hash01(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 100000) / 100000
}

const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

export function skyStars(entries, items, today, days = 30) {
  const out = items.map(() => [])
  for (let k = days - 1; k >= 0; k--) {
    const date = addDays(today, -k)
    const c = entries[date]?.c || []
    items.forEach((id, i) => {
      if (!c.includes(id)) return
      const a = hash01(`${date}|${id}`) * Math.PI * 2, r = 10 + hash01(`${id}|${date}`) * 34
      const [ax, ay] = ANCHORS[i % ANCHORS.length]
      out[i].push({ date, x: Math.max(6, Math.min(W - 6, ax + Math.cos(a) * r)), y: Math.max(6, Math.min(H - 6, ay + Math.sin(a) * r * 0.8)), age: k })
    })
  }
  return out
}

