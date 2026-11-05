// Miras ailə ağacı (utils/familyTree) — nəsil sıraları və mövqelər
import { describe, it, expect } from 'vitest'
import { treeLayout, elbow, ME } from '../../src/utils/familyTree.js'

describe('treeLayout', () => {
  it('yalnız mövcud nəsillər sıra olur; vəfat edən 0-cı nəsildədir', () => {
    const L = treeLayout(['father', 'mother', 'wife', 'sons', 'daughters'])
    expect(L.rows).toBe(3)
    const at = (k) => L.nodes.find(n => n.key === k)
    expect(at(ME).row).toBe(1)
    expect(at('father').row).toBe(0)
    expect(at('sons').row).toBe(2)
    expect(at('father').x).toBeLessThan(at('mother').x)   // ata tərəfi solda
    expect(at(ME).x).toBeLessThan(at('wife').x)          // həyat yoldaşı sağda
  })
  it('tək vəfat edən — bir sıra, mərkəzdə; naməlum açar atılır', () => {
    const L = treeLayout(['nope'])
    expect(L.rows).toBe(1)
    expect(L.nodes).toEqual([{ key: ME, gen: 0, row: 0, x: 50, y: 50 }])
  })
  it('elbow: eyni sırada düz xətt, fərqli sırada dirsək', () => {
    expect(elbow({ x: 10, y: 50 }, { x: 90, y: 50 })).toBe('M10,50 L90,50')
    expect(elbow({ x: 50, y: 50 }, { x: 20, y: 10 })).toBe('M50,50 L50,30 L20,30 L20,10')
  })
})
