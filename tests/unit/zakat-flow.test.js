// Malın axını (components/ZakatFlow) — saf düzülüş hesabı
import { describe, it, expect } from 'vitest'
import { flowLayout, spreadLabels } from '../../src/utils/zakatFlow.js'

describe('flowLayout', () => {
  const sources = [{ key: 'cash', value: 9000, tone: 1 }, { key: 'gold', value: 3000, tone: 2 }, { key: 'x', value: 0 }]
  it('sol = varlıqlar, sağ = borc + zəkat + qalan (cəmlər tutur)', () => {
    const L = flowLayout({ sources, debt: 2000, net: 10000, zakat: 250 })
    expect(L.left.map(n => n.key)).toEqual(['cash', 'gold'])
    expect(L.right.map(n => [n.key, n.value])).toEqual([['debt', 2000], ['zakat', 250], ['rest', 9750]])
    const leftH = L.left.reduce((a, n) => a + n.h, 0)
    expect(leftH).toBeCloseTo(L.mid.h, 6)
    const midOut = L.right.reduce((a, n) => a + n.mh, 0)
    expect(midOut).toBeCloseTo(L.mid.h, 6)
  })
  it('kiçik zəkat lenti ən azı 3 vahid; nisabdan aşağı — zəkat qovşağı yoxdur; boş — null', () => {
    const L = flowLayout({ sources, net: 12000, zakat: 1 })
    expect(L.right.find(n => n.key === 'zakat').h).toBe(3)
    expect(flowLayout({ sources, net: 12000, zakat: 0 }).right.map(n => n.key)).toEqual(['rest'])
    expect(flowLayout({ sources: [{ key: 'a', value: 0 }], net: 0, zakat: 0 })).toBeNull()
  })
})

describe('spreadLabels', () => {
  it('yaxın etiketlər aralanır, sərhəddə qalır', () => {
    const out = spreadLabels([20, 22, 24], 30, 10, 200)
    expect(out).toEqual([20, 50, 80])
    expect(spreadLabels([195, 198], 30, 10, 200)).toEqual([170, 200])
  })
})
