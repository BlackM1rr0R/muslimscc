// Miras ailə ağacı (components/InheritanceTree.jsx) — saf düzülüş (React-sız; tests/unit/family-tree.test.js)
//
// Nəsillər (sıra): −2 babalar/nənələr · −1 valideynlər, əmilər · 0 vəfat edən,
// həyat yoldaşı, qardaş-bacılar, əmioğlular · +1 övlad, qardaşoğulları · +2 oğul nəvələri.
// Sırada: ata tərəfi solda, ana tərəfi sağda; vəfat edən 0-cı sırada ortadadır.

export const GEN = {
  paternalGrandfather: -2, paternalGrandmother: -2, maternalGrandmother: -2,
  fullUncles: -1, paternalUncles: -1, father: -1, mother: -1,
  fullCousins: 0, paternalCousins: 0, fullBrothers: 0, fullSisters: 0, paternalBrothers: 0, paternalSisters: 0,
  maternalBrothers: 0, maternalSisters: 0, husband: 0, wife: 0,
  sons: 1, daughters: 1, fullNephews: 1, paternalNephews: 1,
  sonsSons: 2, sonsDaughters: 2,
}
// Sıra daxilində ardıcıllıq (kiçik — solda). 0-cı sırada vəfat edən = 50
const ORDER = {
  paternalGrandfather: 10, paternalGrandmother: 20, maternalGrandmother: 80,
  fullUncles: 5, paternalUncles: 8, father: 40, mother: 60,
  fullCousins: 2, paternalCousins: 4, paternalBrothers: 20, paternalSisters: 22, fullBrothers: 30, fullSisters: 32,
  maternalBrothers: 70, maternalSisters: 72, husband: 60, wife: 60,
  fullNephews: 10, paternalNephews: 12, sons: 45, daughters: 55,
  sonsSons: 45, sonsDaughters: 55,
}
export const ME = '__deceased'

/**
 * @param {string[]} keys — seçilmiş varislərin açarları
 * @returns {{ rows: number, nodes: Array<{ key, gen, row, x, y }> }}  x, y — 0…100 (%)
 */
export function treeLayout(keys) {
  const list = [...new Set(keys)].filter(k => k in GEN)
  const gens = new Set([0, ...list.map(k => GEN[k])])
  const sorted = [...gens].sort((a, b) => a - b)
  const rowOf = new Map(sorted.map((g, i) => [g, i]))
  const rows = sorted.length
  const byRow = sorted.map(() => [])
  for (const k of list) byRow[rowOf.get(GEN[k])].push({ key: k, o: ORDER[k] ?? 50 })
  byRow[rowOf.get(0)].push({ key: ME, o: 50 })
  const nodes = []
  byRow.forEach((items, r) => {
    items.sort((a, b) => a.o - b.o)
    const n = items.length
    items.forEach((it, i) => {
      nodes.push({
        key: it.key, gen: sorted[r], row: r,
        x: ((i + 0.5) / n) * 100,
        y: rows === 1 ? 50 : 10 + (r / (rows - 1)) * 80,
      })
    })
  })
  return { rows, nodes }
}

/** Vəfat edəndən varisə dirsəkli xətt (SVG yolu, 0…100 koordinatda; sonra viewBox ilə miqyaslanır) */
export function elbow(a, b) {
  if (Math.abs(a.y - b.y) < 0.01) return `M${a.x},${a.y} L${b.x},${b.y}`
  const my = (a.y + b.y) / 2
  return `M${a.x},${a.y} L${a.x},${my} L${b.x},${my} L${b.x},${b.y}`
}
