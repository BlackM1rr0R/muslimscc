import { describe, it, expect } from 'vitest'
import { calculateInheritance, sumFractions, Fraction } from '../../src/utils/faraid.js'

// Klassik fəraiz məsələləri. Gözlənilən nəticələr standart fəraiz dərsliklərindəki
// məşhur məsələlərdir (İbn Useymin, "Təshil əl-Fəraiz"; islamweb.net 240214 — Öməriyyə;
// al-feqh.com — müştərəkə, Hənbəli görüşü; Buxari, 6737-dən əvvəlki bab — baba və qardaşlar).

const run = (heirs, deceased = 'male', extra = {}) =>
  calculateInheritance({ estate: 2400, deceased, heirs, ...extra })

const map = (res) => Object.fromEntries(res.shares.map(s => [s.heir, s]))
const fr = (res, heir) => map(res)[heir]?.fraction
const each = (res, heir) => map(res)[heir]?.fractionEach

// Varis olanların payları cəmi 1 (bölünməmiş qalıq da daxil)
const expectWhole = (res) => {
  const parts = res.shares.filter(s => s.type !== 'blocked').map(s => s.fraction)
  expect(sumFractions([...parts, res.unallocated])).toBe('1')
}

describe('Fraction', () => {
  it('reduces and adds exactly', () => {
    expect(Fraction.of(2, 4).toString()).toBe('1/2')
    expect(Fraction.of(1, 3).add(Fraction.of(1, 6)).toString()).toBe('1/2')
    expect(Fraction.of(1, 2).sub(Fraction.of(1, 2)).toString()).toBe('0')
  })
})

describe('calculateInheritance — classic cases', () => {
  it('1. wife + son + daughter: wife 1/8, son 2× daughter', () => {
    const r = run({ wife: 1, sons: 1, daughters: 1 })
    expect(fr(r, 'wife')).toBe('1/8')
    expect(fr(r, 'sons')).toBe('7/12')
    expect(fr(r, 'daughters')).toBe('7/24')
    expect(map(r).sons.type).toBe('asabah')
    expect(map(r).wife.total).toBeCloseTo(300)
    expectWhole(r)
  })

  it("2. 'Umariyyah: husband + mother + father → 1/2, 1/6, 1/3", () => {
    const r = run({ husband: 1, mother: 1, father: 1 }, 'female')
    expect(fr(r, 'husband')).toBe('1/2')
    expect(fr(r, 'mother')).toBe('1/6')
    expect(fr(r, 'father')).toBe('1/3')
    expect(map(r).mother.reasonKey).toBe('umariyyah')
    expect(r.notes).toContain('umariyyah')
    expectWhole(r)
  })

  it("3. 'Umariyyah: wife + mother + father → 1/4, 1/4, 1/2", () => {
    const r = run({ wife: 1, mother: 1, father: 1 })
    expect(fr(r, 'wife')).toBe('1/4')
    expect(fr(r, 'mother')).toBe('1/4')
    expect(fr(r, 'father')).toBe('1/2')
    expectWhole(r)
  })

  it("4. 'awl: husband + 2 full sisters + mother → base 6 raised to 8", () => {
    const r = run({ husband: 1, fullSisters: 2, mother: 1 }, 'female')
    expect(r.awl).toBe(true)
    expect(fr(r, 'husband')).toBe('3/8')
    expect(fr(r, 'fullSisters')).toBe('1/2')
    expect(each(r, 'fullSisters')).toBe('1/4')
    expect(fr(r, 'mother')).toBe('1/8')
    expect(map(r).husband.fard).toBe('1/2')
    expectWhole(r)
  })

  it("5. 'asabah ma'a al-ghayr: daughter + full sister → 1/2 each", () => {
    const r = run({ daughters: 1, fullSisters: 1 })
    expect(fr(r, 'daughters')).toBe('1/2')
    expect(fr(r, 'fullSisters')).toBe('1/2')
    expect(map(r).fullSisters.type).toBe('asabah')
    expect(map(r).fullSisters.reasonKey).toBe('sisterWithDaughters')
    expectWhole(r)
  })

  it('6. radd: mother + 2 daughters → 1/5 and 4/5', () => {
    const r = run({ mother: 1, daughters: 2 })
    expect(r.radd).toBe(true)
    expect(fr(r, 'mother')).toBe('1/5')
    expect(fr(r, 'daughters')).toBe('4/5')
    expect(each(r, 'daughters')).toBe('2/5')
    expectWhole(r)
  })

  it('7. radd excludes the spouse: husband + daughter → 1/4 and 3/4', () => {
    const r = run({ husband: 1, daughters: 1 }, 'female')
    expect(r.radd).toBe(true)
    expect(fr(r, 'husband')).toBe('1/4')
    expect(fr(r, 'daughters')).toBe('3/4')
    expectWhole(r)
  })

  it('8. grandfather excludes full brothers (view of Abu Bakr / Ibn Abbas)', () => {
    const r = run({ paternalGrandfather: 1, fullBrothers: 2, fullSisters: 1 })
    expect(fr(r, 'paternalGrandfather')).toBe('1')
    expect(map(r).fullBrothers.type).toBe('blocked')
    expect(map(r).fullBrothers.reasonKey).toBe('blockedByGrandfather')
    expect(map(r).fullSisters.type).toBe('blocked')
    expect(r.notes).toContain('grandfatherSiblings')
    expectWhole(r)
  })

  it('9. maternal siblings share the third equally (male = female)', () => {
    const r = run({ mother: 1, maternalBrothers: 2, maternalSisters: 1, fullUncles: 1 })
    expect(fr(r, 'mother')).toBe('1/6')
    expect(fr(r, 'maternalBrothers')).toBe('2/9')
    expect(each(r, 'maternalBrothers')).toBe('1/9')
    expect(each(r, 'maternalSisters')).toBe('1/9')
    expect(fr(r, 'fullUncles')).toBe('1/2')
    expectWhole(r)
  })

  it('10. son blocks brothers, sisters and uncles', () => {
    const r = run({ sons: 1, fullBrothers: 1, fullSisters: 1, maternalBrothers: 1, fullUncles: 1 })
    expect(fr(r, 'sons')).toBe('1')
    expect(map(r).fullBrothers.reasonKey).toBe('blockedBySon')
    expect(map(r).maternalBrothers.reasonKey).toBe('blockedByDescendant')
    expect(map(r).fullUncles.type).toBe('blocked')
    expectWhole(r)
  })

  it('11. father with a daughter: 1/6 + remainder → 1/2', () => {
    const r = run({ father: 1, daughters: 1 })
    expect(fr(r, 'daughters')).toBe('1/2')
    expect(fr(r, 'father')).toBe('1/2')
    expect(map(r).father.fard).toBe('1/6')
    expect(map(r).father.asabah).toBe(true)
    expectWhole(r)
  })

  it('12. mushtarakah (Hanbali): full brother gets nothing', () => {
    const r = run({ husband: 1, mother: 1, maternalBrothers: 2, fullBrothers: 1 }, 'female')
    expect(fr(r, 'husband')).toBe('1/2')
    expect(fr(r, 'mother')).toBe('1/6')
    expect(fr(r, 'maternalBrothers')).toBe('1/3')
    expect(fr(r, 'fullBrothers')).toBe('0')
    expect(map(r).fullBrothers.reasonKey).toBe('noRemainder')
    expect(r.notes).toContain('mushtarakah')
    expectWhole(r)
  })

  it("13. daughter + son's daughter + full brother → 1/2, 1/6 (takmila), 1/3", () => {
    const r = run({ daughters: 1, sonsDaughters: 1, fullBrothers: 1 })
    expect(fr(r, 'daughters')).toBe('1/2')
    expect(fr(r, 'sonsDaughters')).toBe('1/6')
    expect(fr(r, 'fullBrothers')).toBe('1/3')
    expectWhole(r)
  })

  it("14. two daughters block the son's daughter unless a son's son is with her", () => {
    const a = run({ daughters: 2, sonsDaughters: 1, fullUncles: 1 })
    expect(map(a).sonsDaughters.reasonKey).toBe('blockedByTwoDaughters')
    expect(fr(a, 'fullUncles')).toBe('1/3')
    const b = run({ daughters: 2, sonsDaughters: 1, sonsSons: 1 })
    expect(fr(b, 'daughters')).toBe('2/3')
    expect(fr(b, 'sonsSons')).toBe('2/9')
    expect(fr(b, 'sonsDaughters')).toBe('1/9')
    expectWhole(b)
  })

  it('15. full sister + paternal sister + paternal uncle → 1/2, 1/6, 1/3', () => {
    const r = run({ fullSisters: 1, paternalSisters: 1, paternalUncles: 1 })
    expect(fr(r, 'fullSisters')).toBe('1/2')
    expect(fr(r, 'paternalSisters')).toBe('1/6')
    expect(fr(r, 'paternalUncles')).toBe('1/3')
    expectWhole(r)
  })

  it('16. wife + father + mother + son → 1/8, 1/6, 1/6, 13/24', () => {
    const r = run({ wife: 1, father: 1, mother: 1, sons: 1 })
    expect(fr(r, 'wife')).toBe('1/8')
    expect(fr(r, 'father')).toBe('1/6')
    expect(fr(r, 'mother')).toBe('1/6')
    expect(fr(r, 'sons')).toBe('13/24')
    expectWhole(r)
  })

  it('17. blocked brothers still reduce the mother to 1/6', () => {
    const r = run({ husband: 1, mother: 1, father: 1, fullBrothers: 2 }, 'female')
    expect(fr(r, 'husband')).toBe('1/2')
    expect(fr(r, 'mother')).toBe('1/6')
    expect(fr(r, 'father')).toBe('1/3')
    expect(map(r).fullBrothers.reasonKey).toBe('blockedByFather')
    expectWhole(r)
  })

  it("18. 'awl to 10: husband + 2 full sisters + 2 maternal brothers + mother", () => {
    const r = run({ husband: 1, fullSisters: 2, maternalBrothers: 2, mother: 1 }, 'female')
    expect(r.awl).toBe(true)
    expect(fr(r, 'husband')).toBe('3/10')
    expect(fr(r, 'fullSisters')).toBe('2/5')
    expect(fr(r, 'maternalBrothers')).toBe('1/5')
    expect(fr(r, 'mother')).toBe('1/10')
    expectWhole(r)
  })

  it('19. two grandmothers share the sixth; four wives share the eighth', () => {
    const r = run({ wife: 4, maternalGrandmother: 1, paternalGrandmother: 1, sons: 2 })
    expect(fr(r, 'maternalGrandmother')).toBe('1/12')
    expect(fr(r, 'paternalGrandmother')).toBe('1/12')
    expect(fr(r, 'wife')).toBe('1/8')
    expect(each(r, 'wife')).toBe('1/32')
    expect(fr(r, 'sons')).toBe('17/24')
    expectWhole(r)
  })

  it('20. husband + full brother → 1/2 each; father blocks grandfather', () => {
    const a = run({ husband: 1, fullBrothers: 1 }, 'female')
    expect(fr(a, 'husband')).toBe('1/2')
    expect(fr(a, 'fullBrothers')).toBe('1/2')
    const b = run({ father: 1, paternalGrandfather: 1 })
    expect(map(b).paternalGrandfather.reasonKey).toBe('blockedByFather')
    expect(fr(b, 'father')).toBe('1')
  })

  it("21. full sister with daughters blocks the paternal brother", () => {
    const r = run({ daughters: 2, fullSisters: 1, paternalBrothers: 1 })
    expect(fr(r, 'daughters')).toBe('2/3')
    expect(fr(r, 'fullSisters')).toBe('1/3')
    expect(map(r).paternalBrothers.reasonKey).toBe('blockedByFullSisterAsabah')
  })

  it('22. spouse alone: remainder is unallocated (distant kin / court)', () => {
    const r = run({ wife: 1 })
    expect(fr(r, 'wife')).toBe('1/4')
    expect(r.unallocated).toBe('3/4')
    expect(r.notes).toContain('remainderNoHeirs')
    expectWhole(r)
  })

  it('23. husband/wife are hidden by deceased gender', () => {
    const r = run({ husband: 1, sons: 1 }, 'male')
    expect(map(r).husband).toBeUndefined()
    expect(fr(r, 'sons')).toBe('1')
  })
})

describe('estate deductions', () => {
  it('funeral → debts → wasiyyah capped at 1/3', () => {
    const r = calculateInheritance({ estate: 1000, funeral: 50, debts: 50, wasiyyah: 500, deceased: 'male', heirs: { sons: 1 } })
    expect(r.wasiyyah).toBeCloseTo(300)
    expect(r.wasiyyahCapped).toBe(true)
    expect(r.net).toBeCloseTo(600)
    expect(r.notes).toContain('wasiyyahCapped')
  })
  it('wasiyyah within 1/3 is kept; negatives ignored', () => {
    const r = calculateInheritance({ estate: 900, funeral: -5, debts: 0, wasiyyah: 100, deceased: 'female', heirs: { daughters: 1, husband: 1 } })
    expect(r.wasiyyahCapped).toBe(false)
    expect(r.net).toBeCloseTo(800)
    expect(map(r).husband.total).toBeCloseTo(200)
    expect(map(r).daughters.total).toBeCloseTo(600)
  })
})
