import { describe, it, expect } from 'vitest'
import { libHash, arcPath, routePath } from '../../src/utils/prophetLetters'
import { PL_LETTERS, PL_PLACES, PL_REFS, PL_IDS } from '../../src/data/prophetLetters'
import { BOOK_DATA, BOOKS } from '../../src/data/hadithLibrary'

const LANGS = ['az', 'en', 'ru', 'ar', 'tr']
const has5 = (o) => LANGS.every(l => typeof o?.[l] === 'string' && o[l].trim().length > 0)

describe('libHash', () => {
  it('Buxari 7 — 1-ci bölmə (Revelation)', () => {
    expect(libHash(PL_REFS.bukhari7, BOOK_DATA)).toBe('#bukhari/1/7')
  })
  it('Buxari 4424 — Məğazi (64), Buxari 1245 — Cənazə (23)', () => {
    expect(libHash(PL_REFS.bukhari4424, BOOK_DATA)).toBe('#bukhari/64/4424')
    expect(libHash(PL_REFS.bukhari1245, BOOK_DATA)).toBe('#bukhari/23/1245')
  })
  it('Müslim 1774 — kitabxana nömrəsi 4609, Cihad kitabı (32)', () => {
    expect(libHash(PL_REFS.muslim1774, BOOK_DATA)).toBe('#muslim/32/4609')
    expect(libHash(PL_REFS.muslim1773, BOOK_DATA)).toBe('#muslim/32/4607')
  })
  it('bölmə tapılmasa yalnız kitab', () => {
    expect(libHash({ book: 'bukhari', lib: 999999 }, BOOK_DATA)).toBe('#bukhari')
    expect(libHash({ book: 'nope', lib: 1 }, BOOK_DATA)).toBe('#nope')
  })
})

describe('arcPath / routePath', () => {
  it('iki nöqtə → bir Q əyrisi', () => {
    expect(arcPath([0, 0], [100, 0], 0.2)).toBe('M0 0Q50 20 100 0')
  })
  it('üç nöqtə → bir M və iki Q', () => {
    const d = routePath([[0, 0], [100, 0], [100, 100]])
    expect(d.match(/M/g)).toHaveLength(1)
    expect(d.match(/Q/g)).toHaveLength(2)
    expect(d.endsWith('100 100')).toBe(true)
  })
  it('bir nöqtə və ya boş → boş sətir', () => {
    expect(routePath([[1, 1]])).toBe('')
    expect(routePath(null)).toBe('')
  })
})

describe('məlumat (mənbə qaydası)', () => {
  it('yalnız mənbəli məktublar: heraclius, khosrow, negus', () => {
    expect(PL_IDS).toEqual(['heraclius', 'khosrow', 'negus'])
  })
  it('hər istinad mövcuddur, kitab saytın kitabxanasındadır, keçid bölməyə düşür', () => {
    const used = new Set()
    for (const l of PL_LETTERS) {
      const ids = [...l.refs, ...(l.envoy?.refs || []), ...(l.when?.refs || []), ...l.facts.flatMap(f => f.refs), ...(l.context?.refs || []), ...(l.quote ? [l.quote.ref] : [])]
      for (const id of ids) {
        expect(PL_REFS[id], `${l.id}: ${id}`).toBeTruthy()
        used.add(id)
      }
    }
    for (const id of used) {
      const r = PL_REFS[id]
      expect(BOOKS.some(b => b.key === r.book)).toBe(true)
      expect(libHash(r, BOOK_DATA).split('/')).toHaveLength(3)
    }
  })
  it('Buxari nömrələri kitabxana nömrəsi ilə eynidir', () => {
    for (const r of Object.values(PL_REFS).filter(x => x.book === 'bukhari')) expect(String(r.lib)).toBe(r.n)
  })
  it('bütün mətnlər 5 dildə; marşrut yerləri mövcuddur və Mədinədən başlayır', () => {
    for (const l of PL_LETTERS) {
      expect(has5(l.ruler) && has5(l.realm) && has5(l.place)).toBe(true)
      if (l.envoy) expect(has5(l.envoy.name)).toBe(true)
      if (l.when) expect(has5(l.when.text)).toBe(true)
      if (l.context) expect(has5(l.context.text)).toBe(true)
      expect(l.facts.length).toBeGreaterThan(0)
      l.facts.forEach(f => expect(has5(f.text)).toBe(true))
      expect(l.route[0]).toBe('medina')
      l.route.forEach(p => expect(PL_PLACES[p]).toBeTruthy())
      expect(l.route).toContain(l.seat)
      expect(/^#[0-9a-f]{6}$/i.test(l.color)).toBe(true)
    }
    Object.values(PL_PLACES).forEach(p => { expect(has5(p.name)).toBe(true); expect(p.at).toHaveLength(2) })
  })
  it('ərəb sitatı yalnız ərəb hərfləri və hərəkələrdən ibarətdir (tərcümə deyil)', () => {
    for (const l of PL_LETTERS.filter(x => x.quote)) expect(/^[؀-ۿ\s]+$/.test(l.quote.ar)).toBe(true)
  })
  it('Nəcaşi: elçi göstərilmir (mənbədə yoxdur)', () => {
    expect(PL_LETTERS.find(l => l.id === 'negus').envoy).toBeNull()
  })
})
