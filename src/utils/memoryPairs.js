// ═══════════════════════════════════════════════════════
// Yaddaş cütləri oyununun saf məntiqi (components/MemoryPairs.jsx)
//
// Göyərtə: N/2 cüt toxumla seçilir və qarışdırılır (deterministik).
// Gediş: iki kart açılır = 1 gediş; cütdürsə "tapıldı", deyilsə komponent
// qısa fasilədən sonra settle() ilə bağlayır. Ən yaxşı nəticə (ən az gediş)
// mövzu + ölçü üzrə localStorage-da saxlanır.
// ═══════════════════════════════════════════════════════
import { mulberry32, shuffle } from './crossword'
// Məxfi rejimdə localStorage-a müraciətin özü xəta atır — default parametr try-dan kənardadır
const safeStorage = () => { try { return globalThis.localStorage } catch { return null } }


export const MEMORY_SIZES = [8, 12, 16]
export const MEMORY_BEST_KEY = 'muslim_cc_memory_best'

/**
 * pairs: [{ id, a: { text, lang }, b: { text, lang } }]
 * → kartlar: [{ pair, side: 'a' | 'b', text, lang }]
 */
export function buildDeck(pairs, size, seed = 1) {
  const n = Math.max(1, Math.floor(size / 2))
  const rand = mulberry32(seed)
  // Eyni mətnli kart iki cütdə olmasın (çaşqınlıq yaratmasın)
  const used = new Set()
  const chosen = []
  for (const p of shuffle(pairs, rand)) {
    if (chosen.length >= n) break
    if (used.has(p.a.text) || used.has(p.b.text)) continue
    used.add(p.a.text); used.add(p.b.text)
    chosen.push(p)
  }
  const cards = chosen.flatMap(p => [
    { pair: p.id, side: 'a', text: p.a.text, lang: p.a.lang },
    { pair: p.id, side: 'b', text: p.b.text, lang: p.b.lang },
  ])
  return shuffle(cards, rand)
}

export function newGame(cards) {
  return { cards, open: [], matched: [], moves: 0 }
}

/** Kartı aç. İki açıq (cüt olmayan) kart varkən yeni kart açılmır — əvvəl settle(). */
export function flip(state, i) {
  if (i < 0 || i >= state.cards.length) return state
  if (state.open.length >= 2 || state.open.includes(i)) return state
  if (state.matched.includes(state.cards[i].pair)) return state
  const open = [...state.open, i]
  if (open.length < 2) return { ...state, open }
  const moves = state.moves + 1
  const [x, y] = open
  if (state.cards[x].pair === state.cards[y].pair) {
    return { ...state, open: [], matched: [...state.matched, state.cards[x].pair], moves }
  }
  return { ...state, open, moves }
}

/** Cüt olmayan iki açıq kartı bağla */
export function settle(state) {
  return state.open.length === 2 ? { ...state, open: [] } : state
}

export const isWon = (state) => state.cards.length > 0 && state.matched.length * 2 === state.cards.length

export const bestKey = (theme, size) => `${theme}-${size}`

/** Ən yaxşı nəticələr xəritəsini yenilə → { map, improved } */
export function updateBest(map, k, moves) {
  const prev = map?.[k]
  if (typeof prev === 'number' && prev <= moves) return { map: map || {}, improved: false }
  return { map: { ...(map || {}), [k]: moves }, improved: true }
}

export function readBest(storage = safeStorage()) {
  try {
    const v = JSON.parse(storage?.getItem(MEMORY_BEST_KEY) || '{}')
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch { return {} }
}

export function writeBest(map, storage = safeStorage()) {
  try { storage?.setItem(MEMORY_BEST_KEY, JSON.stringify(map)) } catch { /* yaddaş bağlıdır */ }
}
